# Roadmap

The client is built as a series of eras, not as one jump to a finished look. Each
era is a working client before the next one starts, because the later eras depend
on things the earlier ones prove: you cannot do 2009's animations and game
buttons on a client that has never moved a box across a screen.

The order below is the intended one. It is not a promise about dates.

## 0.1 — Milestone 1: application foundation

Win32 window, Direct3D 11 device, resize, clean close, a frame loop and an fps
readout in the title bar. The screen is cleared to the sky colour and nothing
else.

## 0.2 — Milestone 2: the world — done

A baseplate, a handful of rectangular bricks, a sky colour, a spawn point, and a
`Part` type carrying position, rotation, size, colour and whether it collides.
The world is built from individual parts, because that is what the building
system and Studio will eventually edit.

Shipped with an orbit camera (drag, arrow keys, Q/E zoom) and a depth buffer, so
position, size, rotation and colour can all be checked from any angle.

One thing this milestone taught, worth writing down: a flip-model swap chain
rotates its buffers on `Present`, so a render target view cached at startup
draws into a texture that is never shown. The symptom is an empty frame with the
clear colour still visible — geometry drawn, nothing on screen.

## 0.3 — Milestone 3: the avatar — done

Head, torso, two arms, two legs, rigid, in flat colours with no animation. WASD
movement, sliding rather than walking, and a third-person camera that follows and
orbits.

Shipped as the 2005 default avatar: yellow head and arms, blue torso, green legs,
five studs tall, with a two-dot-and-a-smile face made of small boxes. Movement is
camera-relative and the body turns towards its direction of travel. Dragging the
mouse looks around, and dragging right turns the view right.

## 0.4 — Milestone 4: physics — done

Gravity, jumping, ground and wall collision, friction, and the promise that the
player cannot fall through the baseplate or get permanently stuck.

Shipped with the player collided as a 1.8-by-5 box against every collidable part,
resolved in each part's own space so rotated bricks work, and moved in slices of a
fifth of a stud so a fast fall cannot pass through a thin brick. A jump peaks at
about 4.6 studs, which clears the one-stud bricks and the steps but not the yellow
pillar. Falling below the world puts the player back at spawn.

Still missing from the era: stepping up small ledges, sliding on slopes, and any
collision on the camera, which can still be zoomed inside a brick.

## 0.5 — Milestone 5: place files — done

All of the above in one exe, with the world read from a place file instead of
being compiled in: a pre-2013 XML `.rbxl` (and `.rbxlx`, `.xml`), one `Item` per
brick carrying its name, size, CFrame, colour, whether it collides and its texture
gid, plus spawn locations. `.fbrx` is recognised and refused with a clear message
until Studio can write it.

Also closed off with this milestone: ledges of up to 1.15 studs are stepped up,
the camera collides so it cannot be pushed inside a brick, and input is read only
while the client is the foreground window.

## 0.6 — Milestone 6: the 2006 pass — done

The client the era actually had: an avatar that moves like a body rather than a
box sliding around, a camera you can zoom, and the engine's own movement numbers.

Done:

- The old `Animate` script, ported: joints chase a desired angle at a capped rate
  (Standing 0.1 rad at 1 rad/s, Running 1 rad at 9 rad/s, jump arms to pi), which
  is what makes the arms lag behind the legs.
- Roblox's gravity (196.2), walk speed (16) and jump (50, peaking about 6 studs),
  with acceleration and friction tuned so the walk carries momentum.
- Sliding along walls instead of sticking to them, and a step up that is eased
  instead of snapping a whole stud.
- Mouse wheel zoom, alongside Q and E.

## 0.7 — Milestone 7: studs, sky and a proper head — done

The look of the era, on top of its movement.

Done:

- Studs on every brick's top face, a stud apart, and on the avatar's body parts.
  They are generated geometry in two batches: the world's built once at load
  (158,880 triangles with the default place) and the avatar's rebuilt per frame.
- The sky, as a gradient worked out per pixel from the view direction, so it
  turns with the camera rather than sitting on the screen.
- The head drawn as the era's rounded block instead of as a cube.
- Strafing fixed. The right vector was mirrored, which only showed once the
  camera was turned sideways: W stayed correct while A and D swapped over. Now
  verified at two camera yaws against the direction the view expects.
- The legs swing 43 degrees each way while running, down from the full radian the
  sine asks for, which was reading as a stride rather than a walk.

## 0.8 — Milestone 8: the head and its face — done

The avatar's head is the era's own model, and its face is the era's own image,
rather than geometry generated in code.

