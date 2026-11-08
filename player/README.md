# FieldBrik Player

The standalone desktop client for FieldBrik. Windows, C++, Win32 and Direct3D 11,
no third-party dependencies.

This is **0.9**: a window, a world of bricks, and a blocky avatar that walks,
jumps and falls with limbs that swing. Gravity pulls it down, bricks stop it, low
bricks are walked up, and falling off the baseplate puts it back at the spawn
point. Every brick wears its studs and the texture its `TextureID` names, the sky
is the era's own panorama rather than a gradient, and the avatar wears the era's
own head model and face image.

The world it walks in comes out of a **place file**, not out of the exe. Point
the client at a `.rbxl` and that is what loads.

## Run it

Download `FieldBrikPlayer.exe` from the repository's **Releases** page and
double-click it. Nothing needs installing. It looks for `place.rbxl` beside the
exe; with no place file it opens the built-in test world, so a bare exe still
works.

Windows will warn you the first time ("Windows protected your PC") because the
exe is not code-signed. Choose **More info → Run anyway**. That warning is about
the missing signature, not about the file.

The window opens at 1024×768, can be resized, and closes with the title bar X or
**Escape**.

## Controls

| Input | Action |
| --- | --- |
| W / A / S / D | Walk, relative to where the camera is looking |
| Space | Jump (only when standing on something) |
| Left-drag | Look around (drag right and the view turns right) |
| Arrow keys | Look around without the mouse |
| Mouse wheel | Zoom out / in |
| Q / E | Zoom out / in, for a keyboard without a wheel |
| Home | Put the camera back behind the player |
| Escape | Close the client |

## Places

A place is a plain readable XML file — the format Roblox used before 2013 — so it
opens in Notepad, diffs, and can be fixed by hand. Put a file called
`place.rbxl` next to `FieldBrikPlayer.exe` and it loads on start, or pass a path:

```bat
FieldBrikPlayer.exe "C:\maps\crossroads2006.rbxl"
```

`.rbxl`, `.rbxlx` and `.xml` are read. `.fbrx` — the format Studio will save — is
not yet: the client names the file and says so rather than loading nothing.

Every `<Item>` is one brick, and says what you would expect a brick to say:

- `Name`, the label the brick has in an explorer.
- `size`, three numbers in studs. `Size` is accepted too.
- `CFrame`, where it sits: an `X`, `Y`, `Z` position and nine rotation numbers.
  The matrix is kept as a matrix, because that is what a CFrame is, so a brick
  turned on three axes is read exactly rather than flattened into degrees.
- `Color3uint8`, the brick colour, 0–255 per channel.
- `CanCollide`, whether the player is stopped by it.
- `TextureID`, e.g. `rbxasset://textures/Brick.png`. The last segment of the
  path names an image in `player/content/textures/bricks`, and that image covers
  the brick's top face.

A `SpawnLocation` item puts the player on top of it instead of at the default
spawn. `player/Place/default.rbxl` is a working sample that rebuilds the built-in
world, with a commented-out spawn location to copy.

The reader is strict and names what went wrong — the tag without a name, a tag
that is never closed, a file with no parts in it — and falls back to the built-in
world rather than showing an empty screen.

## The avatar

Six parts, five studs tall and four wide: a 2×1×1 head on a 2×2×1 torso, with
1×2×1 arms and legs. Yellow head and arms, blue torso, green legs, and a
smile-and-two-eyes face on the front of the head.

That is the default avatar of the DynaBlocks/early-Roblox era: blocky, robotic,
made of the same bricks as the world, with studs on the top of every part the
same as a brick has.

The head is the era's own model rather than generated geometry: `head.obj`, the
same 972-vertex rounded block the website's avatar renderer uses, drawn at its own
size on the head part. It wears no studs, because the era's head never did.

The face is `face.png` — the classic smile — drawn as a square plane on the front
of the head and alpha tested, so everything the artist did not draw is thrown away
rather than blended: there is no white card where the image ends, and the head
stays solid behind it. The plane is 0.82 of the head's height, which is where the
website's renderer puts it, and the head model is symmetric the same way, so the
face is centred to a hundredth of a stud.

Both files live in `public/avatar/assets`, the one copy in the repository that the
website already serves, and are compiled into the exe as Windows resources. There
is nothing to install beside it.

## Animation

The motion is the old client's `Animate` script, ported from its Lua rather than
invented. Nothing is a keyframe clip: every joint chases a desired angle at a
capped rate, which is what makes the arms lag behind the legs.

