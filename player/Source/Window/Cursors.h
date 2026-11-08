// The era's mouse cursors.
//
// The art is the era's own, compiled into the exe like every other texture and
// read back by id. Three states exist in the client as it is: the arrow, the hand
// while the camera is being dragged, and the resize arrow over the window's
// frame. The gun, its wait variant and the spawn cursor belong to tools, which
// the client does not have yet, so they stay in content/textures/ui rather than
// being carried for a state nothing can enter.
//
// A cursor is a Win32 object, not a Direct3D texture, which is why this lives
// beside the window rather than in the renderer. The decoding is shared in spirit
// with Texture.cpp and deliberately not shared in code: that one hands pixels to
// the GPU, this one to CreateIconIndirect.

#pragma once

#include <windows.h>

namespace fieldbrik {

class Cursors {
 public:
  Cursors() = default;
  ~Cursors();

  Cursors(const Cursors&) = delete;
  Cursors& operator=(const Cursors&) = delete;

  // Reads the embedded art. Anything that cannot be read falls back to the system
  // cursor of the same shape, so a missing file is a plain arrow, not a failure.
  void Load();

  // `hitTest` is the value Windows sends with WM_SETCURSOR, and `dragging` is
  // whether the left button is down in the client area.
  HCURSOR For(unsigned hitTest, bool dragging) const;

 private:
  HCURSOR arrow_ = nullptr;
  HCURSOR drag_ = nullptr;
  HCURSOR resize_ = nullptr;

  // Only the cursors this object created may be destroyed; the fallbacks are
  // shared system cursors and destroying one would be a bug.
  bool ownsArrow_ = false;
  bool ownsDrag_ = false;
  bool ownsResize_ = false;
};

}  // namespace fieldbrik
