/**
 * A tiny router that behaves like the small part of Express.Router() the site
 * actually uses, and runs anywhere.
 *
 * Why: the page routes have to work in two places. On Node they are mounted in
 * Express, which supplies req.query, req.body and res.render. In a Cloudflare
 * Worker there is no Express at all - it is built on Node internals a Worker
 * does not have - so the routes would otherwise have to be written twice and
 * kept in sync by hand.
 *
 * This module is a plain middleware function, which means Express happily
 * mounts it with app.use() and the Worker can call it directly. Both sides get
 * the exact same routing behaviour, including the 404 and error paths.
 *
 * Supported: use(), get(), post(), literal segments and :params.
 *   '/', '/games', '/people/:username', '/messages/:id'
 */

/** Turns '/people/:username' into something that matches a pathname. */
function compile(pattern) {
  const segments = String(pattern).split('/').filter((segment) => segment !== '');

  return function match(pathname) {
    const parts = String(pathname).split('/').filter((segment) => segment !== '');
    if (parts.length !== segments.length) return null;

    const params = {};
    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i];
      if (segment.charAt(0) === ':') {
        let value = parts[i];
        try {
          value = decodeURIComponent(value);
        } catch (error) {
          // A malformed escape is a bad request, not a crash: keep the raw text.
        }
        params[segment.slice(1)] = value;
      } else if (segment !== parts[i]) {
        return null;
      }
    }
    return params;
  };
}

function Router() {
  const middlewares = [];
  const routes = [];

  function use(a, b) {
    const handler = typeof a === 'function' ? a : b;
    const prefix = typeof a === 'string' ? a : '/';
    middlewares.push({ prefix, handler });
    return router;
  }

  function add(method, pattern, handler) {
    routes.push({ method, match: compile(pattern), handler });
  }

  function underPrefix(pathname, prefix) {
    if (!prefix || prefix === '/') return true;
    return pathname === prefix || pathname.startsWith(prefix + '/');
  }

  /** First matching route wins; null means nothing matched. */
  function findRoute(req) {
    const method = String(req.method || 'GET').toUpperCase();
    for (const route of routes) {
      if (route.method !== method) continue;
      const params = route.match(req.path || '/');
      if (params) return { route, params };
    }
    return null;
  }

  function runMiddleware(req, res, done, index) {
    if (index >= middlewares.length) return done();
    const middleware = middlewares[index];
    if (!underPrefix(req.path || '/', middleware.prefix)) {
      return runMiddleware(req, res, done, index + 1);
    }

    let advanced = false;
    const next = (error) => {
      if (advanced) return;
      advanced = true;
      if (error) return done(error);
      runMiddleware(req, res, done, index + 1);
    };

    try {
      middleware.handler(req, res, next);
    } catch (error) {
      next(error);
    }
  }

  /**
   * The middleware. Express calls this with (req, res, next); the Worker calls
   * it with the same three things and its own req/res objects.
   */
  function router(req, res, next) {
    const fallback = next || ((error) => {
      if (error) throw error;
    });

    runMiddleware(req, res, (middlewareError) => {
      if (middlewareError) return fallback(middlewareError);

      const found = findRoute(req);
      if (!found) return fallback();

      req.params = found.params;
      try {
        found.route.handler(req, res, fallback);
      } catch (error) {
        fallback(error);
      }
      return undefined;
    }, 0);
  }

  router.use = use;
  router.get = (pattern, handler) => {
    add('GET', pattern, handler);
    return router;
  };
  router.post = (pattern, handler) => {
    add('POST', pattern, handler);
    return router;
  };

  return router;
}

module.exports = { Router };