- `head.obj` and `face.png` are the files the website's avatar renderer already
  uses, and they stay in `public/avatar/assets` so the repository holds one copy
  of each. CMake compiles them into the exe as Windows resources and the client
  reads them back by id at startup, so the build is still one file to download.
- A small OBJ reader of the client's own: positions, texture coordinates, normals,
  triangles and quads, split per face corner because the shader wants one index
  per vertex.
- PNG decoding through the Windows Imaging Component, which ships with the
  operating system: no image library and no third-party code. The face is alpha
  tested rather than blended, so the head stays solid behind the artwork.
- The five face boxes are gone from the avatar; the head wears no studs, because
  the era's head never did.
- If either asset cannot be read, the client says so and draws the generated
  rounded block instead of a faceless head.
- A jump with a hang in it. The arms go to 180 degrees as the script asks, stay
  there for the whole flight, and are still up for half a second after the feet
  touch down; the idle then lowers them at the script's own 0.15 a tick, which is
  two seconds of slow descent rather than a drop. Nothing is blended, so a
  landing looks like the era's: abrupt, briefly frozen, then lazy.

Still to come: the HUD; tools.

## 0.9 — Milestone 9: brick textures, surfaces and the sky — done

The era's own images, drawn where the era drew them.

- A brick's `TextureID` now puts an image on its **top face**, stretched once
  across the square, the way a decal sat on one face. The sides keep their flat
  colour and the avatar stays flat, because that is what the old client did.
- The image is matched by the **last segment of the `TextureID`**, lowercased, so
  `rbxasset://textures/Brick.png` is `content/textures/bricks/Brick.png` and a
  place written for the old client needs no edits.
- Textures are compiled into the exe like the head and the face, from a table CMake
  generates out of the folder, so adding a file is the whole job and the download
  is still one file.
- A place that asks for an image the exe does not carry is **refused at startup**,
  with the missing names listed. A brick in the wrong colour is a bug that hides.
- The sky is the era's own six-faced skybox instead of a gradient: one picture per
  face of a cube round the camera, sampled by direction, with no fallback — no
  complete set of faces means no sky pass and the clear colour shows. The joins
  are left as the artist drew them rather than stitched.
- The sky's ray is built from the camera's own axes. Inverting the view-projection
  looked right and was not: at these near and far planes the inverse is nearly
  singular, so every pixel came out looking along almost the same direction, and
  the 0.8 "gradient" was in fact one flat colour. The sky now agrees with the
  bricks it is drawn behind.
- The version in the title bar is generated from the one in `CMakeLists.txt`, so it
  can no longer disagree with the release it was built for.

- Brick faces wear the era's surface strip instead of modelled studs: studs on
  top, inlets underneath, weld on the sides, one tile per stud so a face grows the
  way the old client's did. The strip is tinted by the brick's own colour, and a
  `TextureID` still wins, covering the studs under a decal.
- The avatar keeps a single flat stud on each arm's top, and nothing else.
- The sun and the moon, drawn additively in the brightest part of the sky and
  directly opposite it, with the lens flare trailing the sun across the screen.
- The stud geometry is gone: the meshes, the dynamic buffer and the two serverside
  batches that built them were deleted rather than left behind.

## 0.11 — Milestone 11: the HUD where it was — done

- The era's interface is laid out the way 2008 laid it out: Fullscreen, Help...
  and Exit across the top left; the player list in the top right with the camera
  buttons under it and Report under those; W A S D in the lower right corner,
  showing their pressed art while held; the chat button raised off the lower left.
- The key, camera, chat and report art is the era's own, compiled in like every
  other texture. The top three buttons and every label are drawn with GDI in
  Arial at startup, because the drop had no art for them.
- Fullscreen fills the monitor and comes back; Help opens a screen describing
  movement, jumping, looking, zooming and reporting; Exit closes the client. The
  Esc key closes Help before it leaves the game.
- A new screen-space pass draws the interface: four vertices generated from the
  vertex id, source alpha over the world, no depth. It costs one draw call per
  piece and leaves the brick pipeline untouched.
- The face moved 0.4 mm of a stud closer to the head, so it sits on the model
  rather than in front of it.

Still open: the chat and Report buttons have no destination yet, and the tilt
button wears the hover art because no unpressed tilt image exists.

0.11.1 finishes the interaction: every button that has hover and pressed art uses
it, the top strip answers the pointer with a lighter or darker colour, the chat
and Report buttons still do nothing but now look like they were pressed, pressing
anything on the interface no longer drags the camera, the camera holds still
behind the help screen, and a click outside Help closes it.

