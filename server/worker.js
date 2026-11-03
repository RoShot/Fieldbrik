/**
 * Cloudflare Worker entry point.
 *
 * The same page routes, the same compiled views and the same assets as the
 * Express server - only the runtime differs. Three things make that possible:
 *
 *   server/lib/router.js
 *     The routes are written against a router that is a plain middleware
 *     function, so Express mounts it and this file calls it directly.
 *
 *   server/views.generated.js
 *     The EJS templates, compiled to plain functions at build time. A Worker
 *     has no `new Function`, so EJS cannot compile anything at request time.
 *
 *   the response shim below
 *     The routes were written against the handful of Express methods the site
 *     uses. The object built here has the same methods, so a route does not
 *     know which runtime it is in.
 *
 * Static files come from the ASSETS binding, which serves public/ exactly as
 * Express serves it in development.
 */

import views from './views.generated.js';
import pagesModule from './routes/pages.js';
import authModule from './routes/auth.js';
import site from './config/site.js';
import accounts from './services/accounts.js';
import pageContext from './services/pageContext.js';

// esbuild's CommonJS interop: a router is module.exports, so it can arrive as
// either the default or the namespace depending on how it was bundled.
const pageRoutes = pagesModule.default || pagesModule;
const authRoutes = authModule.default || authModule;

const COOKIE = 'fb_session';

/** Anything that is a file rather than a page. */
const STATIC_PREFIXES = ['/css/', '/js/', '/avatar/'];

function isStatic(pathname) {
  if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return /\.[a-z0-9]+$/i.test(pathname);
}

function parseCookies(header) {
  const jar = {};

  if (!header) return jar;

  for (const part of String(header).split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const name = part.slice(0, index).trim();
    if (!name) continue;
    let value = part.slice(index + 1).trim();
    try {
      value = decodeURIComponent(value);
    } catch (error) {
      // A malformed escape is not worth a 500; keep the raw text.
    }
    jar[name] = value;
  }

  return jar;
}

/**
 * A response object with the handful of Express methods the routes use.
 *
 * Cookies are collected separately because a header can legitimately repeat,
 * and Headers.append is the only way to send more than one.
 */
function createResponse() {
  const state = {
    status: 200,
    headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
    cookies: [],
    body: '',
    // Set by any method that produces a response. The routers use it instead
    // of testing for an empty body, which cannot tell "answered with a
    // redirect" or "answered and also cleared a cookie" from "did not answer".
    answered: false,
  };

  const res = {
    locals: {},

    status(code) {
      state.status = code;
      return res;
    },

    setHeader(name, value) {
      state.headers.set(name, value);
      return res;
    },

    render(view, locals) {
      state.headers.set('content-type', 'text/html; charset=utf-8');
      state.answered = true;
      state.body = views.render(view, Object.assign({}, res.locals, locals));
      return res;
    },

    json(data) {
      state.headers.set('content-type', 'application/json; charset=utf-8');
      state.answered = true;
      state.body = JSON.stringify(data);
      return res;
    },

    send(text) {
      state.answered = true;
      state.body = String(text);
      return res;
    },

    redirect(url) {
      state.status = 303;
      state.headers.set('location', String(url));
      state.answered = true;
      state.body = '';
      return res;
    },

    // Same shape as Express's res.cookie, so the routes are shared.
    cookie(name, value, options) {
      const parts = [`${name}=${encodeURIComponent(value)}`];
      const opts = options || {};

      parts.push(`Path=${opts.path || '/'}`);
      if (opts.maxAge !== undefined) {
        parts.push(`Max-Age=${Math.floor(opts.maxAge / 1000)}`);
      }
      if (opts.httpOnly) parts.push('HttpOnly');
      if (opts.secure) parts.push('Secure');
      if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);

      state.cookies.push(parts.join('; '));
      return res;
    },

    clearCookie(name, options) {
      return res.cookie(name, '', { ...(options || {}), maxAge: 0 });
    },
  };

  return { res, state };
}

