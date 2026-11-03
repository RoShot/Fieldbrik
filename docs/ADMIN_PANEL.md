# Admin panel — plan

Source: the user's written spec (3 November 2026) and the reference screenshot of a
2008-era Roblox admin panel. The panel is Phase 2.5 (D20): it comes after the site's
pages read real rows, and before the community content that needs staff tooling.

This document is the agreed scope. It supersedes `ARCHITECTURE.md` §Permissions, which
describes a five-rank ladder; the ladder below replaces it. `ARCHITECTURE.md` is left
alone until the documentation pass so there is one source of truth at a time.

## Design

The panel keeps the site's own chrome (the header, the beige page, the 10–11px tables)
and adds the reference's two structures:

- a fixed left sidebar of collapsible groups: **Admin Dashboard, Configuration,
  People, Content, Moderation, System, Scripts, Groups, Billing, Inventory
  Management, Other**, with the current page highlighted in pale blue;
- a status strip under the wordmark, one line per subsystem, of real numbers only.

The reference's `Configs | Machines` block is mostly infrastructure we do not have
(0 of 0 cores, machines, thumb requests). Those lines are drawn only when the number
is real; where there is nothing to report, the line says so rather than showing a
zero. A zero that means "not built" is a lie in the same way a fake button is.

Admin pages get their own layout (`views/layouts/admin.ejs` plus `views/admin/*`). They
do not reuse the member header, and they are never linked from the public navigation.

### The status strip

| Line | Source | Now |
|---|---|---|
| users | `SELECT COUNT(*) FROM users` | real |
| places / published | `games` counts | real |
| players in games | no client and no session registry | "no machines connected" |
| abuse reports | `reports` where open | 0 until reports exist, then real |
| images / videos | content queue counts | after content submissions |
| cores / machines | none configured | not drawn |
| Stop Chat / Pause Polling | chat does not exist | not drawn |
| Change Theme | one theme | not drawn |

`Change Theme`, `Stop Chat` and `Pause Polling` are the reference's own controls. The
first is deliberately absent (one theme, D10). The other two arrive with chat, and
until then the strip says chat is not built instead of drawing a dead button.

## Roles

Fifteen roles, each with a numeric rank. Rank decides who may act on whom; capability
decides what the page offers. The list is the user's, verbatim.

| Role | Rank | Intended |
|---|---|---|
| Intern | 50 | Staff trainee. Reads the panel, cannot act. |
| Developer | 100 | Platform development. System pages, logs, feature toggles. |
| Support Rep | 150 | Customer support. Account lookup, reminders, password resets. |
| Support Admin | 160 | Advanced account support. Warnings, short restrictions. |
| Image Moderator | 170 | Asset and image approval, bad-image reports. |
| Forum Moderator | 180 | Forum reports, threads, word filter, shoutbox. |
| Moderator | 190 | General moderation. Bans up to 14 days. |
| Senior Moderator | 200 | Experienced staff. Bans up to permanent. |
| Super Moderator | 210 | Oversees moderators. Acts on moderators. |
| Junior Administrator | 220 | Trial admin. Memberships, referrals, billing credits. |
| Senior Administrator | 230 | Account deletion, email blacklist, role changes below 230. |
| Administrator | 240 | Site settings, maintenance, news, poison bans. |
| Super Administrator | 250 | Everything except Root-only actions. |
| Root | 255 | Founders. Grants Root, wipes, danger zone. |

### Rules, enforced server-side

1. You may never act on an account whose rank is greater than or equal to your own.
2. Only Root may grant or revoke Root.
3. Super Administrator may grant up to 249.
4. Nobody may change their own role, and nobody may ban themselves.
5. Rank is read from the database on every request, never from the session cookie or
   a form field.
6. Every action writes to `moderation_log` with actor, target, action and reason. The
   log has no edit or delete path anywhere in the panel.

### Capability matrix

Minimum rank per capability, with the exceptions that matter:

