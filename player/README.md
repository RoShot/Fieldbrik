# FieldBrik Player

The standalone desktop client for FieldBrik. Windows, C++, Win32 and Direct3D 11,
no third-party dependencies.

This is **0.6**: a window, a world of bricks, and a blocky avatar that walks,
jumps and falls with limbs that swing. Gravity pulls it down, bricks stop it, low
bricks are walked up, and falling off the baseplate puts it back at the spawn
point.

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
- `TextureID`, read and kept, e.g. `rbxasset://textures/...`. Nothing is drawn
  from it yet.

A `SpawnLocation` item puts the player on top of it instead of at the default
spawn. `player/Place/default.rbxl` is a working sample that rebuilds the built-in
world, with a commented-out spawn location to copy.

The reader is strict and names what went wrong — the tag without a name, a tag
that is never closed, a file with no parts in it — and falls back to the built-in
world rather than showing an empty screen.

## The avatar

Six rigid boxes, no animation, five studs tall and four wide: a 2×1×1 head on a
2×2×1 torso, with 1×2×1 arms and legs. Yellow head and arms, blue torso, green
legs, and a two-dot-and-a-smile face drawn as small boxes on the front of the
head.

That is the 2005 default avatar from the DynaBlocks/early-Roblox era: blocky,
robotic, made of the same bricks as the world. The round studs on the top faces
belong to the 2006 pass and are not here yet.

## Animation

The motion is the old client's `Animate` script, ported from its Lua rather than
invented. Nothing is a keyframe clip: every joint chases a desired angle at a
capped rate, which is what makes the arms lag behind the legs.

- Standing sways by 0.1 radians at 1 radian per second — barely visible.
- Running swings the hips a full radian at frequency 9, so a cycle takes about
  0.7 seconds at any speed. The arms want the same swing but are limited to 0.15
  radians per tick, so they trail at roughly a third of it.
- Jumping and falling throw the arms up to 180 degrees and straighten the legs.

The body swings round to face the direction of travel, limbs swinging from the
shoulders and the hips, and a step up is eased over a couple of frames instead of
teleporting a whole stud.

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
    Rendering/     Direct3D 11 device, depth buffer, cube mesh, shaders
    Camera/        third-person follow camera
    Characters/    the avatar's body and the player's movement
    Physics/       collision against the bricks
    World/         the Part type, the place reader and the test world
    Input/         keyboard and mouse state
  Documentation/   roadmap, milestone notes
```

`Objects/` and `Audio/` arrive with the milestones that need them, rather than as
empty folders.

## Design notes

- **One file to ship.** The C runtime is linked statically (`/MT`) and there are
  no DLLs beside the exe, so "download and double-click" actually works.
- **No framework.** Win32 for the window, Direct3D 11 for the picture, DirectXMath
  for the maths. Everything else is written here, in small files.
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

## Known issues

- No scripts. Nothing in a place file runs: no Lua, no buttons, no damage, no
  sound, no tools. A place is geometry plus where you start.
- Boxes only. Every part is a rectangular brick: no spheres, wedges or cylinders,
  and no surfaces or materials. `TextureID` is read and kept, but nothing is
  drawn from it.
- `.fbrx` is recognised and refused for now, with a message saying it is not
  supported yet.
- Unanchored parts stay exactly where the file put them. Physics is the player's,
  not the world's.
- Slopes are stood on rather than walked up, and nothing slides.
- Input is only read while the client is the foreground window, so typing in
  another window cannot walk the player around.
- No tool poses yet: the arm does not come up to hold anything, because there is
  nothing to hold until tools arrive.
- No studs on the avatar's body parts yet.
- Back faces are not culled (`CULL_NONE`). A closed box hides them anyway, so it
  is invisible today; winding will be settled when a mesh importer needs to agree
  with it.
- Depth is a single `D32_FLOAT` buffer with no antialiasing. Edges are aliased, as
  they were in 2005.
- Alt+Enter does nothing on purpose: Direct3D's own fullscreen path fights the
  window's resize handling, so fullscreen will be a client feature instead.
- No icon yet, so the exe and the title bar show the default Windows icon.
