# FieldBrik 0.3 — Progress

Last updated: 2026-11-04

`ARCHITECTURE.md` says **how** the site is built. This file says **where we are**.
`DECISIONS.md` says **why** each choice was made. Read all three before starting work
in a new session — they are the only record that survives.

## Status

- The website is live on Cloudflare Workers with a D1 database. Every public page
  reads the database; the phase 1 fixture file is only reachable through handlers in
  `routes/pages.js` that earlier passes deliberately shadowed.
- The client and the Studio are **not** part of this repository. A replicated
  2010–2011 client and Studio exist outside the project; the join bridge that would
  let them talk to this site is not built yet.

## The phase plan

| # | Phase | What it delivers | State |
|---|---|---|---|
| 1 | Front end | Every page, link and route | **complete**, apart from client-dependent items |
| 2 | Foundation and accounts | D1, migrations, sessions, sign-up/log-in, roles, moderation gate | **complete** |
| 3 | Economy and catalog | Balances, ledger, Ticket earning, purchases, inventory, admin credit/debit | **complete** |
| 4 | Social layer | Friends, messages, reports, avatar persistence, warnings | **complete** |
| 5 | Community content | News CMS, forum threads and replies, badge awarding | **complete** |
| 6 | Admin and moderation | User/role/ban/warning management, audit log, abuse reports | **complete** |
| 7 | Tests and hardening | Integration tests, permission matrix, ban expiry, economy atomicity, backups | **partial** |
| 8 | Polish pass | Header art, custom Bucks/Tickets icons, page-by-page reference pass | deferred by request |
| 9 | Place editor | Publishing, versioning, asset manifests | **external** — the replicated Studio |
| 10 | Public API and client auth | Frozen `/api/v1`, game discovery, revocable desktop login | not started |
| 11 | The client | 3D renderer, movement, multiplayer, chat | **external** — the replicated client |
| 12 | Beta and release | Closed beta, load test, monitoring, legal review, launch | not started |

Phases 9 and 11 are no longer ours to build. What the site owes them is a join
contract: ticket minting and validation, a game-server registry, place-file
delivery, and the legacy `/Game/*` endpoints the 2010–2011 client calls. That work
belongs with phase 10 and is deliberately last, so the website is finished first.

## Pass log

1. **Foundation.** D1 schema, accounts, sessions, the staff role ladder, the
   moderation gate, every page moved off fixtures.
2. **Economy.** Ledger-backed Tickets and Bucks, daily earning by membership tier,
   the visit-milestone rate, catalog purchases, inventory and wearing.
3. **Social.** Friendships and requests, messages, blocks, warns, abuse reports.
4. **Community.** Forum sections, threads, replies and moderation; badge catalogue.
5. **Admin.** Account search, role changes, bans with evidence, blacklist, audit log,
   catalog and rate editing.
6. **Places.** Real listings, place pages, create/edit, publish/unpublish, My Page
   and the home page's Cool Places row.
7. **News and the front page.** News moved out of fixtures into `news` with a
   draft/publish state in `news_meta`; `/admin/news` writes it; the home page's news
   panel, platform counts and online list now all come from D1. My Page's
   "View Public Profile" link is the signed-in member's profile, not a fixture
   account.

### News, specifically

`news` was in the baseline schema but nothing read or wrote it. It is now the real
source for `/news`, `/news/:slug`, the home page panel and the admin screens.

- **State lives in `news_meta`.** The migration loop runs on every push, so
  `ALTER TABLE ADD COLUMN` is unavailable (the second run fails). A missing meta row
  means published, which is why the carried-over announcements need none.
- **Three announcements were migrated, one was not.** The phase 1 fixture
  "Moderation team expanded" invented two moderators who were never appointed, so it
  was left behind. An admin can write that post in the panel when it is true.
- **Unpublishing, not deleting.** An article's URL may already be linked; unpublishing
  keeps the row and stops the URL resolving. Publishing sets `published_at` to now,
  which is what puts it at the top of the list.

## Blocked or external

These cannot be built honestly in this repository yet:

- **Playing a place** — needs the client, which lives outside this repo.
- **Place files (.rbxl)** — the Studio that produces them is external; the site has no
  storage or delivery for them yet.
- **Visits and the 10-visit Ticket milestone** — the rate is configurable and the
  service exists, but nothing can count a visit until a real join happens. The Games
  and place pages say so in words instead of showing a zero.
- **Payment** — no checkout, and the Carpenters Club page and its announcement both
  say payment is not open. Memberships are granted by staff in the panel.
- **Password recovery** — needs outbound email, which is not configured.

## Open questions for the user

1. **Tx / R$ colours.** Tickets are orange and Bucks green, matching the reference.
2. **Carpenters Club term lengths.** "Quarterly" is described as 6 months, and a year
   currently costs more than twelve monthly payments. Intentional?
3. **Home page screenshot and download button** — pending a client build.
4. **The join contract** — what the client actually requests (endpoint, response
   shape, hostname, http vs https) needs to come from the working client, not a
   reconstruction of 2011 Roblox.

## Update protocol

At the end of every working pass, update this file: tick what moved, add anything
new that was deferred, and add any new question for the user. A decision that
changes goes in `DECISIONS.md` with the reason.