| Capability | Rank | Notes |
|---|---|---|
| Open `/admin` | 50 | Interns see it and can search. |
| Search users | 50 | |
| View ledger, sessions, badges | 50 | Read-only. |
| Send a reminder or notice | 150 | Writes a message from the official account. |
| Warn | 160 | |
| Restrict (site-wide, timed) | 160 | Support Admin and above. |
| Ban up to 14 days | 190 | |
| Ban permanent / poison | 200 / 240 | Poison is Administrator and above. |
| Scrub username | 190 | |
| Grant or revoke membership | 220 | |
| Grant referral (badge + 15 Bucks) | 220 | Capped at 10 per account. |
| Issue Bucks or Tickets | 220 | Ledger rows, never a bare balance write. |
| Blacklist an email address | 230 | |
| Delete an account | 230 | Soft delete, history kept. |
| Approve or reject content | 170 | Per content kind: Image Moderator for images, etc. |
| Lock, pin or delete a thread | 180 | |
| Edit the word filter | 180 | |
| Site settings, maintenance, news | 240 | |
| Grant roles | 230 | Below own rank only. Root for Root. |

Support Rep has no ban capability at all, so the Moderate User page renders the warn
and reminder controls and omits the ban controls rather than drawing them disabled.

## Sidebar map

Reference group → our route → status. Everything listed is reachable only through a
real page; an entry that has nothing behind it yet is added in the pass that gives it
something.

- **Admin Dashboard / Overview** → `/admin` — pass 1
- **Configuration** → site settings, feature toggles, maintenance, notifications —
  pass 8
- **People / Search Users** → `/admin/users` — pass 2
- **People / User Admins** → `/admin/users/:id` role panel — pass 2
- **People / Moderate User** → `/admin/users/:id/moderate` — pass 3
- **People / Carpenters Club** → `/admin/users/:id/club` — pass 4
- **People / Referral Program** → `/admin/users/:id/referral` — pass 4
- **People / Blacklist Email** → part of Moderate User plus `/admin/blacklist` — pass 4
- **People / Find Parent, Machine Config, Builders Club, Find Payment, Manage Forum
  Moderators** — the reference's, not ours: parent accounts, machines and payments do
  not exist. Forum moderators are a role now, so that page is `/admin/users` filtered
  by role. Not drawn until they mean something.
- **Content** → review queue per kind — pass 5
- **Moderation** → reports, chat logs, forum reports, punishments and appeals, word
  filter — pass 6
- **System** → audit log, permission matrix — pass 1 (log) and pass 2 (matrix)
- **Scripts, Groups** → no equivalent; not drawn. Groups are a real future feature and
  would get the group, not the admin group.
- **Billing** → credit/debit, mass reward, grant items — pass 7
- **Inventory Management** → view and remove a member's items — pass 7
- **Other** → news manager, shoutbox, site-wide alert, chat, admin help — pass 9

## Schema work

The panel is mostly new tables. Each arrives in the pass that uses it, so nothing sits
empty and unused for several deploys.

| Need | Where | Pass |
|---|---|---|
| Role ladder | `roles` table (key, name, rank, description), seeded; `users.role_key`; drop the `role` CHECK | 1 |
| Idempotent migrations | `scripts/migrate.js`, `schema_migrations`; `schema.sql` becomes the baseline only | 1 |
| Notes on an account | `account_notes` (id, user_id, author_id, body, created_at) | 3 |
| Ban evidence | `restriction_evidence` (restriction_id, object_key, uploaded_by) + R2 `FILES` | 3 |
| Scrub | `users.original_username`, `users.scrubbed_at` | 3 |
| Ban page reason/duration | existing `restrictions` (kind, reason, expires_at) | 3 |
| Membership moderation | `memberships.granted_by`, `memberships.note` | 4 |
| Referrals | `referrals` (referrer_id, referred_id, granted_by, created_at); cap in the service | 4 |
| Email blacklist | `blacklisted_emails` (email_lower, reason, added_by, added_at) | 4 |
| Content queue | `content_submissions` (kind, author_id, title, asset_key, status, reviewed_by, decision) | 5 |
| Reports | `reports` (kind, reporter_id, target_id, ref, reason, body, status, handled_by) | 6 |
| Appeals | `appeals` (restriction_id, user_id, body, status, handled_by, outcome) | 6 |
| Word filter | `word_filter` (phrase, action, added_by, created_at) | 6 |
| Chat logs | `chat_logs` (user_id, room, body, created_at) — needs chat | 6 |
| Settings and toggles | `site_settings` (key, value, updated_by, updated_at) and `feature_toggles` | 8 |
| News drafts | `news.published_at` nullable for drafts | 9 |
| Shoutbox | `shoutbox` (user_id, body, created_at) | 9 |

