// The ids of things compiled into the exe.
//
// The head and the face are the era's own assets, and they travel inside the
// executable as Windows resources rather than as files to install beside it:
// the client is still one file you double-click. Tools/assets.rc.in turns these
// same numbers into a resource script at configure time, so the two cannot drift
// apart.
//
// The type is the plain RCDATA (10), written as a number in the resource script
// so it needs no headers.

#pragma once

namespace fieldbrik {

// head.obj: the era's head mesh, 972 vertices and 324 triangles with UVs.
constexpr int kHeadMeshResource = 101;

// face.png: the classic smile, 128x128 RGBA with a transparent background.
constexpr int kFaceTextureResource = 102;

}  // namespace fieldbrik
