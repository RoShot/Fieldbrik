# FieldBrik fieldmap - decision log

Decisions taken from the batched questionnaire. Anything not yet asked is listed at the
end as open. This file is the reference for the 0.13+ passes; when a later answer
contradicts an earlier one, the later one wins and the entry should be corrected here.

## Scope and era

- One pinned era: **2008 interface with 2008 movement**. Where 2006 movement numbers
  barely differ, keep the existing 2006 numbers rather than retuning for its own sake.
- No later eras, ever.
- Version numbers stay **0.x milestones** (0.13, 0.14, ... 1.0). Date-based versions
  were considered and rejected.
- **1.0 means:** joining from the site, seeing other players, chat, and tools working.
- Permanently out of scope: Studio features inside the player, terrain, water.
- In scope, contrary to an earlier reading: **BTools (building) and classic gear** both
  live in the player. What is excluded is a RobloxApp-style Tools tab and the Studio
  application itself.

## Client platform

- Name stays **FieldBrik Player**.
- Windows 10/11, x64 only.
- Window opens at 1024x768 (1024x744 client area), resizable; Fullscreen button gives
  **exclusive** fullscreen, same button returns.
- Interface is laid out in **fixed pixels**; it does not follow Windows DPI scaling.
- Installer with a Start menu entry.
- Client checks for updates on load-in and offers "Version is out of date - Install
  newest?", installing over itself.
- **Local crash log beside the exe.** No telemetry at all.
- Code signing only later, and only if cheap.
- Dependencies: whatever is easiest, with the hard rule that nothing requires a machine
  of ours to stay switched on.

## Input and text entry

- Fixed keys, no rebinding: WASD walk, Space jump, arrows look, Q/E zoom, Home reset
  camera, `/` or the chat button opens chat, Enter sends, Esc cancels, F11-style
  fullscreen via the HUD button.
- Arrows look only; they never walk the avatar.
- Mouse is never captured: the cursor stays visible and only a drag turns the camera.
- Chat bar is append-and-backspace only. No cursor editing, no Ctrl+V paste (paste was
  refused specifically because of spam).
- No IME: Latin characters only.
- Maximum line length **120 characters**.
- Enter does not open the chat bar; only `/`, the chat button, or a click.
- `/` commands: emotes and whispers arrive later, once chat is networked. `/w Name
  message` is the whisper form.

## Camera

- Target: reproduce the 2008 Roblox camera as closely as possible, including
  **discrete (click) zoom** rather than smooth zoom, and **first person at full zoom
  in**. Default distance sits a little closer than now.
- The camera stays where the player puts it; walking does not swing it back behind.
- HUD tilt button steps pitch once per press.
- Camera ignores the player's own limbs and collides only with bricks.
- No fog and no distance culling.

## Avatar

- Body colours come from the site account; a place may override them once morphs exist.
- Always the classic five-stud body; places may not scale it.
- Face: chosen on the account, a place may override (place wins).
- Hats come later with catalog items. Shirt and pants **images** are wanted.
- Other players' bodies animate identically to your own, with names always visible over
  their heads. No chat bubbles above heads.
- Guests get **random body colours** per join.
- Gear is held in the right hand with the arm raised.
- Identity is the site account ID; the leaderboard shows **two columns**, name and ID
  (for example `BrickBuilder` and `3`), built from the server's full player list.
- Health is a real value with the era's thin HUD bar; zero health, Reset Character and
  falling all share one death path.

## Death and respawn

- Death is a **break apart**: limbs unanchor and fall, the head tips on the torso, the
  body comes apart, and after 2-3 seconds the player respawns.
- Limbs are **real falling physics objects**, not a scripted tumble.
- Falling out of the world: 3-5 seconds of falling, break apart, the camera stays on the
  head while the limbs fall away, another 2-3 seconds, then respawn.
- Spawns are picked **at random** when a place has several.

## World and rendering

- Textures/decals apply to **any of the six faces**, named per face; a decal replaces the
  studs on that face.
- Assets are addressed by **numeric asset IDs**, downloaded from the site per place and
  cached, not compiled into the exe.
- Part shapes: box, plus **sphere, wedge and cylinder**.
- No shadows and no antialiasing (era-exact).
- Performance target: about **2,000 parts at 60 fps** at 1024x768 on integrated graphics.
  Places larger than 5,000 parts load with a warning, but there is no hard limit.
