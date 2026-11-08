# FieldBrik Player

The standalone desktop client for FieldBrik. Windows, C++, Win32 and Direct3D 11,
no third-party dependencies.

This is **0.2**: a window, a renderer, and a world made of individual bricks you
can orbit around. There is no avatar and no movement yet — those are Milestones 3
and 4 in `Documentation/ROADMAP.md`.

## Run it

Download `FieldBrikPlayer.exe` from the repository's **Releases** page and
double-click it. Nothing needs installing.

Windows will warn you the first time ("Windows protected your PC") because the
exe is not code-signed. Choose **More info → Run anyway**. That warning is about
the missing signature, not about the file.

The window opens at 1024×768, can be resized, and closes with the title bar X or
**Escape**.

## Controls

| Input | Action |
| --- | --- |
| Left-drag | Orbit the camera around the world |
| Arrow keys | Orbit, for when a trackpad makes dragging awkward |
| Q / E | Zoom out / in |
| Home | Reset the camera |
| Escape | Close the client |

## What is in the world

The baseplate is an ordinary part (80×1×80 studs), not a special case, which is
what lets the same drawing code handle it and what will let it be collided with
later. On top of it are ten more parts of different sizes, colours and angles: a
red slab with a spawn marker through it, a yellow pillar, a green wall, a white
cube turned 30°, a grey plane tilted on two axes, a blue block, and three steps.

Each one is a `Part`: position, size, rotation in degrees, colour, and whether it
collides. The renderer draws every part as the same unit cube scaled and moved by
that part's own matrix, so a brick of any size needs no geometry of its own.

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
    Camera/        orbit camera with easing
    World/         the Part type and the test world
    Input/         keyboard and mouse state
  Documentation/   roadmap, milestone notes
```

`Characters/`, `Physics/`, `Objects/` and `Audio/` arrive with the milestones that
need them, rather than as empty folders.

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
- **The window knows nothing about graphics.** It raises resize and close events;
  the renderer and the camera react.
- **Flat shading, one fixed light.** No shadows, no ambient occlusion, no
  post-processing: a brick's colour is multiplied by a half-lambert term so its
  faces can be told apart.

## Known issues

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
- No avatar, no gravity, no collision. The camera can be moved, the bricks cannot.
