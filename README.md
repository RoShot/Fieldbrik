# FieldBrik 0.3

An independent online building and gaming community, in the style of the
building platforms of 2006–2008.

**Status:** Phase 1 — front end. The backend, database and authentication arrive
in Phase 2.

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — the design
- [docs/PROGRESS.md](docs/PROGRESS.md) — where the build has reached, and open questions
- [docs/DECISIONS.md](docs/DECISIONS.md) — every settled choice and its reason

## Running it

```bash
npm install
npm start          # http://localhost:3000
npm run dev        # same, with restart on file changes
```

Requires Node 20 or newer. No database is needed yet.

## Layout

```
server/
  config/       site-wide constants (name, nav, footer, currencies)
  services/     business logic; the only code that will talk to the database
  routes/       HTTP shape only
  app.js        middleware order and routers
  index.js      entry point
views/
  partials/     shared head, header, footer, avatar, currency icon
  pages/        one file per page
public/
  css/          the single design system stylesheet
docs/
  ARCHITECTURE.md
  PROGRESS.md
  DECISIONS.md
```

## Adding a page

1. Add it to `site.nav` or `site.footer` in `server/config/site.js` if it needs a
   link. Never hand-write a nav link in a template.
2. Add the view in `views/pages/`.
3. Add the route in `server/routes/pages.js`, reading data through a service.
4. It automatically inherits the header, footer and navigation.
