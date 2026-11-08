// Keyboard input.
//
// GetAsyncKeyState rather than WM_KEYDOWN: it answers "is this key held right
// now", which is what movement needs, and it needs no message plumbing. The
// edge-triggered question ("was it pressed this frame") is answered by comparing
// against the previous frame.

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

 private:
  std::array<bool, kKeyCount> current_{};
  std::array<bool, kKeyCount> previous_{};
};

}  // namespace fieldbrik