- Standing sways by 0.1 radians at 1 radian per second — barely visible.
- Running swings the hips 0.75 of a radian at frequency 9, so a cycle takes
  about 0.7 seconds at any speed and the legs reach about 43 degrees each way.
  The arms want the same swing but are limited to 0.15 radians per tick, so they
  trail at roughly a third of it.
- Jumping and falling throw the arms up to 180 degrees and straighten the legs.
- Landing does not snap the body back into the walk. The jump pose is held for
  half a second after the feet touch down, and the idle then lowers the arms at
  0.15 radians a tick, so they take two more seconds to come back down. Slow, and
  a little wrong on purpose: the client this copies looked exactly like that, and
  a smooth blend would be the one thing the era never had.

The body swings round to face the direction of travel, limbs swinging from the
shoulders and the hips, and a step up is eased over a couple of frames instead of
teleporting a whole stud.

## Textures

`player/content/textures` is the drop folder: `bricks/` holds one image per brick
texture, `sky/panorama.png` holds the sky. Everything in there is compiled into
the exe at build time, so a new file means a rebuild and the download is still one
file.

The names are the whole lookup. A brick is matched by the **last segment of its
`TextureID`**, lowercased, so a place written for the old client finds its art with
no edits: `rbxasset://textures/Brick.png` is `bricks/Brick.png` here. PNG or JPG.

A texture covers the **top face only**, stretched once across the square, which is
where a decal sat in the era; the sides keep their flat colour. The avatar stays
flat throughout.

A place that names an image the exe does not carry is **not run**: the client
lists what is missing and stops, because a brick in the wrong colour is a bug that
hides. With no panorama in `sky/` there is no sky pass at all and the window's
clear colour shows — the gradient is gone rather than kept as a fallback.

## Studs and the sky

Every brick wears studs on its top face, a stud apart, shrunk to fit a brick
that is under a stud across. They are real geometry, generated at load: a stud
is a small eight-sided cylinder, and the 80×80 baseplate's 6400 of them are
built once into one buffer and drawn in a single call. The avatar's ten are
rebuilt each frame, because it moves.

The sky is the era's own panorama: one wide image wrapped round the horizon and
sampled by the direction every pixel looks along, so it turns with the view
instead of being painted on the screen. The horizon is not a separate object: it
is where the image meets the world, and the world covers the rest.

The camera is unaffected by either, but both are drawn behind it: the sky goes
down first with depth off, and the studs are drawn straight after the parts they
sit on.

## Physics

The numbers are the engine's own: gravity is 196.2 studs per second squared, the
walk is 16 studs per second, and a jump leaves the ground at 50, which peaks about
six studs up — the classic jump that lands on a five-stud stack but not a taller
one. Getting up to speed takes about a third of a second and stopping takes about
a fifth, so the walk carries a little weight instead of snapping on and off.

Walking into a wall at an angle slides along it rather than stopping dead: the
part of the velocity heading into the brick is the only part removed.

The player is collided as a box, 1.8 studs across and 5 tall, not as the avatar's
outline: it is what the bricks are, so every test is exact. Each part is resolved
in its own space, by taking the player's eight corners into the brick's local
frame and pushing out along the axis it overlaps least, so bricks rotated on any
axis behave. Movement is cut into slices of at most a fifth of a stud, which is
what stops a fast fall from passing through a one-stud-thick brick.

You are stopped by walls rather than snagging on them, because the shallowest axis
is the one that gets corrected. Land on something and the fall ends there; jump
into the underside of a brick and the head stops against it. Fall below -60 and
the client puts you back at the spawn point instead of dropping you forever.

A ledge up to 1.15 studs high is walked up instead of jumped onto: the client
lifts the player over it, checks there is room at the top, and sets them back down
on it. That is what makes the steps and the one-stud bricks walkable, and it stops
short of anything that should really be jumped.

The camera is kept out of the bricks too. It casts from the player's chest towards
where it wants to sit and stops short of the first thing along that line, so
zooming out with a wall behind you pulls the view in instead of putting the camera
inside the wall.

Movement is relative to the camera, and it is right in every direction now: the
strafe vector was mirrored, which only showed once the view was turned sideways.
Walking and strafing both go where the view says they should.

## What is in the world

The baseplate is an ordinary part (80×1×80 studs), not a special case, which is
what lets the same code draw it and collide with it. On top of it are ten parts of
different sizes, colours and angles: a red slab, a yellow pillar, a green wall, a
white cube turned 30°, a grey plane tilted on two axes, a blue block, and three
steps.

