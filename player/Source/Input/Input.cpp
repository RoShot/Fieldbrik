#include "Input/Input.h"

#include <windows.h>

namespace fieldbrik {

void Input::Update() {
  previous_ = current_;

  for (int key = 0; key < kKeyCount; ++key) {
    current_[key] = (GetAsyncKeyState(key) & 0x8000) != 0;
  }

  POINT position{};
  if (GetCursorPos(&position)) {
    if (haveMouse_) {
      mouseDeltaX_ = static_cast<float>(position.x - mouse_.x);
      mouseDeltaY_ = static_cast<float>(position.y - mouse_.y);
    } else {
      // The first sample has nothing to compare against, and reporting the whole
      // screen as a delta would swing the camera on startup.
      haveMouse_ = true;
      mouseDeltaX_ = 0.0f;
      mouseDeltaY_ = 0.0f;
    }
    mouse_ = position;
  }

  leftButton_ = (GetAsyncKeyState(VK_LBUTTON) & 0x8000) != 0;
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
