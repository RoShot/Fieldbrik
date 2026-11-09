# FieldBrik 0.3 — Decisions

One entry per settled question. Format: what was decided, why, and what it costs.
Add a new entry rather than editing history; supersede with a dated note.

---

## D1 — Server-rendered Express + EJS, not a SPA
**Decided:** Express 4, EJS templates, hand-written CSS. CommonJS, entry point
`server/index.js`.
**Why:** A 2006–2008 community site is server-rendered. The user framed the backend
as `index.js`. One shared header include means a header change lands everywhere,
which the spec requires. No hydration cost, no build step.
**Cost:** Any future rich interaction needs a deliberate small enhancement rather
than a framework default. Accepted.

## D2 — One stylesheet, no framework
**Decided:** `public/css/fieldbrik.css` is the entire design system.
**Why:** The era look cannot be produced by a utility framework, and a framework
would fight every rule. Reference screenshots define the tokens.
**Cost:** Every new component is hand-written CSS.

## D3 — Zero image files
**Decided:** Nothing references a file in `/images`. The only graphical placeholders
allowed are the Bucks icon, the Tickets icon and the header background.
**Why:** The user has no art yet and will supply custom icons and header art later.
**Cost:** Avatars are flat 2D CSS figures built from stored colours, item thumbnails
are coloured squares from a stored hex value.

## D4 — Avatars are 2D, and never pretend to be 3D
**Decided:** The site renders the same head/torso/arms/legs/face colours the client
will use, as flat blocks.
**Why:** The renderer does not exist. A fake 3D viewer would violate the spec's ban
on mockups that imitate functionality.
**Cost:** The client's 3D avatar will look different from the site's 2D one. That is
correct and expected.

## D5 — Fixtures behind services, never imported by views
**Decided:** Phase 1 data lives in `server/services/fixtures.js` and is reached only
through `server/services/*`.
**Why:** Guarantees Phase 2 is a service-layer swap with no template churn.
**Cost:** A little indirection now.

## D6 — Unbuilt pages are labelled, not faked
**Decided:** Anything not built renders the shared `in-development` view listing the
agreed scope.
**Why:** The spec forbids fake buttons and static mockups.

## D7 — Forms navigate, they do not POST to nothing
**Decided:** Filters are `GET` navigations to real routes. Login and register forms
will not submit until Phase 2, and until then the pages say so.
**Why:** A form that silently discards input is a fake button.

## D8 — Commerce data is never invented
**Decided:** Prices, balances and earnings rates come from the user. Where a value is
undecided the page shows TBA.
**Why:** Money figures are the operator's, not the developer's.
**Cost:** Some pages showed TBA until 2026-11-02, when the Carpenters Club prices
were supplied (see D10).

## D9 — Every facet is a real URL
**Decided:** Category, price band, creator, sort and search all filter real data in
the route handler and produce shareable links.
**Why:** A filter that only highlights a label is a mockup.

## D10 — Carpenters Club prices (supplied 2026-11-02)
**Decided:** Prices are in **AUD**, live in `site.carpentersClub`, and render as a
3 tiers × 4 terms table.

| Tier | Monthly | Quarterly | Yearly | Permanent |
|---|---|---|---|---|
| Carpenters Club | 7.99 | 43.99 | 129.99 | 369.99 |
| Carpenters Club Senior | 14.99 | 73.99 | 189.99 | 384.99 |
| Outrageous Carpenters Club | 23.99 | 99.99 | 299.99 | 399.99 |

**Note:** quarterly is described as 6 months. Yearly exceeds twelve monthly payments,
which is recorded as an open question in `PROGRESS.md`, not silently "fixed".
**Payment is not live.** No checkout exists; nothing on the page can take money.

## D11 — Currency relationship: 1 Buck = 10 Tickets (2026-11-02)
**Decided:** Tickets are the earned currency and carry the whole catalogue economy;
Bucks is the premium currency. Both are stored per item as separate integer columns
(`price_bucks`, nullable; `price_tickets`, nullable).
**Why:** The user's rule: a 50 Buck shirt is 500 Tickets.
**Cost:** A creator may list Tickets-only, Bucks-only, or both. When both are set the
editor pre-fills Tickets at 10× the Bucks price as a convention, but the two values
are stored independently so a creator can price differently if allowed later.
Bucks-only items have no Tickets price, so Ticket price-band facets do not match them.

## D12 — Creators set item prices, including staff-created items
**Decided:** Pricing is chosen at creation time by the creator; the admin panel uses
the same rule for staff-created items.
**Why:** Stated by the user. Keeps one pricing path instead of an admin special case.

## D13 — Tickets display orange, Bucks display green
**Decided:** `Tx:` in orange, `R$:` in green, as in the reference screenshot.
**Status:** Matches the reference; awaiting explicit confirmation from the user.

## D14 — Forum sections exist, threads do not
**Decided:** Five real sections with real descriptions, showing `0` threads and
"No posts yet" until Phase 5.
**Why:** Structure is site design; conversations are content. Inventing threads would
put fake user writing on the site.

## D16 — Phase 1 page layouts (agreed 2026-11-02)
**Decided:** The user chose the layout for every remaining page rather than letting
them be guessed:

- **Character**: 2D preview on the left, six colour rows on the right (head, torso,
  left arm, right arm, left leg, right leg), face picker beneath. Arms share one
  stored colour and legs share one, matching the fixture model; separate per-limb
  columns exist in the schema for later.
- **Inventory**: a *Currently wearing* strip above a five-column owned-item grid,
  reusing the catalog item card so both pages look the same.
- **Friends**: incoming/sent requests panel above a friend table with online status.
- **Messages**: inbox table with a New Message panel beneath it; a message opens on
  its own page with a reply form.
