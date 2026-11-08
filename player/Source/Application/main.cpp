// FieldBrik Player - entry point.
//
// wWinMain rather than main because the client is a WIN32 subsystem
// application: double-clicking it opens a window and never a console.
//
// The command line carries one optional thing: the place to open. Dropping a
// .rbxl onto the exe, or launching it from a shortcut with a path, is therefore the
// same code path the website will use to hand over a game later.
//
// Nothing else is created yet at this point. App owns the window, the renderer and
// the loop, so this file stays the smallest thing that can start the client.

#include "Application/App.h"

#include <windows.h>

#include <string>

int WINAPI wWinMain(HINSTANCE instance, HINSTANCE, PWSTR commandLine,
                    int showCommand) {
  std::wstring placePath;

  if (commandLine != nullptr) {
    std::wstring arguments = commandLine;

    // Leading whitespace is never part of the path.
    const size_t first = arguments.find_first_not_of(L" \t");

    if (first != std::wstring::npos) {
      if (arguments[first] == L'"') {
        // Quoted, which is what Windows does for a path with spaces in it: the
        // path runs to the closing quote and stops there.
        const size_t closing = arguments.find(L'"', first + 1);
        placePath = arguments.substr(
            first + 1, closing == std::wstring::npos ? std::wstring::npos
                                                     : closing - first - 1);
      } else {
        const size_t last = arguments.find_first_of(L" \t", first);
        placePath = arguments.substr(first, last == std::wstring::npos
                                                ? std::wstring::npos
                                                : last - first);
      }
    }
  }

  // A stray quote left on the end is a quoting mistake, not part of a file name.
  while (!placePath.empty() &&
         (placePath.back() == L'"' || placePath.back() == L'\'')) {
    placePath.pop_back();
  }

  fieldbrik::App app(instance, showCommand, placePath);

  if (!app.Initialise()) {
    return app.FailureCode();
  }

  return app.Run();
}