Each one is a `Part`: position, size, rotation in degrees, colour, and whether it
collides. The renderer draws every part as the same unit cube scaled and moved by
that part's own matrix, so a brick of any size needs no geometry of its own, and
the avatar is drawn with exactly the same code path as the bricks.

## Build it yourself

Only needed if you want to change the code. You need Visual Studio 2022 or newer
with the "Desktop development with C++" workload (which brings MSVC, CMake and the
Windows SDK).

```bat
cmake -S player -B player/build -A x64
cmake --build player/build --config Release
```

The exe lands in `player\build\Release\FieldBrikPlayer.exe`.

The build is also done for you: `.github/workflows/player-build.yml` compiles it
on every push that touches `player/`, and a dispatch with a `release_tag` input
attaches the exe to a release.

## What is here

```
player/
  CMakeLists.txt
  Source/
    Application/   entry point, the frame loop, shutdown
    Window/        Win32 window, resize, clean close
    Rendering/     Direct3D 11 device, meshes, shaders, sky, the head and its face
    Camera/        third-person follow camera
    Characters/    the avatar's body and the player's movement
    Physics/       collision against the bricks
    World/         the Part type, the place reader and the test world
    Input/         keyboard and mouse state
  Tools/           the resource script that compiles the assets into the exe
  Documentation/   roadmap, milestone notes
```

`Objects/` and `Audio/` arrive with the milestones that need them, rather than as
empty folders.

## Design notes

- **One file to ship.** The C runtime is linked statically (`/MT`) and there are
  no DLLs beside the exe, so "download and double-click" actually works.
- **No framework.** Win32 for the window, Direct3D 11 for the picture, DirectXMath
  for the maths. Everything else is written here, in small files.
- **Assets travel inside the exe.** `head.obj` and `face.png` are compiled in as
  Windows resources and the PNG is decoded by the Windows Imaging Component, which
  is part of the operating system. That is what keeps one file to download without
  vendoring a model loader or an image library.
- **The device survives a resize.** Only the back buffer views and the depth
  buffer are rebuilt, which is what keeps the window resizable without flicker or
  crashes.
- **The back buffer is re-acquired every frame.** A flip-model swap chain rotates
  its buffers on `Present`, so a render target view cached at startup stops
  pointing at the buffer being shown. That bug renders nothing at all, while the
  clear colour still reaches the window — worth knowing before it costs an
  afternoon.
- **Movement is camera-relative.** W walks away from the camera rather than along
  a fixed world axis, which is what makes a third-person view usable.
- **The camera trails the player.** The follow point eases, so changing direction
  reads as weight instead of a camera welded to the avatar's back.
- **Flat shading, one fixed light.** No shadows, no ambient occlusion, no
  post-processing: a brick's colour is multiplied by a half-lambert term so its
  faces can be told apart.
- **Studs carry their colour in the vertex.** Thousands of them come from bricks
  of different colours, so baking the colour in is what lets them be one draw
  call instead of one per brick.

## Known issues

- No scripts. Nothing in a place file runs: no Lua, no buttons, no damage, no
  sound, no tools. A place is geometry plus where you start.
- Boxes only. Every part is a rectangular brick: no spheres, wedges or cylinders,
  and no surfaces or materials.
- `.fbrx` is recognised and refused for now, with a message saying it is not
  supported yet.
- Unanchored parts stay exactly where the file put them. Physics is the player's,
  not the world's.
- Slopes are stood on rather than walked up, and nothing slides.
- Input is only read while the client is the foreground window, so typing in
  another window cannot walk the player around.
- Only the top face of a brick is textured, and only the classic smile is
  compiled in: the other seven faces arrive with the website tie-in.
- Expensive studs. The baseplate's are built once into a buffer of about 160,000
  triangles, which is fine on a desktop GPU and would not be on the hardware of
  the era. A brick with more than 8192 studs gets none rather than stalling.
- No tool poses yet: the arm does not come up to hold anything, because there is
  nothing to hold until tools arrive.
- Back faces are not culled (`CULL_NONE`). A closed box hides them anyway, so it
  is invisible today; winding will be settled when a mesh importer needs to agree
  with it.
- Depth is a single `D32_FLOAT` buffer with no antialiasing. Edges are aliased, as
  they were in 2005.
- Alt+Enter does nothing on purpose: Direct3D's own fullscreen path fights the
  window's resize handling, so fullscreen will be a client feature instead.
- No icon yet, so the exe and the title bar show the default Windows icon.
