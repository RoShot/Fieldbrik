/**
 * Account routes: two pages, two forms.
 *
 * Signing up and signing in are separate. The sign-up page asks for a name, a
 * birthday, a gender and a password, and creates the account. The log-in page
 * asks for a name and a password and does nothing else: it never falls through
 * to creating an account, so a mistyped name cannot silently register somebody.
 *
 * The handlers are async because password hashing and every database call are.
 * Each route wrapper returns its promise: the Worker's router parks a returned
 * promise and waits for it, and a block body that swallowed the return value
 * made the request fall through to the page router and 404.
 */

const { Router } = require('../lib/router');
const accounts = require('../services/accounts');
const loginThrottle = require('../services/loginThrottle');
const pageContext = require('../services/pageContext');

const router = Router();

const COOKIE = accounts.SESSION_COOKIE;

// The sign-up form's option lists. Built here rather than inside the template:
// a `const` in a compiled view would collide with the local of the same name.
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = Array.from({ length: 31 }, (unused, index) => index + 1);

function yearOptions() {
  const now = new Date().getUTCFullYear();
  const out = [];
  for (let year = now; year >= 1900; year -= 1) out.push(year);
  return out;
}

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

function renderLogin(req, res, status, error, values) {
  return res.status(status).render(
    'pages/login',
    pageContext(req, {
      pageTitle: 'Log In - FieldBrik',
      error: error || null,
      values: values || null,
    })
  );
}

function renderSignUp(req, res, status, error, values) {
  return res.status(status).render(
    'pages/register',
    pageContext(req, {
      pageTitle: 'Sign Up - FieldBrik',
      error: error || null,
      values: values || null,
      // This page's own stylesheet: the sign-up screen is the one page that
      // replaces the header banner with the wordmark, and those rules should not
      // load anywhere else.
      extraCss: '/css/signup.css',
      bodyClass: 'fb-signup',
      months: MONTH_NAMES,
      days: DAYS,
      years: yearOptions(),
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

/**
 * The client address, for the per-address half of the rate limit.
 *
 * Cloudflare sets cf-connecting-ip; a forwarded header is the fallback for a
 * local run. An empty string just means the address check is skipped, because
 * the per-name check is the one that matters.
 */
function clientAddress(req) {
  const headers = (req && req.headers) || {};
  const raw = headers['cf-connecting-ip'] || headers['x-forwarded-for'] || '';
  return String(raw).split(',')[0].trim();
}

async function signIn(db, req, res, user) {
  const session = await accounts.createSession(db, user.id, {
    userAgent: (req.headers && req.headers['user-agent']) || '',
  });

  setSessionCookie(req, res, session);
  return res.redirect('/my-page');
}

async function handleLogin(req, res) {
  if (!req.db) return databaseMissing(req, res);

  const body = req.body || {};
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const ip = clientAddress(req);

  const existing = await accounts.findByUsername(req.db, username);

  // A name nobody holds gets the same answer as a wrong password, and costs the
  // same derivation inside authenticate(), so the form cannot be used to work
  // out which names exist.
  if (!existing) {
    return renderLogin(req, res, 400, 'That username and password do not match.', { username });
  }

  // The limit is tested before the password, so a locked name is refused
  // without spending a PBKDF2 derivation on it.
  const blocked = await loginThrottle.check(req.db, { username, ip });

  if (blocked) {
    return renderLogin(
      req,
      res,
      429,
      `Too many failed attempts with that name. Try again in ${blocked.minutes} minutes.`,
      { username }
    );
  }

  try {
    const user = await accounts.authenticate(req.db, { username, password });
    await loginThrottle.clear(req.db, { username });
    return await signIn(req.db, req, res, user);
  } catch (error) {
    if (!(error instanceof accounts.AccountError)) throw error;

    await loginThrottle.record(req.db, { username, ip });
    return renderLogin(req, res, 400, error.message, { username });
  }
}

async function handleRegister(req, res) {
  if (!req.db) return databaseMissing(req, res);

  const body = req.body || {};
  const username = String(body.username || '').trim();

  // Carried back into the form when something is refused, so a member does not
  // have to re-pick a birthday because the password was too short.
  const values = {
    username,
    birthMonth: String(body['birth-month'] || ''),
    birthDay: String(body['birth-day'] || ''),
    birthYear: String(body['birth-year'] || ''),
    gender: String(body.gender || ''),
  };

  try {
    const profile = accounts.validateProfile({
      birthMonth: values.birthMonth,
      birthDay: values.birthDay,
      birthYear: values.birthYear,
      gender: values.gender,
    });

    const taken = await accounts.findByUsername(req.db, username);

    if (taken) {
      return renderSignUp(
        req,
        res,
        400,
        'That username is already taken. Choose another, or log in instead.',
        values
      );
    }

    const email = String(body.email || '').trim();

    // A poisoned account's address is blacklisted, so the same email cannot be
    // used to register again. Checked here, before anything is created, so a
    // refused address never leaves a row behind.
    if (email) {
      const blockedEmail = await req.db
        .prepare('SELECT email_lower FROM blacklisted_emails WHERE email_lower = ?')
        .bind(email.toLowerCase())
        .first();

      if (blockedEmail) {
        return renderSignUp(
          req,
          res,
          400,
          'That email address cannot be used for a new account.',
          values
        );
      }
    }

    const created = await accounts.register(req.db, {
      username,
      password: body.password,
      confirm: body.confirm,
      email,
      profile,
    });

    return await signIn(req.db, req, res, created);
  } catch (error) {
    if (error instanceof accounts.AccountError) {
      return renderSignUp(req, res, 400, error.message, values);
    }
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

// The sign-up page. Ahead of the page router, which still redirects this path to
// the old combined form.
router.get('/register', (req, res) => {
  if (req.viewer) return res.redirect('/my-page');
  return renderSignUp(req, res, 200, null, null);
});

router.post('/login', (req, res, next) => handleLogin(req, res).catch(next));

router.post('/register', (req, res, next) => handleRegister(req, res).catch(next));

router.post('/logout', (req, res, next) => handleLogout(req, res).catch(next));

// The profile sidebar links here directly.
router.get('/logout', (req, res, next) => handleLogout(req, res).catch(next));

module.exports = router;
module.exports.COOKIE = COOKIE;
