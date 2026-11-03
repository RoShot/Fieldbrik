# FieldBrik 0.3

An independent online building and gaming community, in the style of the
building platforms of 2006-2008.

**Status:** Phase 2 - the front end is complete and the site now runs on
Cloudflare Workers, with the D1 schema in place. Accounts, moderation and the
catalog economy are next. The site does not take money and does not claim to.

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - the design
- [docs/PROGRESS.md](docs/PROGRESS.md) - where the build has reached, and open questions
- [docs/DECISIONS.md](docs/DECISIONS.md) - every settled choice and its reason

## Running it

```bash
npm install
npx wrangler dev --port 8788   # the runtime that ships, with a local D1
npm start                      # Express on :3000, kept for diffing pages
```

Requires Node 20 or newer.

## Database

D1 (SQLite) on Cloudflare, defined in `db/schema.sql`. Local and remote are the
same SQL, run through wrangler:

```bash
npm run db:schema:local     # create the tables in the local .wrangler store
npm run db:seed:local       # badge definitions and forum sections
npm run db:schema:remote    # same, against the real database
npm run db:seed:remote
```

Both files are safe to re-run. `db/seed.sql` contains site structure only - no
members or posts are invented.

## Deploying

Every push to `main` deploys, through `.github/workflows/deploy.yml`. It needs
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repository secrets.

## Layout

```
server/
  config/       site-wide constants (name, nav, footer, currencies)
  services/     business logic; the only code that talks to the database
  routes/       HTTP shape only
  lib/router.js what Express mounts and the Worker calls directly
  worker.js     Cloudflare Worker entry
  app.js        Express entry, kept for diffing
views/
  partials/     shared head, header, footer, avatar, currency icon
  pages/        one file per page
public/
  css/          the single design system stylesheet
  avatar/       the 3D avatar renderer and its assets
scripts/
  build-views.js   compiles the EJS templates for the Worker
  verify-views.js  proves the compiled views match EJS byte for byte
db/
  schema.sql
  seed.sql
docs/
```

## Adding a page

1. Add it to `site.nav` or `site.footer` in `server/config/site.js` if it needs a
   link. Never hand-write a nav link in a template.
2. Add the view in `views/pages/`.
3. Add the route in `server/routes/pages.js`, reading data through a service.
4. Run `npm run build:views` so the Worker has the new template.
