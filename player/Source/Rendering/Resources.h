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

// The sky: 151 to 156 for its six cube faces, in Direct3D's order (+X, -X, +Y,
// -Y, +Z, -Z). Whether the exe carries them is in the generated table, because
// the folder decides. Brick textures are numbered from 201 upwards for the same
// reason.
constexpr int kSkyCubeFirstResource = 151;

// Surfaces.png: the strip of four surface tiles a brick's faces wear, 64x512,
// with studs, inlets, weld and glue stacked top to bottom.
constexpr int kSurfacesResource = 160;

// What hangs in the sky, drawn additively over it: the sun, the moon, and the
// flare that follows the sun.
constexpr int kSunResource = 170;
constexpr int kMoonResource = 171;
constexpr int kFlareResource = 172;

// The era's cursors: the arrow, the hand while the camera is dragged, and the
// resize arrow over the window's frame. They are read by Source/Window/Cursors.cpp
// rather than the renderer, because a cursor is a Win32 object.
constexpr int kArrowCursorResource = 180;
constexpr int kDragCursorResource = 181;
constexpr int kResizeCursorResource = 182;

// Reads a resource compiled into this executable. Returns false, with `error`
// saying what was missing, when the id is not in the image or is empty.
bool ReadEmbedded(int id, std::vector<unsigned char>& bytes, std::wstring& error);

}  // namespace fieldbrik
