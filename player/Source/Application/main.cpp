// FieldBrik Player - entry point.
//
// wWinMain rather than main because the client is a WIN32 subsystem
// application: double-clicking it opens a window and never a console.
//
// Nothing is created yet at this point. App owns the window, the renderer and
// the loop, so this file stays the smallest thing that can start the client.

#include "Application/App.h"

#include <windows.h>

int WINAPI wWinMain(HINSTANCE instance, HINSTANCE, PWSTR, int showCommand) {
  fieldbrik::App app(instance, showCommand);

  if (!app.Initialise()) {
    return app.FailureCode();
  }

  return app.Run();
}
