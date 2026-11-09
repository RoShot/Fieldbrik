# FieldBrik 0.3 — Architecture

Status: Phase 1 in progress (front end). Backend, database and auth are Phase 2.
See `docs/PROGRESS.md` for where the build has reached, and `docs/DECISIONS.md` for
why each choice was made.

## 1. Stack decision

| Concern | Choice | Why |
|---|---|---|
| Language | Node.js (ES2022, CommonJS) | The spec names `index.js` as the backend entry point; Node keeps the website, API and future client auth on one runtime. |
| HTTP | Express 4 | Boring, stable, and the middleware model is what centralised moderation and permissions need. |
| Views | EJS server-rendered templates | A 2006–2008 community site is a server-rendered site. One shared header include = a header change lands on every page, which the spec requires. No SPA hydration cost. |
| Styling | Hand-written CSS design system | No framework can produce the era-specific look; a utility framework would fight it. One stylesheet, shared tokens. |
| Database | PostgreSQL (Phase 2) | Spec requirement. Relational integrity matters here: friends, inventory, transactions and bans are all constraint-heavy. |
| Sessions | Server-side sessions in Postgres, httpOnly cookie | Survives restarts, revocable, and keeps roles out of the browser entirely. |
| Passwords | Argon2id (fallback bcrypt if the native module is unavailable) | Current best practice, not a homebrew hash. |
| Tests | Node's built-in `node:test` + Supertest | No extra test runner to maintain. |

### Local database note

This development VM has no PostgreSQL server installed and no root access to add
one as a system service. Phase 2 will therefore:

1. Provide `docker-compose.yml` for a local PostgreSQL 16 (the user's own machine
   and their production host both have this option), and
2. Run the test suite against an embedded Postgres-compatible engine so the
   migration and query tests still execute here.

Both paths use the same SQL migrations. Nothing in application code will be
aware of which one it is talking to.

## 2. Layering

```
request
  → middleware      (session, account status / moderation gate, permissions, rate limit, CSRF)
  → route           (server/routes/*        — HTTP shape only: parse, call service, render)
  → service         (server/services/*      — all business rules; the only code that touches the DB)
  → data access     (server/db/*            — parameterised SQL, transactions)
  → PostgreSQL
```

Rules that keep the build maintainable:

- **Routes never contain business rules.** No route decides whether a user is banned, whether a role may act, or whether a purchase is affordable.
- **Views never query.** Templates receive plain objects from a route, which got them from a service.
- **One implementation per rule.** A ban check exists once (moderation gate). A permission check exists once (`can()`). A balance change exists once (economy service).
- **Shared UI is an include**, never a copy.

### Services (the modules that centralise behaviour)

| Service | Owns |
|---|---|
| `auth` | Registration, login, logout, password change, session lifecycle |
| `accounts` | Profile reads/updates, settings, deletion requests, online state |
| `permissions` | Role hierarchy and `can(actor, action, target)` |
| `moderation` | Bans, warnings, revocation, expiry evaluation, the request gate |
| `social` | Friends, requests, blocks, counts |
| `messaging` | Inbox/sent, read state, deletion, report hooks |
| `avatar` | Body-part colours and face, persistence |
| `catalog` | Items, categories, search, ownership |
| `economy` | Balances, purchases, transaction log, admin adjustments |
| `badges` | Definitions, assignment, revocation, automatic role badges |
| `games` | Listings, metadata, publishing, session discovery |
| `news` | Articles, categories, publication state |
| `notifications` | In-app notices, including warning notices |
| `audit` | Activity log writes for administrative actions |
| `navigation` | Nav model and active state (already built) |

### The moderation gate

One middleware, mounted once:

```js
// server/middleware/accountGate.js
// Runs on every page and API request. Resolves the session, loads the account,
// evaluates active restrictions, and either continues or renders the ban page
// (for pages) / returns 403 with a machine-readable reason (for API).
```

Because it is mounted globally, a new route added later is covered by default.
A ban cannot be bypassed by navigating to a URL that forgot its own check,
because no route performs the check at all.

Temporary bans are evaluated by `expires_at > now()`; expiry needs no cron job,
the record simply stops matching. Expired bans remain in history.

### Permissions

`permissions.can(actor, action, target)` with a fixed role rank:

```
user (1) < support_staff (2) < moderator (3) < administrator (4) < super_administrator (5)
```

Rank alone is not enough — the policy also encodes rules such as "you may never
act on a rank above your own", "only a super administrator may grant or revoke
super administrator", and "no account may change its own role".