## 0.12 — Milestone 12: quick chat and the bar — done

- The chat button opens the era's quick chat menu: the 2008-2009 safe chat
  tree kept whole, group headings sitting above their phrases the way the old
  menu stacked them, scrolling under the wheel and closing on a pick.
- A reply bar runs along the lower left, the keys keeping the right corner. It
  is Arial at 12 px over a dark panel with a thin border that brightens while
  it holds the keyboard, and a caret that blinks beside the text.
- Clicking the bar or pressing / takes the keyboard, Enter sends, Backspace
  edits, Esc puts it away. While it is open its letters stop walking the
  avatar, so typing a sentence no longer moves the character.
- What is said gathers in a thin-bordered field under the top strip: eight
  lines, full strength for eight seconds, faded out by eleven.
- The wheel belongs to the menu while it is open and to the camera otherwise.
  The camera also holds still behind the menu, as it already did behind Help.

Still open: nothing is sent anywhere. The bar and the menu feed a local log,
the way safe chat did, so there is nobody on the other end until the client
talks to a server.

## 0.10 — Milestone 10: the cursors and a pose that should not happen — done

- The era's cursors are the mouse cursor: the arrow, the hand while the camera is
  dragged, and the resize arrow over the frame. They are decoded from the exe's
  own resources by `Source/Window/Cursors.cpp`; anything that cannot be read falls
  back to the system cursor of the same shape.
- Being placed in the world is no longer a landing. `Spawn` settles onto the
  ground and starts grounded, so the first frame cannot read as a fall that has
  just ended, swing the arms up and bring them down over the next two seconds.
- The window reports when it comes back to the foreground, and the frame clock
  restarts there rather than counting the time spent in the background; a landing
  pose held from before is dropped at the same moment.
- `SurfacesStrip.png` is settled rather than read: it is the same four tiles at
  half the block size, so one tile per stud samples the same pixels and the long
  strip serves every face.

## 0.13 — Milestone 13: the fixes and the 2008 camera — done

Two movement defects and the camera the era actually had.

- **Walking up a step no longer depends on how fast you were walking.** The settle
  dropped the player in 0.115-stud slices and took whatever axis the resolver
  preferred, which on a slow approach was the step's side: the player was pushed
  back out instead of set on top, so a step could block you. It now scans down
  finely and asks whether a spot would be moved at all, which does not care which
  axis is shallower. A climb also marks itself grounded, so it is not read as the
  end of a fall.
- **The jump pose stopped coming back.** A standing player could end a frame with no
  contact at all and be read as airborne for one frame, which fired the jump pose
  and left the arms up; a probe just below the feet settles that. Coming back to the
  window now also drops any held pose and puts the body at rest, instead of easing
  an arm down from a jump the player made before they alt-tabbed.
- **The camera is click-zoom.** Thirty notches, two studs apart, from first person
  out to 60 studs, with nothing between notches and no distance easing. The default
  sits at 14 studs, a little closer than the old 20. Looking still eases, because
  dragging is a movement rather than a step.
- **First person is the last notch in**, at the head itself, with the avatar not
  drawn and a wider look range than third person has. Q, E and the HUD buttons move
  one notch per press rather than one per frame.
- The view direction now comes from the yaw and pitch instead of a LookAt at the
  focus point, which is what makes a zero distance possible at all: an eye and a
  target in the same place have no direction between them.

Still open: the exact era constants, which need an archived CameraScript rather than
a modern description of the behaviour.

## 0.14 — Milestone 14: the other shapes, decals and slopes — done

- Parts are drawn as a box, a sphere, a cylinder or a wedge. The three new shapes
  are generated in `Mesh.cpp` as unit geometry and scaled by the part's own size,
  so a 2x1x1 sphere is the ellipsoid it should be. A place names a `Shape` on the
  part, or uses the era's own `WedgePart` and `CylinderPart` classes.
- Decals go on any of the six faces. A brick still wears the surface strip, and a
  `Decal` child naming a face covers that face with a picture instead: top,
  bottom, front, back, left or right, each mapped so it reads the right way round
  rather than mirrored. A brick's own `TextureID` remains the top face, and a
  decal on the top overrides it.
- Shallow slopes are walkable. The push out of a brick is its surface normal, so
  the player's velocity is flattened onto that surface: up to forty-five degrees
  he climbs, and anything steeper stays a wall. Walls keep the old behaviour of
  removing only the part of the velocity heading into them.