- Sky is always the compiled-in 2008 skybox unless a place supplies one (Studio
  drag-and-drop, uploaded as decals); server-side admin tools may also change it.
- Per-place settings read by the client: **sky, gravity, ambient/lighting colour**, and
  **walk speed, jump height and gravity** may all be tuned per place.
- Transparency is wanted but deliberately deferred to the Studio pass, along with
  non-player gravity, publishing, joining from the site and similar - they need a
  testing map to be worth building.
- Unanchored parts fall straight down and land; full part physics comes with that same
  later pass.

## Movement and physics

- Step-up stays at **1.15 studs**; the reported bug (sometimes colliding instead of
  stepping up) is a defect to fix, not an era quirk.
- The reported bug where the jump pose re-triggers after alt-tabbing away and back is
  likewise a defect to fix.
- Shallow slopes are **walkable**; slopes are no longer merely stood on.
- Players collide with each other's bodies.
- No anti-cheat position checks, deliberately: in-game admin tools may grant speed and
  flight to players, so the server cannot assume legal movement.

## Place files

- XML only. Both the era `.rbxl` and the Studio `.fbrx` are XML.
- The player only reads. Studio is the only writer, because building in the player does
  not save.
- Exception: in-game admin tools may modify a place **on the server**, so published
  places are not immutable in practice.
- Unknown classes are skipped and named in the console log.
- Place name appears in the window title only.
- Double-clicking a `.fbrx` opens a small chooser: **Studio** edits it, **Play** drops
  into single player (or multiplayer where possible).
- A place marked **uncopylocked** can be downloaded as a full `.fbrx`, scripts and all,
  from its game page's Edit button.

## Gear and tools

- First gear release: **sword, paint bucket, bazooka**.
- Health system required for gear to matter.
- BTools in the full set: insert, move, colour, delete, resize, lock/anchor, and **copy**.
- In a published place only the owner and admins the owner names may build.

## Studio

- A **separate executable**, installed alongside the player.
- Layout copied from 2008 Roblox Studio 1:1 where practical.
- Panels: Explorer, Properties, Toolbox, script editor, output/console - all of them if
  possible.
- Undo and redo (Ctrl+Z / Ctrl+Y). One-stud snapping with typed size and position.
  Drag-select, multi-move and Model grouping.
- Play Solo launches the place in place for testing.
- Publishing works from Studio and from the site. Publishing **restarts every running
  server**. Published versions are kept and can be reverted from the site.
- Lua scripting ships **after** the first Studio release, as a follow-up.
- Studio gets its own minimal toolbar art; the player's HUD art appears only in playtest.

## Chat

- Safe chat (quick chat) **and** free text.
- Guests and accounts recorded as under 13 get **quick chat only**. 13+ gets free chat.
- Filtering runs on **both client and server**, masks individual words (for example
  `I ####### hate you`) and never tags or blocks a whole sentence. No AI moderation.
- Networked chat is stored on the site, readable by **moderator and above**, access
  logged, retained **30 days**. The admin panel gets a per-game chat view with each
  speaker's username and ID.
- Logging is disclosed only on the site's privacy page.
- Channels: **server-wide and team**; system lines appear in server-wide.
- Dead players can still chat; the log survives respawn.
- Log style: name in white, then the line, no timestamps.
- No join/leave notices.
- A player who keeps dodging the filter is **automatically reported** into the admin
  panel; moderators may warn or ban (first ban three days). Warn and ban both kick the
  player out of the client.

## Reporting, blocking and safety

- **There is no Escape menu.** The HUD Report button opens the list of players currently
  in the place, then the reasons.
- Report reasons: swearing, spam/advertising, harassment/bullying, inappropriate place
  content, cheating/exploiting, and Other with a text box.
- Only players currently in the place can be reported. The report is anonymous to the
  target.
- Blocking on the site means: no friending either way, no trading, no in-game chat, and
  the blocked player is **not drawn in-game** and their lines are hidden; they remain on
  the leaderboard.

## Multiplayer and joining

- Play on the site opens a join endpoint in the style of
  `fieldbrik.com/Place.aspx?ID=<place>/game/Join.ashx`, which hands the client its join.
