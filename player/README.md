# FieldBrik Player

The standalone desktop client for FieldBrik. Windows, C++, Win32 and Direct3D 11,
no third-party dependencies.

This is **0.3**: a window, a world of bricks, and a blocky avatar you can walk
around in third person. There is no gravity, jumping or collision yet — that is
Milestone 4 in `Documentation/ROADMAP.md`.

## Run it

Download `FieldBrikPlayer.exe` from the repository's **Releases** page and
double-click it. Nothing needs installing.

Windows will warn you the first time ("Windows protected your PC"") because the
exe is not code-signed. Choose **More info → Run anyway**. That warning is about
the missing signature, not about the file.

The window opens at 1024×768, can be resized, and closes with the title bar X or
**Escape**.

## Controls

| Input | Action |
| --- | --- |
| W / A / S / D | Walk, relative to where the camera is looking |
| Left-drag | Look around (drag right and the view turns right) |
| Arrow keys | Look around without the mouse |
| Q / E | Zoom out / in |
| Home | Put the camera back behind the player |
| Escape | Close the client |

## The avatar

Six rigid boxes, no animation, five studs tall and four wide: a 2×1×1 head on a
2×2×1 torso, with 1×2×1 arms and legs. Yellow head and arms, blue torso, green
legs, and a two-dot-and-a-smile face drawn as small boxes on the front of the
head.

That is the 2005 default avatar from the DynaBlocks/early-Roblox era: blocky,
robotic, made of the same bricks as the world. It slides and turns — it does not
walk — and the body swings round to face the direction it is moving, which is the
only "animation" of the era. The round studs on the top faces belong to the 2006
pass and are not here yet.

## What is in the world

The baseplate is an ordinary part (80×1×80 studs), not a special case, which is
what lets the same drawing code handle it and what will let it be collided with
later. On top of it are ten parts of different sizes, colours and angles: a red
slab, a yellow pillar, a green wall, a white cube turned 30°, a grey plane tilted
on two axes, a blue block, and three steps.

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
    World/         the Part type and the test world
    Input/         keyboard and mouse state
  Documentation/   roadmap, milestone notes
```

`Physics/`, `Objects/` and `Audio/` arrive with the milestones that need them,
rather than as empty folders.

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

- No gravity, no jumping, no collision. The avatar walks on the flat top of the
  baseplate and is stopped at its edge; you can walk through bricks, and the
  camera can end up inside one.
- No walk animation, by design for this era. The body turns towards its direction
  of travel and slides.
- No studs on the avatar's body parts yet.
- Back faces are not culled (`CULL_NONE`). A closed box hides them anyway, so it
  is invisible today; winding will be settled when a mesh importer needs to agree
  with it.
- Depth is a single `D32_FLOAT` buffer with no antialiasing. Edges are aliased, as
  they were in 2005.
- Zoom is on Q and E rather than the mouse wheel, because the wheel needs window
  messages that the input layer does not read yet.
- Alt+Enter does nothing on purpose: Direct3D's own fullscreen path fights the
  window's resize handling, so fullscreen will be a client feature instead.
- No icon yet, so the exe and the title bar show the default Windows icon.
