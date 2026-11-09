# FieldBrik — handoff

**Read this file first.** It is the one place that says where the project stands, what
is finished, what is left, how to build and release, and which traps have already
cost time. It exists so a new chat can start with this file instead of re-deriving
the project.

Last updated: 9 November 2026, after the Player 0.18 release.

---

## 1. What FieldBrik is

An independent building-and-gaming community in the style of the platforms of
2006–2008: a website that lists places, a desktop client that plays them, and an
editor (Studio) that builds them. The visual target is close enough to 2008 that
footage is hard to tell apart — hard-edged, hand-built, no smooth "modern" UI.

Three parts, one repository:

| Part | Path | Stack | Current version |
|---|---|---|---|
| Website | `server/`, `views/`, `public/`, `db/` | Node + Express, EJS, Cloudflare Workers + D1 | live at fieldbrik.com |
| Client | `player/` | C++20, Direct3D 11, Win32, static CRT | Player **0.18** |
| Editor | `studio/` | C++20, Direct3D 11, Win32, static CRT | Studio **0.9.2** |

Hard rules that come from the project itself:

- **No third-party dependencies** in the client or Studio. DirectXMath and the
  Windows SDK only.
- **Static CRT** (`/MT`) so one exe runs with no redistributable.
- **No installer.** Unzip, run the exe; `content/` sits beside it.
- **Database migrations are idempotent** (`CREATE TABLE IF NOT EXISTS`), because the
  deploy re-runs every migration on each deploy.
- One version bump per pass, and the version is stamped into the exe from
  `CMakeLists.txt` (`Version.generated.h`).

---

## 2. Website — done

- Accounts: register, login, logout, sessions, password hashing, login throttling,
  settings, profiles, people pages, bans and warning acknowledgement.
- Places: create, edit, publish/unpublish, place pages, browsing and filtering on the
  home page, **place file publishing with version history** (`012_place_versions.sql`)
  and **thumbnails** (`013_place_thumbnails.sql`), file download route
  `/games/:slug/file`.
- Social: friends, messages (inbox, sent, compose), forum sections and threads,
  comments/reports, support and report flows.
- Commerce: catalog, item pages, inventory, currency, earnings, Carpenter's Club.
- Content: news CMS with articles and banners (`010_news_cms.sql`), admin content
  editors.
- Admin: dashboard, user moderation (warn/ban), reports queue, badges, catalog admin,
  banners, news, logs, status.
- Legal/parents pages, privacy, terms.
- **13 D1 migrations** in `db/migrations`, plus `db/schema.sql` and `db/seed.sql`.
- Deployed to Cloudflare Workers; the site is live at **fieldbrik.com**.

### Website — not done

- **No Play/Join button.** `views/pages/game.ejs` says so explicitly: the place file
  is real, playing needs the client, and there is no launch route yet.
- **Visit counts are not counted** (the page says "Not counted yet").
- No in-game admin panel or in-game banner/news injection (deliberately deferred;
  the user does not want a news line in the client until the client is finished).
- Studio cannot create a place listing; it can only publish into an existing place.

### Website — how to run and deploy

```bash
npm install
npm start      # http://localhost:3000
npm run dev    # restart on change
```

Node 20+. No local database is needed for the front end.

**Deployment is through GitHub Actions** (`.github/workflows/deploy.yml`), on push to
`main`. **Wrangler is not logged in on this machine**, so do not try to deploy
locally; push and let the workflow run. Migrations run as part of the deploy.

---

## 3. Client (Player) — done

Player **0.18**, built from `player/`, exe at `player/build/Release/FieldBrikPlayer.exe`,
released as `player-v0.18`.

- Direct3D 11 renderer, Win32 window, no external libraries.
- Loads XML places: `.fbrx` (Studio) and `.rbxl`, plus the built-in place. A path on
  the command line opens that place; with no argument it looks for `place.rbxl` /
  `place.fbrx` beside the exe.
- Third-person camera with zoom, tilt and mouse look; WASD movement relative to the
  camera; avatar turns to face travel.
- Physics: era constants — **gravity 196.2**, **walk 16**, **jump 50** studs/s,
  max fall 250. Substepped collision (0.2-stud slices), box player 1.8 × 5, step-up
  of 1.15 studs, walkable slope at 45°, wall sliding, respawn below −60.
