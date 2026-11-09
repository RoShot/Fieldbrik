# FieldBrik Studio

The place editor, a **separate executable** from the player. It is installed
beside it and shares the player's renderer, world reader and camera, so a brick
looks the same in the editor as it does in the game.

The aim is 2008 Roblox Studio, 1:1 where practical: the menu bar, two icon
toolbars, a tab strip with the text strip beneath it (Tools / Insert / Fullscreen
/ Help... / Exit), the Explorer and Properties docked right, Output hidden until
asked for, a status bar, and the viewport filling the rest.

This is 0.9. The shell, the viewport, the panels, the full menu tree, selection,
object insertion, the browser-framed Start Page, the Toolbox and in-place editing are real:
parts drag across the build plane, duplicate, cut/copy/paste and delete, undo/redo
covers the last 64 edits, and places save and reopen as `.fbrx`. Format > Rotate,
Tilt, Roll and Colour change the selected part, Play Solo opens the current place
in the player, and closing or replacing a changed place asks before discarding it.

## Building

```
cmd //c "tmp\build-studio.bat"
studio\build\Release\FieldBrikStudio.exe
```

Or by hand, with the same generator the player uses:

```
cmake -S studio -B studio/build -A x64
cmake --build studio/build --config Release
```

That is the Visual Studio generator, which `tmp\build-studio.bat` uses for a
clean build; the exe lands in `studio/build/Release`. The script reuses whichever
generator the build folder already has, so a folder first configured with Ninja
keeps building with Ninja and the exe lands directly in `studio/build`.

The build copies `studio/content` next to the executable, which is where Studio
reads its icons and dropped-in brick textures from. There are no third-party
dependencies.

## What works

- **Viewport** — the shared Direct3D 11 renderer drawing the loaded place with
  the era's sky, surface studs and per-face decals.
- **New place** — startup and File > New both build a small grey studded
  baseplate (40 × 1 × 40, its top at y = 0) and name it `Place1`, `Place2`, and
  so on. The player's built-in demo place is untouched.
- **Tabs** — `Start Page` is the home tab and opens the 2008-style Start Page;
  the open place is the second tab and returns to it. The text strip under the
  tabs opens the Tools, Insert and Help menus, toggles fullscreen and exits.
- **Start Page** — the home tab, or View > Start Page, is a local page inside a
  browser frame: navigation buttons, a readable address bar, a FieldBrik header
  and three templates built on this machine: Baseplate (grey), Grass Baseplate
  (green) and Empty Place (no parts). Refresh and Home work; Back, Forward, Stop
  and Go are visibly disabled because there is no web history to navigate. Clicking
  a template starts a new `PlaceN`, replacing the open place, ready to save.
- **Toolbox** — View > Toolbox docks a panel on the left with Block, Sphere,
  Cylinder and Wedge. Clicking a row inserts it; the viewport and Output shift
  to make room, and Game Layout closes it again.
- **Toolbars** — the standard row has New, Open, Save, Undo, Redo and Play;
  the tools row has the four insertion shapes. New is available from startup,
  while Undo and Redo light up only when their history exists.
- **Insert** — the four shape buttons on the second toolbar, or Insert > Object,
  add a brick where the camera is looking, snapped to the stud grid and kept over
  the baseplate. A new brick stands on the top of whatever is already under that
  point, so repeated inserts stack into a tower instead of piling into one
  merged block. Parts are named `Part`, `Part 2`, `Sphere` and so on, appear in
  Explorer and are selected ready for the next pass.
- **Explorer**, docked right — the place under a `Workspace` root, every part
  listed by name, then the services this build knows about: Players, Lighting,
  StarterPack and Soundscape. Picking a part in the viewport selects its row;
  choosing a row selects the part.
- **Selection** — a blue outline along the part's twelve edges and a white
  handle at each of its eight corners, in the part's own rotation.
- **Editing** — drag a selected part across the build plane, or hold Shift while
  dragging to move it vertically. Delete removes it, and Ctrl+X / Ctrl+C /
  Ctrl+V / Ctrl+D cut, copy, paste and duplicate. Ctrl+Z and Ctrl+Y undo and
  redo up to 64 whole-world steps; New, a template and Open start a fresh
  history. Corner handles resize an axis-aligned part on X and Z; the handle you
  can see is the handle the pointer picks.
- **Properties**, docked right — a bold `Part "Name"` title across the panel,
  then the Property/Value columns, **Appearance** (Colour, Shape) and **Data**
  (Name, Parent, Position, Size, Rotation, CanCollide, TextureID, face decals).
  Double-click a value, or highlight its row and press Enter, to type it: Colour
  takes `#RRGGBB`, Position, Size and Rotation take `x, y, z` (commas or spaces),
  and CanCollide takes `true` or `false`. Enter applies, Esc cancels, clicking
  away applies, and one Ctrl+Z puts it back. Edit > Rename, or F2 from any panel,
  opens Name directly. A value that cannot be read is
  refused with the reason in the status line, and the part is left alone. Parent,
  Shape and the texture rows stay read-only. Every row refreshes after an edit so
  a change can be checked numerically.
- **Output** — hidden by default, the way the reference starts. View > Output,
  Window > Output brings it up; it records startup,
  opened places, load errors and dropped texture notes.
- **Menus** — the full 2008 tree: File, Edit, View, Insert, Format, Tools,
  Window and Help, with the Edit submenus (Find and Replace, Script), the View
  toolbar checks and the Tools > Test submenu. Wired: new, open, exit, Start
  Page, Toolbox, the panel toggles, Game Layout, Fullscreen, About, the text
  strip and Insert > Object. The rest are disabled placeholders for the editing
  passes.
