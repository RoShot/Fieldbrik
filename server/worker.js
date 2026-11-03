/**
 * Cloudflare Worker entry point.
 *
 * The same page routes, the same compiled views and the same assets as the
 * Express server - only the runtime differs. Two things make that possible:
 *
 *   server/lib/router.js
 *     The routes are written against a router that is a plain middleware
 *     function, so Express mounts it and this file calls it directly.
 *
 *   server/views.generated.js
 *     The EJS templates, compiled to plain functions at build time. A Worker
 *     has no `new Function`, so EJS cannot compile anything at request time.
 *
 * Static files come from the ASSETS binding, which serves public/ exactly as
 * Express serves it in development.
 */

import views from './views.generated.js';
import routesModule from './routes/pages.js';
import site from './config/site.js';

// esbuild's CommonJS interop: the router is module.exports, so it can arrive as
// either the default or the namespace depending on how it was bundled.
const routes = routesModule.default || routesModule;

/** Anything that is a file rather than a page. */
const STATIC_PREFIXES = ['/css/', '/js/', '/avatar/'];

function isStatic(pathname) {
  if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return /\.[a-z0-9]+$/i.test(pathname);
}

/** A response object with the handful of Express methods the routes use. */
function createResponse() {
  const state = {
    status: 200,
    headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
    body: '',
  };

  const res = {
    locals: {},

    status(code) {
      state.status = code;
      return res;
    },

    render(view, locals) {
      state.headers.set('content-type', 'text/html; charset=utf-8');
      state.body = views.render(view, Object.assign({}, res.locals, locals));
      return res;
    },

    json(data) {
      state.headers.set('content-type', 'application/json; charset=utf-8');
      state.body = JSON.stringify(data);
      return res;
    },

    send(text) {
      state.body = String(text);
      return res;
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
  };

  // Handlers answer by writing to res, the way they do in Express - they only
  // call next() to mean "nothing here" or to report a failure. Nothing calls
  // back when a page renders, so the result is read off the response instead of
  // being awaited.
  let failure = null;
  try {
    routes(req, res, (error) => {
      failure = error || null;
    });
  } catch (error) {
    failure = error;
  }

  if (failure) {
    console.error('[fieldbrik] unhandled error:', failure && failure.stack ? failure.stack : failure);
    res.status(500).render('pages/error', {
      pageTitle: 'Something went wrong',
      statusCode: 500,
      message: 'An unexpected error occurred. Please try again.',
    });
  } else if (!state.body) {
    res.status(404).render('pages/error', {
      pageTitle: 'Page not found',
      statusCode: 404,
      message: 'That page does not exist on FieldBrik.',
    });
  }

  // Pages are per-request HTML; never let an edge or browser cache them.
  state.headers.set('cache-control', 'no-store');
  state.headers.set('x-fieldbrik', site.version);

  return new Response(state.body, { status: state.status, headers: state.headers });
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
