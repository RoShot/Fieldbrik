// A mesh: vertices and indices on the GPU.
//
// Every brick is one unit cube scaled and moved by its own matrix, so a brick of
// any size needs no geometry of its own. Two shapes exist beside the cube: the
// stud that sits on a brick's top face, and the rounded block the head is drawn
// as. Both are generated here rather than loaded, so the client still ships as a
// single exe with no assets beside it.
//
// Vertices carry a colour as well as a position and a normal. The cube and the
// head leave theirs white and take their colour from the object constants; the
// studs bake their brick's colour in, which is what lets thousands of them from
// different bricks be drawn in one call.

#pragma once

#include <d3d11.h>
#include <wrl/client.h>

#include <DirectXMath.h>

#include <vector>

namespace fieldbrik {

struct Part;

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

  // Geometry that is rewritten every frame, sized once. Used for the avatar's
  // studs, which move with it.
  bool CreateDynamic(ID3D11Device* device, unsigned int maxVertices,
                     unsigned int maxIndices);
  bool Update(ID3D11DeviceContext* context, const std::vector<Vertex>& vertices,
              const std::vector<unsigned int>& indices);

  void Draw(ID3D11DeviceContext* context) const;
  void Release();

  bool Valid() const { return vertexBuffer_ != nullptr && indexBuffer_ != nullptr; }
  unsigned int IndexCount() const { return indexCount_; }

 private:
  Microsoft::WRL::ComPtr<ID3D11Buffer> vertexBuffer_;
  Microsoft::WRL::ComPtr<ID3D11Buffer> indexBuffer_;
  unsigned int indexCount_ = 0;
  unsigned int vertexCapacity_ = 0;
  unsigned int indexCapacity_ = 0;
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

// Appends the studs on one part's top face, already placed in the world and
// already coloured with the part's own colour. A 1x1 brick gets one, a 2x2 four,
// the 80x80 baseplate 6400.
void AppendStuds(const Part& part, std::vector<Vertex>& vertices,
                 std::vector<unsigned int>& indices);

}  // namespace fieldbrik