Message-shaped notices (reminder, warning text, site-wide alert) reuse `messages` from
the official FieldBrik account rather than a parallel notifications table, so the
member's inbox has one place to read them.

## Passes

A pass is one commit, one deploy and one verification run, as with Tier 1. Sizes are
work, not calendar.

| # | Pass | Size |
|---|---|---|
| 1 | Migration runner, role ladder, permission helper, `/admin` gate, admin shell and sidebar, landing page, real status strip, audit log viewer | M |
| 2 | Search Users, account detail, User Admins role panel with the rank rules | M–L |
| 3 | Moderate User: remind, warn, ban with durations, delete, poison, reason presets, escalate, scrub, notes, ban page, sign-in gate | L |
| 4 | Carpenters Club panel, referral grant with the cap, email blacklist | M |
| 5 | Content review queue per kind (places, models, assets, catalog, images, audio) | L |
| 6 | Reports, forum reports, punishments and appeals, word filter, chat logs | L |
| 7 | Billing: credit and debit through the ledger, mass reward, item grants, inventory management | M |
| 8 | Configuration: site settings, feature toggles, maintenance mode and page, official notices | M |
| 9 | Other: news manager, shoutbox, site-wide alert, admin help | M |
| 10 | Hardening: permission matrix test across every rank, ban expiry, ledger atomicity, audit coverage | M |

Passes 1–3 are the working core and are worth shipping before the rest. Passes 4–7 need
the client or payment recording to be useful but are not blocked by them. Pass 9's news
manager is what lets `/news` leave fixtures, and pass 5's catalog queue is what unblocks
`/catalog`.

## Honest gaps

- **No client**: "kicked from a game with an error code" cannot be built. The ban is
  enforced at sign-in and on every request; nothing can reach a running client because
  there is no client and no server list.
- **No payments**: memberships are granted by staff, with an amount recorded as 0 and
  the term chosen manually. Nothing pretends a card was charged.
- **No storage yet**: evidence images and the image/audio queue need an R2 binding.
  Pass 3 adds `FILES` for evidence; pass 5 uses the same bucket.
- **No chat**: Stop Chat, Pause Polling and Chat Logs arrive with the chat service.
- **Machines, scripts and groups** do not exist in 0.3; those reference groups are not
  reproduced, and the status strip will not show fabricated core counts.

## Decisions needed

1. **Wipe before launch.** The user intends to delete every account and make
   `Fieldbrik` id 1. That is destructive and needs an explicit go, and a deliberate
   path (Root-only danger zone with a typed confirmation, or a one-off script) rather
   than a CI step that could run twice.
2. **Poison ban.** Proposed: permanent ban + username scrub + content removal + email
   blacklist, all in one logged action. Confirm or narrow it.
3. **Maintenance mode reach.** Proposed: every page except `/admin` and `/login` for
   staff, so staff can switch it off. Members and guests get the maintenance page.
4. **Support Rep ban rights.** Proposed as none (warn and remind only), because the
   rank ladder places them below the moderation roles entirely.
5. **Deleted accounts.** Proposed: soft delete (`closed_at` plus scrub) so `moderation_log`
   and `restrictions` keep pointing at a row. A hard delete would erase the history the
   log exists to protect.