- **Parents**: all five sub-tabs built with a shared sub-tab partial. The FAQ is
  drafted only from decisions already settled; the guestbook ships empty because
  invented testimonials would be fake user content on the page parents trust most.
- **Sidebar**: Log Out only, pointing at `/logout`. Create and Share stay off the
  page until Studio and the social service exist.
- **Settings**: shell built now with disabled controls, so Phase 2 wires behaviour
  instead of writing pages.

**Why:** the user asked to be shown options before these were built, having said
earlier to stop and ask rather than inventing a layout.

## D17 — Legal pages are drafts, and say so
**Decided:** `/terms` and `/privacy` are written pages, each carrying a visible
"draft, pending legal review" notice, written from what the system actually does.
**Why:** a footer link to a blank page is worse than a draft, and a draft presented
as final would be a false claim. The privacy page lists only data the schema really
stores.
**Action before launch:** both need a review pass, and the wording of the parental
consent step must be added once that flow is designed.

## D19 — Avatar renderer contract (from the user's code, 2026-11-02)
**Decided:** the user supplied a working three.js avatar renderer. It is staged
in `client/avatar/` and reviewed, but not integrated: it is client code, and a
renderer with no places, no login and no networking is a viewer with nothing to
view.

What it fixes for the schema, before any migration is written:

- **Six independent colours**, one per limb. The site's fixture model carries
  `arms` and `legs` (one colour each), so the character page currently draws
  four colour rows. The schema needs all six columns, and the site's Character
  page needs six rows to match.
- **Face is an ID from a fixed set** of eight (`classic-smile`, `chuckle`,
  `silly`, `durr`, `oo`, `glee`, `notamused`, `meh`). Never a path, never a
  texture URL. The site currently offers two CSS faces (`smile`, `neutral`)
  which are not the same identifiers and were never drawn from images.
- **Shirts are an item reference**, not a texture path on the avatar row.
- **Colour format is `#rrggbb` text.** The renderer tolerates integers so old
  data keeps working, but nothing new stores `0xffcc00`.
- **Defaults:** `#ffcc00` head, `#f57c00` torso, `#111111` limbs, so a new
  account renders as the starter character in both renderers.

**Assets the client needs, none of which exist yet:** `head.obj` (hard
dependency - the renderer throws without it), eight identically-sized face
PNGs, and optionally shirt sheets in the classic 585x559 layout.

**Bugs found in the supplied code and fixed:** the face plane was parented to
the head group after that group was scaled, but sized and offset from world
bounds, so its size and forward offset were both multiplied by the head scale a
second time - the face floats or sinks unless the model happens to be 1.278
units tall. Also: the model and every texture were re-fetched per avatar, the
render loop ran at 60fps forever for a static portrait, `destroy()` disposed
the renderer but leaked every geometry and material, `face` and `faceTexture`
were two sources of truth for one value, and an export was named after another
company's founder.

## D20 — Admin panel is Phase 2.5
**Decided:** Phase 2 wires the site first - runtime, schema, accounts, sessions,
moderation gate, then every page reading real rows. The admin panel follows as
Phase 2.5.
**Why:** the admin panel is useless until there are real accounts and rows to
administer, and building it first would mean building it against fixtures and
then rebuilding it.

## D18 — Messages fixture is display data
**Decided:** the inbox shows phase 1 display data between existing fixture members,
with a notice saying so.
**Why:** every other page displays fixture data, and an empty inbox cannot be
reviewed. The rows are mundane platform chatter and never claim to be real.

## D21 — The 3D avatar renderer is live on the site (2026-11-02)
**Decided:** the user's renderer replaces the flat CSS avatar everywhere avatars
appear, and the Character page edits colours and faces against the server. This
supersedes D4 ("avatars are 2D") and narrows D3 (no image files).

What changed:

- **Six colours, always.** Fixtures, the store, the partial, the editor and the
  renderer all carry `head`, `torso`, `leftArm`, `rightArm`, `leftLeg`, `rightLeg`.
- **Face is an ID** from the eight the renderer knows. The Character page shows
  each face as its PNG on a head-coloured swatch; the renderer draws the same
  PNG on the model, so preview and result cannot disagree.
- **Images are now allowed, but only these.** `head.obj` and the eight face PNGs
  are avatar assets for the renderer, served from `/avatar/` out of
  `client/avatar`. The site's own pages still contain zero image files: the
  header, currency icons and every placeholder remain CSS. D3 was about pages,
  and that still holds.
- **CSS figure is the fallback, not the interface.** It renders inside
  `.fb-avatar__fallback` and is hidden by `is-3d` the moment a canvas mounts. It
  shows only when WebGL is unavailable or the model fails.

Known limits, recorded honestly:

- The renderer imports three.js from esm.sh. If that CDN is blocked, every
  avatar stays flat. Bundling three locally is required before release.
- At most 10 avatars per page are staged, because browsers cap live WebGL
  contexts. Anything past the cap keeps its CSS figure.
- Assets are served from `client/avatar` by a static mount in `server/app.js`,
  which is a temporary location (see the comment there).

## D22 — Appearance is stored in memory until Phase 2
**Decided:** `server/services/avatarStore.js` holds appearance in the running
process and writes it back onto the fixture user, so a change is real, survives
navigation, and shows up on every page that renders that member.
**Why:** the editor has to do something honest now. Accounts and D1 do not exist
yet, so there is nothing else to write to.
**Limit, stated on the page itself:** it is one shared record, because there are
no accounts, and it resets when the server restarts. The store exposes
`get`/`save`/`defaults` so Phase 2 replaces the body of one file without touching
a route or a template.

## D15 — No deployment without approval
**Decided:** Nothing is pushed to `fieldbrik.com` or any host without the user
explicitly asking. The dev preview on the sandbox hostname is not a deployment.
