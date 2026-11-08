// Keyboard and mouse input.
//
// GetAsyncKeyState rather than WM_KEYDOWN: it answers "is this key held right
// now", which is what dragging a camera needs, and it needs no message plumbing.
// The edge-triggered question ("was it pressed this frame") is answered by
// comparing against the previous frame. The mouse is polled the same way.

#pragma once

#include <windows.h>

#include <array>

namespace fieldbrik {

class Input {
 public:
  static constexpr int kKeyCount = 256;

  void Update();

  bool KeyDown(int virtualKey) const;
  bool KeyPressed(int virtualKey) const;

  bool LeftButton() const { return leftButton_; }

  // Movement of the cursor since the previous frame, in pixels.
  float MouseDeltaX() const { return mouseDeltaX_; }
  float MouseDeltaY() const { return mouseDeltaY_; }

 private:
  std::array<bool, kKeyCount> current_{};
  std::array<bool, kKeyCount> previous_{};

  POINT mouse_{};
  bool haveMouse_ = false;
  float mouseDeltaX_ = 0.0f;
  float mouseDeltaY_ = 0.0f;
  bool leftButton_ = false;
};

}  // namespace fieldbrik