- Brick texture ids moved to 301. Brick art and the HUD's art both began at 201,
  which the linker rejected as a duplicate resource the first time a brick texture
  existed; no brick art ships yet, so nobody had hit it.

Still to come: shape-accurate collision, and the brick art itself.

## 0.15 — Milestone 15: shapes that collide, and decals that are lit — done

- A wedge is a ramp rather than a box. The resolver treats it as its five faces and
  takes the cheapest way out, so standing on the slope pushes the player along the
  slope's own normal and 0.14's slope walking carries him up it. A steep wedge is
  still a wall, by the same forty-five-degree rule.
- A sphere is an ellipsoid and a cylinder an elliptical barrel. Both are tested
  against the player's box in the part's own space, so a ball is walked around and
  stood on at its crown, and a barrel stops the player at its round side instead of
  at the corners of its box.
- Decals take the same half-lambert shading as the brick they sit on, using the
  face's normal. The head's face image stays unlit on purpose, because line art on
  a head should not dim as the head turns.

Still to come: true edge-against-edge resolution for a box against a rotated wedge,
and the brick art.

## 0.16 — Studio 0.1 and 0.2: the editor shell — done

The editor exists as its own executable, `FieldBrikStudio.exe`, installed beside
the player and linked against the player's renderer, world reader and camera.

- 0.1 put up the first shell: menu bar, one icon toolbar, Explorer, Properties,
  Output, a free camera, Open Place and read-only properties.
- 0.2 rebuilds the load layout against the 2008 reference. The chrome is now the
  menu bar, two icon toolbars, a tab strip with the text strip beneath it
  (Tools / Insert / Fullscreen / Help... / Exit), Explorer and Properties
  docked right, Output hidden until asked for, and a status bar.
- A new place, at startup or File > New, is a small grey studded baseplate (40 x
  1 x 40, top at y = 0) named `Place1`, `Place2` and so on, rather than an empty
  world.
- Tabs are `FieldBrik` and the open place. Explorer lists the place under
  `Workspace` plus the era's services, and picking in the viewport selects the
  matching part. Selection draws the twelve blue box edges and eight white
  corner handles, and Properties groups its rows under bold **Appearance** and
  **Data** headings with a full-width `Part "Name"` title.
- The full 2008 menu tree is laid out: File, Edit (with Find and Replace and
  Script submenus), View (with toolbar checks), Insert, Format, Tools (with the
  Test submenu), Window and Help. New, Open, Exit, the panel toggles, Game
  Layout, Fullscreen and About are wired; the editing entries stay disabled. The
  camera flies as before and Home frames the place again.
- The sky's cube faces are mounted in the set's own ring order
  (`rt -> ft -> lf -> bk` onto +Z, +X, -Z, -X), not in name order. That is what
  removes the hard vertical seams both the player and Studio used to show at
  every join; the face names are not the cube's axes.
- Studio's art is drop-in. `studio/content/icons` is read at startup and every
  PNG in `studio/content/textures/bricks` joins the texture table without a
  rebuild, so the toolbar and the brick art are drag and drop rather than
  compiled in. The shipped icons are drawn by `Tools/make-icons.ps1`.
- The player's own behaviour is unchanged: the camera's free mode and the
  renderer's texture directory do nothing unless Studio turns them on, and 0.15
  still titles itself 0.15 and runs at the same frame rate.

Still to come: editing and manipulation, undo and redo, saving `.fbrx`, the
Toolbox, the Start Page, Play Solo, and the brick art itself.

## 0.17 — Studio 0.3: insert, Start Page and Toolbox — done

Studio can put bricks into a place now, and the two panels the first pass only
named are real.

- The second toolbar's four shape buttons and Insert > Object (Block, Sphere,
  Cylinder, Wedge) add a part where the camera is looking. It is dropped onto
  the build plane, kept over the baseplate, named `Part`, `Part 2`, `Sphere` and
  so on, added to Explorer and selected. The camera now derives its pitch from
  the eye, so the view is centred on the place instead of skimming over it.
- The Start Page (home tab or View > Start Page) offers three templates made on
  this machine: grey Baseplate, green Grass Baseplate and Empty Place. Picking
  one starts a new `PlaceN`, replacing the open place; nothing can be saved yet.
- The Toolbox (View > Toolbox) docks on the left with Block, Sphere, Cylinder and
  Wedge. Clicking a row inserts it, and the viewport and Output make room.
