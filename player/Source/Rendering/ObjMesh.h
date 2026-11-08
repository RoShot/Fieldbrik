// Reading a Wavefront OBJ.
//
// The era's head is a model rather than a box, and it is the only model the
// client has, so this reads exactly what that model is made of: positions,
// texture coordinates, normals, and faces of three or four corners. Materials,
// groups and smoothing are ignored, because nothing the client draws needs them.
//
// OBJ indexes each attribute separately - a corner is "position/uv/normal" - but
// the shader wants one index per vertex, so a vertex is emitted per face corner
// and the cost of duplicating a few hundred of them is nothing at this size.

#pragma once

#include <string>
#include <string_view>
#include <vector>

#include "Rendering/Mesh.h"

namespace fieldbrik {

// Geometry ready to hand to Mesh::Create.
struct MeshData {
  std::vector<Vertex> vertices;
  std::vector<unsigned int> indices;
};

// Returns false, with `error` saying what went wrong, when the text is not an
// OBJ or holds no faces. A successful load always leaves `indices` non-empty.
bool ParseObj(std::string_view text, MeshData& out, std::wstring& error);

}  // namespace fieldbrik