- **File > Open** (Ctrl+O) — `.fbrx`, `.rbxl` and `.rbxlx`. Recent places are
  remembered for the session and listed in the File menu. Launch Studio with a
  place path (or double-click a `.fbrx`) and it opens that place instead of the
  blank `Place1`.
- **Save** (Ctrl+S) — saves the open place; **Save As** writes XML `.fbrx`,
  which the player opens directly. Parts, names, colours, sizes, rotations,
  textures and per-face decals round-trip. The save commands are no longer
  placeholders. Closing or replacing a changed place offers Save, Discard and
  Cancel instead of throwing the work away.
- **File > Publish to FieldBrik** — saves one XML snapshot, signs in to the site
  with the account that owns the place, and uploads it to the place's real
  version history. The dialog takes the site address (default
  `https://fieldbrik.com`), the place slug, ID or full link, the username and
  the password. The password is used for that sign-in only and is wiped before
  the command returns; it is never stored or logged. The newest upload is what
  the place's download link serves, and earlier versions stay on its record.
  This is the same endpoint the website's file picker uses, so the two routes
  cannot disagree about validation or version numbers.
- **Format** — Rotate, Tilt and Roll turn the selected part 15 degrees at a time,
  and Colour opens the Windows colour picker. The change is one undo step.
- **Play Solo** — writes the current place to a temporary `.fbrx` and launches
  `FieldBrikPlayer.exe` beside Studio. In a development build it also finds the
  player under `player/build/Release`.
- **Game Layout** (Home) restores the default arrangement; **Fullscreen** (F11)
  goes borderless and back.
- **Free camera** — fly around the place without touching it. The orbit camera
  the player uses is untouched; Studio turns on the camera's separate free mode.

## Camera

| Input | Action |
| --- | --- |
| Right-drag | Look around |
| W / S | Forward and back along the view |
| A / D | Strafe left and right |
| Q / E | Down and up |
| Shift | Fly faster |
| Wheel | Move along the view |
| Home | Frame the whole place again |

## Content folders

The same shape as the player's `content`, so art can be dragged in:

```
studio/content/
  icons/                 toolbar PNGs, 24x24, read at startup
  textures/
    bricks/              dropped brick PNGs, added to the texture table at startup
    ui/                  reserved for interface art
    sky/                 reserved for a Studio-specific sky
```

- **Icons** are ordinary 24x24 PNGs named after their button (`new.png`,
  `open.png`, `save.png`, `undo.png`, `redo.png`, `select.png`, `move.png`,
  `scale.png`, `rotate.png`, `part.png`, `sphere.png`, `cylinder.png`,
  `wedge.png`, `play.png`). Replace one, restart, done. Missing files leave a
  blank button rather than stopping the editor. The shipped set was drawn by
  `Tools/make-icons.ps1`; edit and re-run that script to change them all.
- **Brick textures** work without a rebuild: every `.png` in
  `content/textures/bricks` is added under its file name in lower case, which is
  how a place's `TextureID` is looked up. The player's compiled-in bricks win on
  a name clash, so the editor and the game cannot disagree about a brick.
- **Sky and UI** folders exist so the layout is complete, but nothing reads them
  yet: the viewport uses the player's sky, mounted the same way.

## The sky

The era's six `null_plainsky512` faces form a continuous ring
`rt -> ft -> lf -> bk`, and Direct3D joins +Z to +X along its right edge. The set
is therefore mounted rotated: `_ft` on +X, `_bk` on -X, `_up` on +Y, `_dn` on
-Y, `_rt` on +Z and `_lf` on -Z. Mounting them in name order is what used to put
non-adjacent pictures together and draw a hard seam at every join. With the ring
order the joins are continuous in the player and in Studio.

## How it is put together

```
studio/
  CMakeLists.txt         the Studio target; compiles the player sources it reuses
  Source/Studio.cpp      frame, menus, toolbars, tabs, panels, Start Page, picking
  Source/Studio.h
  Source/Icons.cpp       WIC PNG to HBITMAP for the toolbar
  Source/main.cpp
  Tools/make-icons.ps1   draws the shipped toolbar art
  content/               art and the drop-in folders
```

`player/Source/Rendering`, `player/Source/World` and `player/Source/Camera` are
compiled into Studio directly. `Camera` gained a free mode, `Renderer` gained
`AddTexturesFromDirectory`, and `World` gained `BuildBaseplate`, `AddPart` and
`Clear`; none changes what the player does.

## Known issues

- Rotation is in 15-degree steps from the Format menu; there is no rotate tool
  or arbitrary-angle dialog yet.
- Diagnostics and Task Scheduler have no panel yet, and Models, Services and
  Tools are still placeholders.
- The Toolbox is click-to-insert; there is no drag-and-drop from it.
- The Explorer's services are labels, not runtime objects, and the place is a
  flat list under `Workspace` rather than a real hierarchy.
- Properties edits cover Name, Colour, Position, Size, Rotation and CanCollide.
  There is no colour swatch or slider in the panel; colour is typed as hex or
  picked from Format > Colour, and Shape and Parent cannot be changed there yet.
- The inline editor does not follow the panel while the list is scrolled.
- The status line shows parts, frame rate and the place name; the era's
  Sleep/Wait/Scheduler readout is not reproduced.
- No DPI scaling: the chrome is sized in pixels for a 100% display.
- The sky art itself is 512 pixels a face, so looking straight up shows soft
  clouds; that is the picture, not a seam.
- Most menu entries are disabled placeholders for the next passes.
- Publishing needs a place that already exists on the website. Studio can
  replace a place's file, not create the listing, and it asks for the account
  password each time because the editor has no stored sign-in yet.