- The Start Page idles the frame loop instead of spinning it at thousands of
  frames a second, so the status readout stays honest.
- The player is unchanged: `World` grew `AddPart`, `Clear` and a coloured
  `BuildBaseplate`, and 0.15 still titles itself 0.15 at the same frame rate.

Still to come: moving, resizing and deleting parts, undo and redo, saving
`.fbrx`, Models, Services and Tools, Play Solo, and the brick art itself.

## 0.18 — Studio 0.4: editing — done

Studio changes a place in place now, without a second renderer or a second
editing model.

- Dragging a selected part moves it on the X/Z build plane; Shift makes the same
  drag vertical. The drag starts from the point under the cursor, so the part
  does not jump when it is picked up.
- Delete removes the selected part. Ctrl+X, Ctrl+C, Ctrl+V and Ctrl+D cut, copy,
  paste and duplicate it, through an internal clipboard that survives deleting
  the original. Pasted and duplicated parts get unique names.
- Ctrl+Z and Ctrl+Y undo and redo whole-world snapshots, 64 deep. New, a Start
  Page template and Open clear both stacks so history never leaks between
  places. The Edit menu's enabled states and eleven accelerators follow.
- Each edit refreshes Explorer, Properties, the selection outline and the status
  line; Properties shows the new position and size immediately.
- Corner handles resize an axis-aligned part on X and Z. The hit test was moved
  from projected screen points to a ray against the eight corners, but it still
  needs a precise hit and is the known rough edge of this pass.
- `World` gained `RemovePart`, `ReplaceParts` and `MutablePart`; the player still
  draws the same built-in place at 0.15.

Still to come: dependable corner-handle resizing, rotation and recolouring,
saving `.fbrx`, Models, Services and Tools, Play Solo, and the brick art itself.

## 0.19 — Studio 0.5/0.6: save, edit and Play Solo — done

A place can leave the editor now, and the player can open it.

- File > Save (Ctrl+S) writes the open place; Save As writes a new `.fbrx`. The
  writer emits the same readable XML the player already reads, so `.fbrx` has no
  second parser and no binary version to maintain.
- Names, positions, sizes, colours, rotation matrices, shapes, collision flags,
  TextureID and per-face decals all round-trip. A harness saves two parts and
  compares every field after loading them back.
- Studio accepts a place path on the command line, so double-clicking a `.fbrx`
  edits it and Save goes back to that file instead of opening a dialog.
- The player accepts `.fbrx` and opens Studio's output directly. It moves to
  0.16; the editor is 0.6.
- Empty `.fbrx` places are valid, unlike the older formats, so the Empty Place
  template can be saved and reopened.
- 0.6 closes the editing loop: screen-space corner-handle picking, 15-degree
  Format rotation/tilt/roll, a colour picker, Play Solo, and Save/Discard/Cancel
  prompts for changed places.

Studio 0.6 closes the editor loop: corner handles pick in screen space, Format
rotates, tilts, rolls and recolours a part, Play Solo writes a temporary `.fbrx`
and launches the player, and dirty places prompt before they are closed or
replaced. Still to come: editable Properties fields, Models, Services and Tools,
DPI-aware chrome, a real Explorer hierarchy, and the brick art itself.

## 0.20 — Studio 0.7: the 2008 interface pass — done

The editor now reads as the 2008 reference rather than merely sharing its parts.

- The home tab is `Start Page`, not a project brand tab. It opens a local start
  page inside browser chrome: Back, Forward, Stop, Refresh, Home, a sunken
  address field and Go. Back, Forward, Stop and Go are visibly disabled because
  the page has no web history; Refresh and Home work.
- The page below the browser has the reference's dark FieldBrik header, the three
  local templates and the footer note. The templates still start a new place and
  still ask before discarding unsaved work.
- Explorer rows select their whole line, and Properties shows the Property/Value
  column headers with grid lines instead of hiding them.
- The standard toolbar now enables New from startup and enables Undo and Redo
  only when their stacks have something in them.
- The window keeps the 2008 metrics: two 30-pixel toolbars, a 26-pixel tab strip,
  a 24-pixel text strip, a 270-pixel right dock and a 22-pixel status line.
- **Publish to FieldBrik** saves one XML snapshot, signs in with the account that
  owns the place, and posts it to the site. Every publish is a new version, and
  the newest is what the place page downloads. The website file picker uses the
  same endpoint, so validation and version numbers cannot drift apart.

Still to come: editable Properties fields, Models, Services and Tools, DPI-aware
chrome, a real Explorer hierarchy, and the brick art itself.

