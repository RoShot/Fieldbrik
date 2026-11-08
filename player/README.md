# FieldBrik Player

The standalone desktop client for FieldBrik. Windows, C++, Win32 and Direct3D 11,
no third-party dependencies.

This is **0.1, Milestone 1**: it opens a window and starts the renderer. There is
no world, no avatar and no movement yet — those are Milestones 2 to 5 in
`Documentation/ROADMAP.md`.

## Run it

Download `FieldBrikPlayer.exe` from the repository's **Releases** page and
double-click it. Nothing needs installing.

Windows will warn you the first time ("Windows protected your PC") because the
exe is not code-signed. Choose **More info → Run anyway**. That warning is about
the missing signature, not about the file.

The window opens at 1024×768, can be resized, and closes with the title bar X or
**Escape**.

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
on every push that touches `player/` and uploads it as an artifact, so the source
can be edited without a compiler on hand.

## What is here

```
player/
  CMakeLists.txt
  Source/
    Application/   entry point, the frame loop, shutdown
    Window/        Win32 window, resize, clean close
    Rendering/     Direct3D 11 device, swap chain, back buffer
    Input/         keyboard state
  Documentation/   roadmap, milestone notes
```

`Camera/`, `Characters/`, `Physics/`, `World/`, `Objects/` and `Audio/` arrive with
the milestones that need them, rather than as empty folders.

## Design notes

- **One file to ship.** The C runtime is linked statically (`/MT`) and there are
  no DLLs beside the exe, so "download and double-click" actually works.
- **No framework.** Win32 for the window, Direct3D 11 for the picture, DirectXMath
  later for the maths. Everything else is written here, in small files.
- **The device survives a resize.** Only the back buffer and its view are
  recreated, which is what keeps the window resizable without flicker or
  crashes.
- **The window knows nothing about graphics.** It raises resize and close events;
  the renderer reacts. That is what makes a second window, or a second platform,
  possible later.
- **Escape closes the client** while there is no menu to back out of. When there
  is a menu, Escape will belong to the menu.

## Known issues

- Tearing is possible on some displays because presenting is vsynced to the
  window; a fullscreen mode with an explicit present interval comes later.
- Alt+Enter does nothing on purpose: Direct3D's own fullscreen path fights the
  window's resize handling, so fullscreen will be a client feature instead.
- No icon yet, so the exe and the title bar show the default Windows icon.

## Controls (0.1)

| Key | Action |
| --- | --- |
| Escape | Close the client |