- Collision against cubes, wedges, spheres/ellipsoids and cylinders as themselves.
- Avatar: R6-style rigid boxes, 4 wide × 5 tall, feet at y=0, joints as motors that
  chase targets (the old Animate-script model, not keyframes): idle sway, run cycle,
  jump/free-fall, climb, sit, landing hold.
- HUD, all drawn in the era's positions: WASD key art, camera zoom/tilt buttons,
  Report button, Fullscreen/Help/Exit tabs, **Tools and Edit tabs**, **six-slot
  backpack hotbar with numbers**, **health meter** (green, right edge), chat button,
  chat log, quick-chat menu, player list, help screen.
- Chat: the full 2008–2009 quick-chat phrase tree, a short log that ages out, quick
  chat panel, typed messages with caret.
- **2008 text pipeline** (commit `ee88734`): labels render NONANTIALIASED with a
  one-pixel black outline baked into the glyph mask, so text is hard-edged, not the
  antialiased "modern" look.
- 2008 player list and chat log (no panels): bare right-aligned "Players" header,
  muted purple name, chat lines as plain outlined `Name: message`.

### Client — not done (the 2008 overhaul checklist)

Ordered by visual impact:

1. **Avatar geometry**: hand and foot studs are **done** (`341f4c6`: a small
   cylinder parented to each limb, following the swing). Still open: face position
   and face image edit, shirts, t-shirts, pants and hats. The face image is drawn by
   the renderer on the front of the head; the body parts are in
   `player/Source/Characters/Avatar.cpp`.
2. **Animations**: the jump pose's arms now sweep down the front instead of the back
   (`341f4c6`, mirrored shoulder targets in `Avatar::MoveJump`). Still open: walk
   cycle timing to match 2008 footage, and landing hang feel.
3. **Collision quirks**: remaining step-up and push-out edge cases.
4. **World look**: studs on top faces, brick inner bevels, era ambient and
   directional light with no modern shadow maps, sky gradient and clouds, fog.
5. **Camera/controls feel**: era zoom steps and tilt behaviour, no easing.
6. **Audio: blocked.** There is no audio subsystem and **no sound files** in
   `player/content`. Jump, footstep, collision and ambient sounds must be supplied
   or recreated before this can be built.
7. **Join/launch**: the client cannot yet be handed a place by the website.

Do **not** add: a hamburger menu (the three-line icon exists; no menu behind it), a
Customize button, or a news line. Health bar, hotbar, Tools and Edit are wanted and
now exist.

### Client — build

```bash
cmd //c "tmp\\build-player.bat"
```

That wrapper calls VS 18's `vcvars64.bat` and the VS-bundled `cmake.exe`, then builds
`player/build --config Release`. `cmake` is **not** on the Git Bash PATH; use the
wrapper or the full VS path. Build must finish with zero warnings.

---

## 4. Studio — done

Studio **0.9.2**, built from `studio/`, exe at `studio/build/FieldBrikStudio.exe`.

- Start Page (baseplate, grass, empty), viewport, panels, full menu tree, selection,
  Explorer list, Toolbox, Properties panel with typed values (Name, Colour, Position,
  Size, Rotation, CanCollide), Format rotate/tilt/roll in 15° steps.
- **Colour dialog** (Format > Colour): RGB sliders, 24-swatch brick palette, live
  preview; OK is one undo step, Cancel restores with no undo entry and no dirty mark.
- **Six face handles** (blue spheres at +X, −X, +Y, −Y, +Z, −Z). Drag a face and the
  brick stretches along **its own local axis** with the opposite face fixed. 0.9.1's
  version measured the drag against a plane square to the axis and scaled backwards;
  **0.9.2 fixed it** by measuring on the axis's projected screen line. Do not
  regress this.
- Save/load XML `.fbrx`, Play Solo (launches the client), Publish to FieldBrik,
  place thumbnails, undo/redo (64 steps).

### Studio — not done

Roadmap sections and scope live in `player/Documentation/ROADMAP.md` (0.24–0.28):

- **0.10** (finishing pass one): rotate tool with arbitrary angles, editable
  Parent/Shape, a real Explorer tree, Toolbox drag-and-drop, grid snap.
