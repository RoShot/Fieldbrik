/**
 * Account routes: one page, one form.
 *
 * A visitor types a name and a password. A free name becomes an account; a name
 * that already exists is signed in when the password matches. That is both
 * registration and log-in, which is why there is one form and not two.
 *
 * The handlers are async because password hashing and every database call are.
 * Each route wrapper returns its promise: the Worker's router parks a returned
 * promise and waits for it, and a block body that swallowed the return value
 * made the request fall through to the page router and 404.
 */

const { Router } = require('../lib/router');
const accounts = require('../services/accounts');
const pageContext = require('../services/pageContext');

const router = Router();

const COOKIE = 'fb_session';

function databaseMissing(req, res) {
  return res.status(503).render(
    'pages/error',
    pageContext(req, {
      pageTitle: 'Accounts unavailable',
      statusCode: 503,
      message:
        'Accounts need the database, and this server was started without one. Run the site with `npx wrangler dev` to sign in.',
    })
  );
}

function renderForm(req, res, status, error, values) {
  return res.status(status).render(
    'pages/login',
    pageContext(req, {
      pageTitle: 'Log In - FieldBrik',
      error: error || null,
      values: values || null,
    })
  );
}

function setSessionCookie(req, res, session) {
  res.cookie(COOKIE, session.token, {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    // Secure only over https, so a local http run can still sign in.
    secure: Boolean(req.secure),
    maxAge: new Date(session.expires).getTime() - Date.now(),
  });
}

async function signIn(db, req, res, user) {
  const session = await accounts.createSession(db, user.id, {
    userAgent: (req.headers && req.headers['user-agent']) || '',
  });

  setSessionCookie(req, res, session);
  return res.redirect('/my-page');
}

async function handleSignIn(req, res) {
  if (!req.db) return databaseMissing(req, res);

  const body = req.body || {};
  const username = String(body.username || '').trim();
  const password = String(body.password || '');

  try {
    const existing = await accounts.findByUsername(req.db, username);

    if (existing) {
      // The name is taken, so this is a log-in: only the password is checked,
      // and a wrong one is refused. It never falls through to registering.
      const user = await accounts.authenticate(req.db, { username, password });
      return await signIn(req.db, req, res, user);
    }

    const created = await accounts.register(req.db, { username, password });
    return await signIn(req.db, req, res, created);
  } catch (error) {
    if (error instanceof accounts.AccountError) {
      return renderForm(req, res, 400, error.message, { username });
    }

    // TEMPORARY DIAGNOSTIC - removed once the deployed failure is understood.
    res.setHeader('x-fb-error', String((error && error.message) || error).slice(0, 300));
    throw error;
  }
}

async function handleLogout(req, res) {
  const token = req.cookies ? req.cookies[COOKIE] : null;

  if (req.db && token) {
    await accounts.destroySession(req.db, token);
  }

  res.clearCookie(COOKIE, { path: '/' });
  return res.redirect('/');
}

router.post('/login', (req, res, next) => handleSignIn(req, res).catch(next));

// Links and bookmarks from the two-form version still post here.
router.post('/register', (req, res, next) => handleSignIn(req, res).catch(next));

router.post('/logout', (req, res, next) => handleLogout(req, res).catch(next));

// The profile sidebar links here directly.
router.get('/logout', (req, res, next) => handleLogout(req, res).catch(next));

module.exports = router;
module.exports.COOKIE = COOKIE;
