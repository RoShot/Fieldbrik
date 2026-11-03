#!/usr/bin/env node
/**
 * Compiles views/**\/*.ejs into server/views.generated.js.
 *
 * Why this exists: EJS builds every template with `new Function`, and a
 * Cloudflare Worker has no `new Function` at all. So the templates are compiled
 * here, on Node, at build time, and the Worker only ever ships plain functions.
 * The .ejs files stay the single source of truth - there is nothing to keep in
 * sync by hand.
 *
 * Two details make the output runnable in a Worker:
 *
 *   _with: false
 *     `with` is a syntax error in strict mode, and Worker modules are always
 *     strict. In this mode EJS emits bare identifiers instead.
 *
 *   the prologue
 *     Bare identifiers would be ReferenceErrors, so each compiled function gets
 *     a preamble that reads every name it mentions off `locals`. Reading a name
 *     the template does not have just yields undefined, which is what EJS does
 *     anyway.
 *
 * Rebuild with: npm run build:views
 */

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const ROOT = path.join(__dirname, '..');
const VIEWS_DIR = path.join(ROOT, 'views');
const OUT_FILE = path.join(ROOT, 'server', 'views.generated.js');

/** Words that cannot be a variable name. */
const RESERVED = new Set(
  (
    'var let const function return if else for while do break continue new typeof ' +
    'instanceof in of delete void this null true false undefined switch case default ' +
    'try catch finally throw class extends super yield await async import export ' +
    'static get set'
  ).split(' ')
);

/** Globals and names that already exist inside a compiled template. Redeclaring
 *  these would shadow something real, so they are never put in the prologue. */
const BUILTINS = new Set(
  (
    'String Number Boolean Object Array Math JSON Date RegExp Error parseInt ' +
    'parseFloat isNaN Infinity NaN encodeURIComponent decodeURIComponent ' +
    'console locals escapeFn include rethrow __output __append undefined'
  ).split(' ')
);

/** Every .ejs file under views/, named the way Express names a view. */
function collect(dir, prefix = '') {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      found.push(...collect(path.join(dir, entry.name), rel));
    } else if (entry.name.endsWith('.ejs')) {
      found.push({ name: rel.replace(/\.ejs$/, ''), file: path.join(dir, entry.name) });
    }
  }
  return found.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Identifiers the template mentions inside its <% %> blocks.
 *
 * Deliberately over-collects (a property name like `username` in
 * `user.username` is picked up too). A superset is harmless - an unused
 * `var username = locals.username` is just an unused variable - whereas a
 * missing name would throw at render time.
 */
function codeIdentifiers(source) {
  const names = new Set();
  const re = /<%([\s\S]*?)%>/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    let code = match[1];
    if (code.charAt(0) === '#') continue; // EJS comment
    if (code.charAt(0) === '=' || code.charAt(0) === '-') code = code.slice(1);
    for (const token of code.matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) {
      const name = token[0];
      if (!RESERVED.has(name) && !BUILTINS.has(name)) names.add(name);
    }
  }
  return [...names].sort();
}

function compileView(view) {
  const source = fs.readFileSync(view.file, 'utf8');
  const fn = ejs.compile(source, {
    client: true,
    _with: false,
    compileDebug: false,
    filename: view.file,
  });

  const names = codeIdentifiers(source);
  const prologue = names.length
    ? `\nvar ${names.map((n) => `${n} = locals.${n}`).join(', ')};\n`
    : '\n';

  let code = fn.toString();
  const bodyStart = code.indexOf('{');
  if (bodyStart === -1) throw new Error(`Could not find a body in ${view.name}`);
  code = code.slice(0, bodyStart + 1) + prologue + code.slice(bodyStart + 1);

  if (/\bwith\s*\(/.test(code)) throw new Error(`${view.name} still contains with()`);
  if (/new Function/.test(code)) throw new Error(`${view.name} still contains new Function`);

  return { name: view.name, code };
}

/** The runtime that resolves includes and renders a view. Appended verbatim. */
const RUNTIME = `
/* ---- runtime ------------------------------------------------------------ */

/**
 * Resolves an include target against the file that is including it, the way
 * EJS does: include('currency-icon') from partials/header means
 * partials/currency-icon, and include('../partials/head') from pages/home means
 * partials/head.
 */
function normalise(fromName, target) {
  const segments = fromName.split('/').slice(0, -1).concat(String(target).replace(/\\.ejs$/, '').split('/'));
  const out = [];
  for (const segment of segments) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') out.pop();
    else out.push(segment);
  }
  return out.join('/');
}

/**
 * Renders a view to HTML.
 *
 * @param {string} name   view name, e.g. 'pages/home'
 * @param {object} locals values the template reads
 * @returns {string} HTML
 */
function render(name, locals) {
  return renderAt(String(name).replace(/\\.ejs$/, ''), locals || {}, 0);
}

function renderAt(name, locals, depth) {
  const view = VIEWS[name];
  if (!view) throw new Error('Unknown view "' + name + '"');
  if (depth > 16) throw new Error('Include depth exceeded while rendering "' + name + '"');

  // Each template gets its own include so relative paths resolve from *its*
  // location, and a partial sees its parent's locals plus whatever was passed.
  const include = (target, data) =>
    renderAt(normalise(name, target), data ? Object.assign({}, locals, data) : locals, depth + 1);

  return view(locals, undefined, include, undefined);
}

module.exports = { render, VIEWS };
`;

function main() {
  const views = collect(VIEWS_DIR).map(compileView);

  const lines = [
    '/**',
    ' * GENERATED FILE - do not edit.',
    ' *',
    ' * Built from the .ejs files in views/ by scripts/build-views.js. The Worker',
    ' * cannot compile EJS at runtime, so the templates are compiled here instead.',
    ' *',
    ' * Rebuild with: npm run build:views',
    ' */',
    '',
    'const VIEWS = {',
    ...views.map((v) => `  ${JSON.stringify(v.name)}: ${v.code},`),
    '};',
    '',
  ];

  fs.writeFileSync(OUT_FILE, lines.join('\n') + RUNTIME, 'utf8');
  const kb = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
  console.log(`Built ${views.length} views -> server/views.generated.js (${kb} KB)`);
}

main();