## 0.21 — Studio 0.8: bricks that stack — done

Inserting a brick now stacks it instead of merging it into the one already
there.

- The insert point is snapped to the stud grid and clamped to the baseplate, so
  brick edges meet brick edges rather than landing on fractions of a stud.
- A new brick stands on the top of the highest brick whose footprint covers that
  point, and on the build plane when nothing does. Before, every insert used the
  same height over the same point, so a second brick vanished inside the first
  and a row of them read as one block; the same button pressed again now raises
  the tower by one brick.
- The height comes from the footprint under the point rather than from the face
  the camera's ray struck. Picking the struck face climbed one stud sideways per
  insert, because each new top face met the ray a little further along it, which
  turned a tower into a staircase.
- A brick with CanCollide off is built through, as the era allowed, and a rotated
  brick is measured by its size box.

Still to come: editable Properties fields, Models, Services and Tools, DPI-aware
chrome, a real Explorer hierarchy, and the brick art itself.

## 0.22 — Studio 0.9: properties that are typed — done

A place can be measured into shape now, not only dragged into it.

- Double-click a value in Properties, or highlight its row and press Enter, and
  the cell becomes an edit box over the value. Enter applies, Esc cancels,
  clicking away applies, and the change is one undo step like every other edit.
  F2 goes straight to Name, the way Explorer renames a file.
- Name takes up to 64 characters and refuses a name another part already holds,
  because new parts are named by finding the first free suffix. Colour is six
  hex digits with or without the `#`. Position, Size and Rotation take three
  numbers separated by commas or spaces, so `5, 2.5, -3.5` and `5 2.5 -3.5` both
  read. CanCollide takes `true`, `false`, `1`, `0`, `yes` or `no`.
- Nothing is applied until the whole value parses: a typo refuses the edit, says
  why in the status line, and leaves the part where it was. Sides below 0.1
  studs are refused rather than collapsing a brick to nothing.
- Rotation typed in the panel clears a matrix that came from a place file, so
  the angles that are shown are the angles that are stored.
- Parent, Shape and the texture rows are shown for reference and stay read-only.

Still open: there is no swatch or slider in the panel, Shape and Parent cannot be
changed there, and the editor does not follow a scrolled list.

### 0.23 Place thumbnails

A place tile has always drawn a colour swatch, because no place art existed. A
place can now carry a real picture, and the swatch stays underneath as the
fallback, so a place without one looks exactly as it did before.

- The picture is stored beside the place row as base64 in `games.thumbnail`,
  with its media type and the time it was saved. There is no image bucket: a
  320x200 JPEG is a few tens of KB, and the Worker and Express then share one
  storage plan and one code path.
- The browser crops and shrinks the chosen picture in a canvas before sending
  it, so a phone photo never reaches the server and the stored image is small.
- The server reads the first bytes and accepts only PNG or JPEG. A file with the
  right extension and the wrong bytes is refused, and the cap is 256 KB.
- `GET /games/:slug/thumbnail` serves the image with a five-minute cache; its
  address gains the upload time, so a replacement is seen immediately. A draft's
  thumbnail is visible to its owner and 404 to everybody else, like the draft.
- `POST /places/:id/thumbnail` takes JSON `{ content: <base64 or data URL> }`
  and checks ownership in the service, not only in the route.
- The place page, the Games listing, the home page rows and the featured place,
  My Page and a profile all draw the image; the place page links its owner to
  the edit page to change it.

Still open: Studio does not capture a thumbnail from the viewport yet, so the
picture is chosen on the site rather than taken from the place itself.

## The eras

After the first playable build, the look is moved forward era by era:

1. DynaBlocks (2004–2005) — flat colours, no lighting, everything a box.
2. 2006 — the first Roblox-shaped client: brick colours, studs, simple GUI.
3. 2007 — the toolbars and the first building tools.
4. 2008 — the era of the reference pages the website already copies.
5. 2009 — animations, game buttons, the full HUD.
6. 2010 — the client as it looked after the big UI pass.
7. 2011 — the last era for this client. After that, the eras stop.

Studio and Player are one client in the early eras, the way `RobloxApp` shipped
them. The web launch (a `join.aspx`-shaped handoff from the site to the client)
comes after the client can survive being told which place to load, which is why
the exe already takes its world from data rather than having one compiled in.

## Deliberately not in 0.1

Multiplayer, Lua, asset downloading, Studio, Android, consoles. The architecture
leaves room for them; none of them is being built now.
