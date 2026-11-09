# Deploying

The goal is that nobody ever uploads a file by hand. Push to `main` and the
site is live a minute later.

```
git push origin main  ->  GitHub Actions  ->  wrangler deploy  ->  live
```

That pipeline is in `.github/workflows/deploy.yml` and is already committed. It
stays dormant until the runtime swap produces `server/worker.js`; until then the
deploy step skips itself and the build stays green.

## One-time setup

Three things, done once, none of them per-deploy.

### 1. Create the database

Cloudflare dashboard -> Workers & Pages -> D1 -> Create database, name it
`fieldbrik`. Copy the database ID it gives you into `wrangler.toml` where it says
`REPLACE_WITH_YOUR_DATABASE_ID`.

### 2. Create an API token

Dashboard -> My Profile -> API Tokens -> Create Token -> **Edit Cloudflare
Workers** template. It needs Workers Scripts: Edit, and D1: Edit for the
migrations step.

In the GitHub repo: Settings -> Secrets and variables -> Actions, add:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | the token above |
| `CLOUDFLARE_ACCOUNT_ID` | from the Workers dashboard URL, or the account overview |

Neither value goes in the repository, in a file, or in chat.

### 3. Connect the repository

Push this repository to GitHub and make `main` the default branch. The workflow
runs on every push to `main`, and can also be triggered by hand from the Actions
tab (**workflow_dispatch**).

## What a deploy does

1. `npm ci` - installs exactly what `package-lock.json` pins. The lockfile is
   committed, so a deploy never drifts onto a newer dependency.
2. `node --check server/app.js` - cheap syntax gate, so a typo fails the build
   instead of the site.
3. `npx wrangler deploy` - uploads the Worker, the D1 migrations and `public/`.

Secrets set in the Cloudflare dashboard survive deploys; nothing here can
overwrite them.

## Cutting over from v0.2 without deleting it

The rule: **two deployments, one domain.** v0.2 keeps running and keeps its data;
the domain moves to v0.3. Nothing is wiped, so the move is reversible for as
long as you want it to be.

1. **Give v0.3 its own identity.** In `wrangler.toml`, set `name` to
   `fieldbrik-v03`, and create a **new** D1 database (`fieldbrik_v03`) rather
   than reusing v0.2's. A migration run against live v0.2 data is the only
   irreversible step in the whole plan, and it is entirely avoidable.
2. **Deploy and test on the workers.dev hostname** before the domain moves.
   v0.3 is reachable there even though nobody is being sent to it.
3. **Move the domain.** Dashboard -> the v0.3 Worker -> Settings -> Domains &
   Routes -> add the custom domain. Cloudflare refuses if v0.2 still owns it, so
   remove it from v0.2 first; the gap is seconds and v0.2 keeps serving wherever
   it is still bound.
4. **If v0.2 uses a route pattern** instead of a custom domain, move the route
   itself (`example.com/*`). Same effect, and v0.2 stays callable at its
   `workers.dev` hostname.
5. **To go back**, remove the domain from v0.3 and add it back to v0.2. Because
   nothing was deleted, this works today, next week, or next year.

What this deliberately does **not** do:

- delete v0.2's Worker, deployments or database
- run migrations against v0.2's data
- reuse v0.2's secrets (they cannot be copied; set fresh ones on v0.3)

An idle Worker with no route costs nothing, and a dormant D1 database costs
storage only, which for a site this size is fractions of a cent.

## Rolling back

Every deploy is a new version. Dashboard -> Workers & Pages -> fieldbrik ->
Deployments lists them, and any earlier version can be made current in one
click. That is faster and safer than reverting a commit.

## Local development

```bash
npm run dev          # Express, port 3000 - works today
npx wrangler dev     # Workers + local D1 - works after the swap
```

Local D1 data lives under `.wrangler/`, which is gitignored. It is disposable and
never touches production.

## Before the first real deploy

- [ ] `REPLACE_WITH_YOUR_DATABASE_ID` actually replaced
- [ ] Both repository secrets added
- [ ] `wrangler.toml`'s `name` set to the Worker you want to own the domain
- [ ] Migrations applied: `npx wrangler d1 migrations apply fieldbrik --remote`
- [ ] The custom domain attached in the dashboard, not hardcoded anywhere
- [ ] No secrets in the repo: `git grep -i "api[_-]key\|secret\|token"` outside
      of `.github/workflows`
