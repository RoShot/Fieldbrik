#!/usr/bin/env node
/**
 * Proves the compiled views render byte-identically to EJS.
 *
 * Every page is requested from the real Express app. Each res.render call is
 * recorded with the locals it was given, then the same view and locals are
 * rendered twice: once by Express (real EJS) and once by the compiled module
 * that ships to the Worker. Any difference is a bug in the compiler and the
 * Worker build is not safe to ship.
 *
 * Usage: node scripts/verify-views.js
 */

const express = require('express');
const views = require('../server/views.generated');

const records = [];
const originalRender = express.response.render;

express.response.render = function patched(view, opts, cb) {
  let options = opts;
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  records.push({
    view,
    locals: Object.assign({}, this.app.locals, this.locals, options || {}),
  });
  return originalRender.call(this, view, options, cb);
};

// Required after the patch so the app picks up the patched response object.
const app = require('../server/app');

const BASE_PATHS = [
  '/', '/my-page', '/parents', '/carpenters-club', '/help', '/about', '/support',
  '/games', '/catalog', '/people', '/forum', '/news', '/terms', '/privacy',
  '/login', '/register', '/character', '/inventory', '/friends', '/messages',
  '/settings', '/parents/guide', '/parents/safety', '/parents/learning',
  '/parents/faq', '/parents/guestbook', '/messages/1',
];

/** Detail pages: pull a couple of real links out of each index page. */
const DISCOVER = [
  { from: '/games', pattern: /\/games\/([a-z0-9-]+)/gi, max: 2 },
  { from: '/catalog', pattern: /\/catalog\/([a-z0-9-]+)/gi, max: 2 },
  { from: '/people', pattern: /\/people\/([A-Za-z0-9_]+)/g, max: 2 },
  { from: '/news', pattern: /\/news\/([a-z0-9-]+)/gi, max: 2 },
  { from: '/forum', pattern: /\/forum\/([a-z0-9-]+)/gi, max: 2 },
];

/**
 * Pages that require a session. This harness has none, so the correct answer
 * for them is a redirect to the form rather than a rendered page; anything else
 * that renders nothing is still a failure.
 */
const GUARDED_PATHS = new Set([
  '/my-page', '/character', '/inventory', '/friends', '/messages', '/messages/1', '/settings',
]);

async function fetchText(base, pathname) {
  const res = await fetch(base + pathname);
  return { status: res.status, body: await res.text() };
}

function renderWithExpress(view, locals) {
  return new Promise((resolve, reject) => {
    app.render(view, locals, (err, html) => (err ? reject(err) : resolve(html)));
  });
}

/** First difference between two strings, with a little context. */
function describeMismatch(expected, actual) {
  let i = 0;
  const limit = Math.min(expected.length, actual.length);
  while (i < limit && expected[i] === actual[i]) i += 1;
  const from = Math.max(0, i - 60);
  return {
    at: i,
    expected: JSON.stringify(expected.slice(from, i + 90)),
    actual: JSON.stringify(actual.slice(from, i + 90)),
  };
}

async function main() {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  const paths = [...BASE_PATHS];
  for (const rule of DISCOVER) {
    const { body } = await fetchText(base, rule.from);
    const seen = new Set();
    for (const match of body.matchAll(rule.pattern)) {
      const pathname = match[0];
      if (seen.has(pathname) || paths.includes(pathname)) continue;
      seen.add(pathname);
      paths.push(pathname);
      if (seen.size >= rule.max) break;
    }
  }

  const failures = [];
  let checked = 0;

  for (const pathname of paths) {
    const before = records.length;
    const { status } = await fetchText(base, pathname);
    const rendered = records.slice(before);
    if (rendered.length === 0) {
      if (GUARDED_PATHS.has(pathname) && status >= 300 && status < 400) continue;
      failures.push(`${pathname}: rendered nothing (status ${status})`);
      continue;
    }
    for (const record of rendered) {
      checked += 1;
      let expected;
      try {
        expected = await renderWithExpress(record.view, record.locals);
      } catch (err) {
        failures.push(`${pathname} -> ${record.view}: EJS failed: ${err.message}`);
        continue;
      }
      let actual;
      try {
        actual = views.render(record.view, record.locals);
      } catch (err) {
        failures.push(`${pathname} -> ${record.view}: compiled view threw: ${err.message}`);
        continue;
      }
      if (expected !== actual) {
        const diff = describeMismatch(expected, actual);
        failures.push(
          `${pathname} -> ${record.view}: differs at char ${diff.at}\n` +
            `      ejs:      ${diff.expected}\n      compiled: ${diff.actual}`
        );
      }
    }
  }

  server.close();

  console.log(`Pages requested: ${paths.length}`);
  console.log(`Renders compared: ${checked}`);
  if (failures.length === 0) {
    console.log('All compiled views match EJS exactly.');
    return;
  }
  console.log(`\n${failures.length} mismatch(es):\n`);
  for (const failure of failures) console.log(`  - ${failure}`);
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