- **0.11** (finishing pass two): multi-select, Group/Ungroup, cross-place copy,
  welds, Models, the last placeholder panels.
- **1.0**: DPI scaling, stored sign-in, viewport thumbnail capture, persisted
  recents, script stubs, a measured performance pass.
- **0.28**: launching a place from the website (Join), single-player first.

### Studio — build and tests

```bash
cmd //c "tmp\\build-studio.bat"
powershell -NoProfile -ExecutionPolicy Bypass -File tmp/test-studio-stack.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tmp/test-studio-properties.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tmp/test-studio-colour.ps1
```

Expected lines: `STACK_OK …`, `PROPERTIES_OK part='Spinner'`,
`COLOUR_OK initial=51,128,230 applied=255,0,0 restored=255,0,0`.

`test-studio-properties.ps1` is **timing-sensitive**: under concurrent build load it
can fail at a later step ("did not reopen"), and passes when run alone. Not a
regression.

---

## 5. Release and deploy process

### Versions and tags

- Studio tags: `studio-v0.9.2` (current), `studio-v0.9.1` (superseded — its scaling
  was backwards; do not point anyone at it).
- Player version comes from `player/CMakeLists.txt` (`VERSION 0.16`) and is stamped
  into the exe; the tag must not drift from it.
- Website releases ride on `main` and the Actions deploy.

### Cutting a Windows bundle (what was done for 0.9.2)

1. Build Release with the wrapper; confirm `BUILD_EXIT=0`, zero warnings, and that
   `Version.generated.h` contains the new version string.
2. Stage `FieldBrikStudio.exe`, `FieldBrikPlayer.exe`, `content/`, a README into
   `tmp/release/studio-<version>/`, zip to `tmp/release/FieldBrik-Studio-<version>-win64.zip`.
3. Create the GitHub release with the repo's git credential, then upload the zip:

```bash
cred=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill)
tok=$(printf '%s\n' "$cred" | sed -n 's/^password=//p')
curl -X POST -H "Authorization: Bearer $tok" -H "Content-Type: application/zip" \
  --data-binary @tmp/release/<zip> \
  "https://uploads.github.com/repos/RoShot/Fieldbrik/releases/<id>/assets?name=<zip>"
```

Never print the token. The connected GitHub integration **cannot** attach locally
built files (403, session-owned files only), which is why curl is used.

4. Verify: download the asset back, compare SHA-256, check both exes start with `MZ`.

---

## 6. Traps that have already cost time

- **The staged-index trap.** This checkout once had the entire project tree staged.
  A plain `git commit` after `git add` of one file produced a 210-file commit on an
  old base. Always check `git diff --cached --name-only` before committing, and
  prefer committing an explicit file list. If it happens: `git reset --soft
  origin/main`, verify `git diff --cached --name-only`, recommit.
- **Don't ship UI you have not looked at.** Studio 0.9.1's handles compiled, passed
  their tests, and scaled backwards. Geometry and animation changes need a visual
  check or explicit user confirmation.
- **Deterministic-feeling tests can lie.** `test-studio-properties.ps1` flakes under
  load; run it alone before believing a failure.
- **Migrations re-run.** Any new migration must be idempotent.
- **Wrangler is not logged in here.** Site changes go out through Actions on push.
- **No third-party libraries, static CRT.** Keep it that way.
- **Do not delete `tmp/`.** It holds the build wrappers and test scripts referenced
  above (they are not committed).

---

## 7. Starting a new chat

Give the new chat this, verbatim:

> Read `docs/HANDOFF.md` first, then `player/Documentation/ROADMAP.md`. Continue the
> FieldBrik work from where the handoff says. Build and verify before committing;
> do not ship blind geometry; keep `docs/HANDOFF.md` updated as you go.

Then name the single next task. Good next tasks, in order:

1. Avatar pass: hand/foot studs, face placement, shirts, pants, hats.
2. Animation pass: walk cycle and the jump-arms direction.
3. World look and camera feel.
4. Join: website Play button → client loads the place.
5. Studio 0.10.

Keep each chat to one of those. Commit before switching, and update the "Last
updated" line and the affected section above so the next chat inherits the truth
rather than a stale plan.
