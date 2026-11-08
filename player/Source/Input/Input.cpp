#include "Input/Input.h"

#include <windows.h>

namespace fieldbrik {

void Input::Update() {
  previous_ = current_;

  for (int key = 0; key < kKeyCount; ++key) {
    current_[key] = (GetAsyncKeyState(key) & 0x8000) != 0;
  }
}

bool Input::KeyDown(int virtualKey) const {
  if (virtualKey < 0 || virtualKey >= kKeyCount) return false;
  return current_[virtualKey];
}

bool Input::KeyPressed(int virtualKey) const {
  if (virtualKey < 0 || virtualKey >= kKeyCount) return false;
  return current_[virtualKey] && !previous_[virtualKey];
}

}  // namespace fieldbrik
