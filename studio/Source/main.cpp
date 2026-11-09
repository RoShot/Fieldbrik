#include <windows.h>

#include <string>

#include "Studio.h"

// Studio is a separate executable from the player: the editor and the game are
// installed side by side, and neither one starts the other.
int APIENTRY wWinMain(HINSTANCE instance, HINSTANCE, LPWSTR commandLine,
                      int showCommand) {
  // The command line carries the place to edit, the same way the player's
  // carries the place to play. Double-clicking a .fbrx therefore opens it here.
  std::wstring placePath;

  if (commandLine != nullptr) {
    std::wstring arguments = commandLine;
    const size_t first = arguments.find_first_not_of(L" \t");

    if (first != std::wstring::npos) {
      if (arguments[first] == L'"') {
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

  while (!placePath.empty() &&
         (placePath.back() == L'"' || placePath.back() == L'\'')) {
    placePath.pop_back();
  }

  fieldbrik::Studio studio;
  return studio.Run(instance, showCommand, placePath);
}