async function readBody(request) {
  const type = request.headers.get('content-type') || '';
  if (request.method === 'GET' || request.method === 'HEAD') return {};

  try {
    if (type.includes('application/json')) {
      return (await request.json()) || {};
    }
    if (type.includes('application/x-www-form-urlencoded')) {
      const form = new URLSearchParams(await request.text());
      const body = {};
      for (const [key, value] of form) body[key] = value;
      return body;
    }
  } catch (error) {
    // A malformed body is the caller's problem; the route validates it anyway.
  }
  return {};
}

/**
 * Runs one router and resolves when it has answered.
 *
 * A handler either writes to res and returns, calls next(), or returns a
 * promise (the account routes, which hash and query). This waits for whichever
 * of those happened before the response is read.
 */
function runRouter(router, req, res) {
  return new Promise((resolve) => {
    let finished = false;

    // Cleared per router: a promise left over from an earlier router would be
    // waited on again and the answer to this one would never be seen.
    req.pending = null;

    const finish = (error) => {
      if (finished) return;
      finished = true;
      resolve(error || null);
    };

    try {
      router(req, res, finish);
    } catch (error) {
      finish(error);
      return;
    }

    if (req.pending) {
      req.pending.then(() => finish(null), (error) => finish(error));
    } else if (!finished) {
      // Answered synchronously without calling next().
      finish(null);
    }
  });
}

async function handlePage(request, url, env) {
  const { res, state } = createResponse();

  const query = {};
  for (const [key, value] of url.searchParams) query[key] = value;

  const req = {
    method: request.method === 'HEAD' ? 'GET' : request.method,
    path: url.pathname,
    query,
    params: {},
    body: await readBody(request),
    headers: Object.fromEntries(request.headers),
    cookies: parseCookies(request.headers.get('cookie')),
    secure: url.protocol === 'https:',
    db: env.DB || null,
    viewer: null,
  };

  // Resolve the session once, before any route runs, so every page sees the
  // same viewer and the account routes can rely on req.cookies being parsed.
  let failure = null;

  if (req.db) {
    try {
      const user = await accounts.userForToken(req.db, req.cookies[COOKIE]);

      if (user) {
        const restriction = await accounts.activeRestriction(req.db, user.id);

        if (restriction) {
          // A restricted account is treated as signed out, everywhere, because
          // the check is here rather than in each page.
          res.clearCookie(COOKIE, { path: '/' });
        } else {
          req.user = user;
          req.viewer = await accounts.loadViewer(req.db, user);
          req.cookies.live = '1';
        }
      }
    } catch (error) {
      console.error('[fieldbrik] session lookup failed:', error && error.stack ? error.stack : error);
    }
  }

  failure = await runRouter(authRoutes, req, res);

  if (!failure && !state.answered) {
    failure = await runRouter(pageRoutes, req, res);
  }

  // The error page carries the site chrome like any other page, so it needs
  // the same shared locals; without them it throws a second time and the
  // failure stops being visible at all.
  if (failure) {
    console.error('[fieldbrik] unhandled error:', failure && failure.stack ? failure.stack : failure);
    res.status(500).render(
      'pages/error',
      pageContext(req, {
        pageTitle: 'Something went wrong',
        statusCode: 500,
        message: 'An unexpected error occurred. Please try again.',
      })
    );
  } else if (!state.answered) {
    res.status(404).render(
      'pages/error',
      pageContext(req, {
        pageTitle: 'Page not found',
        statusCode: 404,
        message: 'That page does not exist on FieldBrik.',
      })
    );
  }

  // Pages are per-request HTML; never let an edge or browser cache them.
  state.headers.set('cache-control', 'no-store');
  state.headers.set('x-fieldbrik', site.version);

  for (const cookie of state.cookies) {
    state.headers.append('set-cookie', cookie);
  }

  return new Response(state.body || null, { status: state.status, headers: state.headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (isStatic(url.pathname)) {
      try {
        return await env.ASSETS.fetch(request);
      } catch (error) {
        return new Response('Not found', { status: 404 });
      }
    }

    return handlePage(request, url, env);
  },
};
