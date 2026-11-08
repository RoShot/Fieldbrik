// A mesh: vertices and indices on the GPU.
//
// Every brick is one unit cube scaled and moved by its own matrix, so a brick of
// any size needs no geometry of its own. One shape is generated here beside the
// cube: the rounded block that stands in for the head when the era's model cannot
// be read. The head itself is the loaded model, in RendererHead.cpp.
//
// Vertices carry a colour as well as a position and a normal. The cube and the
// head leave theirs white and take their colour from the object constants; the
// face and the bricks' studded tops carry texture coordinates there instead.
//
// There are no stud meshes any more: since 0.9 a brick's studs are part of the
// surface strip its faces wear, which is one texture fetch rather than thousands
// of triangles.

#pragma once

#include <d3d11.h>
#include <wrl/client.h>

#include <DirectXMath.h>

#include <vector>

namespace fieldbrik {

// Three attributes, and no texture coordinate: the one textured thing in the
// client is the face plane, and it carries its coordinates in the colour channel
// that every vertex already has.
struct Vertex {
  DirectX::XMFLOAT3 position;
  DirectX::XMFLOAT3 normal;
  DirectX::XMFLOAT3 colour{1.0f, 1.0f, 1.0f};
};

class Mesh {
 public:
  // Immutable geometry: built once, drawn many times. Used for the cube, the
  // head and the whole world's studs.
  bool Create(ID3D11Device* device, const std::vector<Vertex>& vertices,
              const std::vector<unsigned int>& indices);

  void Draw(ID3D11DeviceContext* context) const;
  void Release();

  bool Valid() const { return vertexBuffer_ != nullptr && indexBuffer_ != nullptr; }
  unsigned int IndexCount() const { return indexCount_; }

 private:
  Microsoft::WRL::ComPtr<ID3D11Buffer> vertexBuffer_;
  Microsoft::WRL::ComPtr<ID3D11Buffer> indexBuffer_;
  unsigned int indexCount_ = 0;
};

// A cube from -0.5 to +0.5 on every axis, with flat normals so each face takes
// the light differently. Six faces, four vertices each: shared corners would
// average the normals and round off the flat look.
void BuildUnitCube(std::vector<Vertex>& vertices,
                   std::vector<unsigned int>& indices);

// The 2008 head: a rounded block, 0.11 studs of radius on its vertical edges and
// its top and bottom faces drawn in a little, which is what stops it reading as
// just another brick.
void BuildHead(std::vector<Vertex>& vertices,
               std::vector<unsigned int>& indices);

}  // namespace fieldbrik
