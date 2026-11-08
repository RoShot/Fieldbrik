// The ids of things compiled into the exe, and the one way to read them back.
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

#include <string>
#include <vector>

namespace fieldbrik {

// head.obj: the era's head mesh, 972 vertices and 324 triangles with UVs.
constexpr int kHeadMeshResource = 101;

// face.png: the classic smile, 128x128 RGBA with a transparent background.
constexpr int kFaceTextureResource = 102;

// The sky panorama, when content/textures/sky holds one. Brick textures are
// numbered from 201 upwards by the generated table, because the folder decides
// how many there are.
constexpr int kSkyTextureResource = 150;

// Reads a resource compiled into this executable. Returns false, with `error`
// saying what was missing, when the id is not in the image or is empty.
bool ReadEmbedded(int id, std::vector<unsigned char>& bytes, std::wstring& error);

}  // namespace fieldbrik