## 3. Database design

Postgres 16. All tables use `bigserial`/`bigint` ids, `timestamptz` timestamps,
`citext` for case-insensitive usernames and email. Migrations are numbered SQL
files in `server/db/migrations`, applied by a small runner.

**Currency.** Two currencies: **Tickets** (earned) and **Bucks** (premium).
The exchange convention is **1 Buck = 10 Tickets**. Prices are stored as two
separate integer columns rather than one, because a creator may sell an item for
Tickets only, Bucks only, or both, and the site must be able to show either
price without deriving it.

### Identity and access

**roles** — `id`, `key` (unique), `name`, `rank`, `description`

**users** — `id`, `username` (citext, unique), `email` (citext, unique),
`password_hash`, `role_id → roles`, `created_at`, `last_online_at`,
`description`, `status` (`active` | `deleted_requested` | `suspended`),
`deleted_at`
*Indexes:* unique lowercased username, unique email, `created_at` for
recent-registrations.

**sessions** — `id` (uuid), `user_id → users`, `token_hash`,
`csrf_secret_hash`, `ip`, `user_agent`, `created_at`, `last_seen_at`,
`expires_at`, `revoked_at`
*Indexes:* `user_id`, `expires_at`. Token stored hashed, never raw.

**user_settings** — `user_id` PK/FK, notification flags, profile visibility,
`updated_at`

**avatars** — `user_id` PK/FK, `head_color`, `torso_color`, `left_arm_color`,
`right_arm_color`, `left_leg_color`, `right_leg_color`, `face_key`,
`updated_at`
*Constraints:* colours validated as hex in the service layer; `face_key` in a
known set.

### Social

**friendships** — `id`, `requester_id → users`, `addressee_id → users`,
`status` (`pending` | `accepted` | `declined`), `created_at`, `responded_at`
*Constraints:* `requester_id <> addressee_id`; unique on the ordered pair
`(least(a,b), greatest(a,b))` so a duplicate friendship or duplicate pending
request is impossible at the database level, not just in application code.

### Messaging

**messages** — `id`, `sender_id`, `recipient_id`, `subject`, `body`,
`read_at`, `created_at`, `deleted_by_sender_at`, `deleted_by_recipient_at`
*Indexes:* `(recipient_id, created_at DESC)` for the inbox,
`(sender_id, created_at DESC)` for sent.
*Constraints:* `sender_id <> recipient_id`; body length bound.

### Badges

**badges** — `id`, `key` (unique), `name`, `description`, `color`,
`is_automatic`, `role_key` (nullable) — when `is_automatic` and the account has
`role_key`, the badge is held implicitly.

**user_badges** — `id`, `user_id`, `badge_id`, `awarded_by` (nullable),
`awarded_at`, `revoked_at`, `revoked_by`
*Constraint:* one active award per `(user_id, badge_id)` via partial unique index
`WHERE revoked_at IS NULL`. Revocation keeps history.

### Games

**games** — `id`, `slug` (unique), `name`, `description`, `creator_id`,
`created_at`, `updated_at`, `published_at`, `status`
(`draft` | `published` | `unlisted` | `rejected`), `featured`, `visit_count`

**game_versions** — `id`, `game_id`, `version`, `notes`, `created_at`,
`asset_manifest` (jsonb) — the publishing target for a future Studio.

**game_sessions** — `id`, `game_id`, `host_id`, `region`, `player_count`,
`max_players`, `started_at`, `ended_at` — the discovery surface for a future
client. Not populated yet.

### Catalog and economy

**catalog_items** — `id`, `slug` (unique), `name`, `category`
(`hats` | `shirts` | `tshirts` | `pants` | `accessories` | `other`),
`creator_id`, `description`, `price_tickets` (integer ≥ 0, nullable),
`price_bucks` (integer ≥ 0, nullable), `status` (`active` | `hidden`),
`created_at`, `updated_at`
*Indexes:* `category`, `creator_id`, `price_tickets`.
*Rule:* at least one price column must be non-null; when both are set the editor
pre-fills Tickets at 10× the Bucks price, but the two are stored independently.

**inventory** — `id`, `user_id`, `item_id`, `transaction_id`, `acquired_at`,
`equipped_slot` (nullable)
*Constraint:* unique `(user_id, item_id)` for non-consumable items.

**transactions** — `id`, `user_id`, `kind`
(`purchase` | `sale` | `admin_credit` | `admin_debit` | `refund`),
`amount_tickets` (signed integer), `balance_after`, `item_id` (nullable),
`reference` (nullable), `created_by` (nullable, staff id), `created_at`, `note`
*Rule:* balances are never updated outside a transaction (economy service only),
and every balance change writes a row here with the resulting balance.