- Servers are **one Cloudflare room per instance** (Durable Object); nothing of ours has
  to stay running.
- **12 players** per server. Servers fill in order and a new one opens when the last is
  full. Named `PlaceName #1`, `#2` and so on.
- Client simulates movement; the server does not police it.
- Positions at **20 updates per second**, smoothly interpolated for remote players.
- Guests may join multiplayer, restricted to quick chat.
- Any place can be played offline, with or without an account.
- Disconnect: the world freezes, the client retries, then shows an error and quits.
- Outdated clients are refused and told to update.
- Empty servers close when the last player leaves.
- The server's player list fills the leaderboard; live counts on the site are reported
  by the servers themselves.

## Website, as it serves the client

- **Downloads:** fieldbrik.com serves the installers; the GitHub release is a mirror.
- **Download page:** player and Studio as two separate downloads, each showing its
  version and release date. System requirements stated as Windows 10/11 x64, a
  Direct3D 11 GPU and 2 GB RAM. A visitor on any other platform sees a clear
  "Windows 10/11 x64 only" note and is offered no download button.
- The download link sits in the navigation **and** the footer. The home page's PLAY NOW
  goes to the download page.
- **Game page:** the placeholder "no Play button" copy is replaced by the Play box -
  **Play, then Play Offline, then Play as guest**. Under-13 players see no difference;
  the client and server enforce quick chat.
- The game page shows live occupancy and a **server list**; Play joins the fullest server
  with room, and the list allows choosing another. A visitor whose client is out of date
  gets a warning in the Play box before playing.
- A **changelog page** lists each release and what changed.
- The update answer is a **small JSON file on fieldbrik.com** (version, download URL,
  installer hash) fetched on load-in.
- Signup collects a **birth date**; 13+ is computed from it.
- The privacy page now says chat is stored for 30 days and read by moderators, and that
  crash logs stay on the player's machine with no telemetry.
- A **devtools page** documents the six sky faces and their sizes so people can make
  skyboxes.
- Each numeric asset ID has a page showing the image and who uploaded it.
- The join endpoint answers in **XML**, in the shape of the era's `Join.ashx`.
- Edit appears only on a game's own page, not in the games list.

## Admin tools in a place

- In-game admin commands: **jail, ban, kick and fly** at minimum; the rest (speed,
  teleport, freeze) as far as practical. Speed and fly being grantable is exactly why
  the server does not police movement.
- Admin rights come from **the owner's named list plus site staff** (moderator and above).
- Admins get a **small panel opened by a key**, and chat commands as well.
- The site's admin panel can act on a running server: **kick a player** and **stop chat**.

## Moderation rules

- A proven false report punishes the reporter the same way it would have punished the
  target.
- Reports about the same player in the same place appear as **one case with every report
  attached**.

## Assets

- Uploads are open to any **13+ account**, and everything is **queued for approval**.
  A pending asset is hidden from everyone except the uploader.
- Limits: **PNG, up to 1024x1024, up to 4 MB**.
- The client caches downloaded assets in an **assets folder beside the exe**.

## Process

- Tests: keep the probe scripts, and add small **unit tests for pure modules** - chat,
  place parsing, asset resolution.
- One release per pass; Studio gets its own tag once it exists.
- Known issues stay in the **README**.
- The crash log is **text**: build, GPU, the last log lines and the fault address.
- A **debug overlay** toggle shows the same lines the log records.
- A pass is done when the build is clean with no new warnings, the pass's checks have
  been run by hand, and the README and roadmap are updated.
- One commit per pass.

## Sequencing

- **0.13 is fixes and camera:** the step-up bug, the jump pose re-triggering after
  alt-tab, and the 2008 camera brought up to the specified fidelity.
- **Studio comes before multiplayer**, so there are places worth playing before there
  is anyone to play them with.
- 1.0 still means: joining from the site, seeing other players, chat, and tools working.

## Open items needing an external reference

- The exact 2008 camera constants - wheel zoom step, default distance, minimum and
  maximum distance, pitch limits - are not in current documentation, which only
  describes behaviour. They should be taken from an archived era CameraScript rather
  than guessed.
- Whether the client should expose an in-game admin panel to non-admins as a greyed-out
  entry is undecided.
