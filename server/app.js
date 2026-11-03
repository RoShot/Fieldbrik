/**
 * FieldBrik application wiring.
 *
 * Keep this file small: middleware order, view engine, routers. Page logic
 * belongs in server/routes/*, and business logic in server/services/*.
 */

const path = require('path');
const express = require('express');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const pageRoutes = require('./routes/pages');

const app = express();

// Views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Static assets (CSS, client JS). No image assets exist yet - see docs.
app.use(
  express.static(path.join(__dirname, '..', 'public'), {
    // No caching in development: a stale stylesheet during the build hides new
    // rules and looks like a bug in the page. Production keeps the hour.
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
    extensions: ['html'],
  })
);

// The avatar renderer lives in public/avatar, so the static mount above already
// serves it at /avatar/*. A Worker can only publish one assets directory, and
// keeping it in public/ means both runtimes serve the same URLs from the same
// files - there is no second mount to forget about.

// Form bodies. No multipart uploads yet; those arrive with the avatar/catalog work.
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Account routes first: they answer POST /login, /register and /logout. On
// this server there is no database, so they reply 503 rather than half-working.
app.use('/', authRoutes);

// The panel, for the same reason as the Worker: it gates /admin itself.
app.use('/', adminRoutes);

app.use('/', pageRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('pages/error', {
    pageTitle: 'Page not found',
    statusCode: 404,
    message: 'That page does not exist on FieldBrik.',
  });
});

// Central error handler - every unhandled route error lands here, once.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[fieldbrik] unhandled error:', err);
  res.status(500).render('pages/error', {
    pageTitle: 'Something went wrong',
    statusCode: 500,
    message: 'An unexpected error occurred. Please try again.',
  });
});

module.exports = app;