**user_balances** — `user_id` PK, `bucks`, `tickets`, `updated_at`
Kept as its own row so balance reads are one indexed lookup; the ledger in
`transactions` remains the source of truth.

### Moderation

**bans** — `id`, `user_id`, `reason`, `issued_by`, `created_at`, `expires_at`
(nullable = permanent), `revoked_at`, `revoked_by`
*Constraint:* check `expires_at IS NULL OR expires_at > created_at`.
*Indexes:* partial index on `user_id WHERE revoked_at IS NULL` for the gate.

**warnings** — `id`, `user_id`, `reason`, `issued_by`, `created_at`,
`revoked_at`, `revoked_by`, `acknowledged_at` (drives the in-app notice)

**activity_logs** — `id`, `actor_id`, `action`, `target_type`, `target_id`,
`details` (jsonb), `ip`, `created_at`
Append-only: no update or delete grants for the application role; ordinary users
have no read path at all.

### Content and notices

**news** — `id`, `slug` (unique), `title`, `summary`, `body`, `category`,
`author_id`, `status` (`draft` | `published`), `published_at`, `created_at`,
`updated_at`

**notifications** — `id`, `user_id`, `type`, `payload` (jsonb), `read_at`,
`created_at`
*Indexes:* `(user_id, created_at DESC)`, partial on `read_at IS NULL`.

### Integrity summary

- Foreign keys on every relationship; `ON DELETE RESTRICT` for authored content,
  `ON DELETE CASCADE` only for rows that are meaningless without their parent
  (avatars, sessions, settings).
- Check constraints for money (non-negative prices, bound amounts) and for
  self-reference rules (no self-friend, no self-message, no self-ban).
- Uniqueness enforced in the schema — usernames, friendship pairs, active badge
  awards, inventory items — so races cannot create duplicates.
- Multi-step operations (purchase, friend accept, ban + log) run in a single SQL
  transaction with the ledger row written in the same commit.

## 4. Routes / API surface

Pages (Phase 1, built): `/`, `/my-page`, `/games`, `/games/:slug`, `/catalog`,
`/catalog/:slug`, `/people`, `/people/:username`, `/forum`, `/forum/:section`,
`/news`, `/news/:slug`, `/carpenters-club`, `/parents`, `/help`, `/about`,
`/support`, `/terms`, `/privacy`, `/login`, `/register`
Pages (Phase 1, remaining): `/parents/:tab`, `/inventory`, `/character`,
`/friends`, `/messages`, `/settings`

Detail pages resolve by numeric id or slugified name, so links stay readable and
older numeric links keep working. Phase 2 swaps the fixture lookup for a query
without touching the routes or the views.
Admin (Phase 2): `/admin`, `/admin/users`, `/admin/roles`, `/admin/moderation`,
`/admin/badges`, `/admin/games`, `/admin/catalog`, `/admin/news`, `/admin/logs`,
`/admin/settings`

API (Phase 2, `/api/v1`): `auth/*`, `me`, `users/:username`,
`users/:username/avatar`, `friends`, `messages`, `badges`, `inventory`,
`catalog`, `games`, `games/:id/publish`, `sessions` (discovery).

The API is the same service layer as the pages — the website is one client of it,
not a special case. The future desktop client authenticates against `auth/*`.

## 5. Build order

The user's requested order, mapped onto the spec's phases:

1. **Front end, page by page** — shared shell, design system, every route and
   link, reviewed in the live preview. (Spec phases 3–5, 9 for the visible
   surface.)
2. **Backend in one pass** — DB migrations, auth, services, moderation gate,
   API, wiring every existing page to real data. (Spec phases 1, 2, 6, 7, 8, 10.)
3. **Tests and hardening** — integration tests, permission matrix, ban expiry,
   economy atomicity, rate limits.

## 6. Standing constraints from the user

- No `/images` folder exists. The **only** graphical placeholders permitted are
  the Bucks icon, the Tickets icon and the header background. Everything else
  must be real, text, or a data-driven CSS rendering.
- The 3D renderer is not live. Never simulate it. The avatar shown on the site is
  a flat 2D rendering of the same stored colours, clearly not a fake 3D viewer.
- If a page's intended content or appearance is unclear, stop and ask rather than
  inventing it; the user will supply reference imagery.
- Nothing is deployed to the production domain without explicit approval.
