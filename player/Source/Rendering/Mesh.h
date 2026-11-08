// A mesh: vertices and indices on the GPU.
//
// Milestone 2 has exactly one mesh, the unit cube, and every brick is that cube
// scaled by its size. Loading real meshes (brick models, the avatar) comes with
// the eras that need them.

#pragma once

#include <d3d11.h>
#include <wrl/client.h>

#include <DirectXMath.h>

#include <vector>

namespace fieldbrik {

struct Vertex {
  DirectX::XMFLOAT3 position;
  DirectX::XMFLOAT3 normal;
};

class Mesh {
 public:
  bool Create(ID3D11Device* device, const std::vector<Vertex>& vertices,
              const std::vector<unsigned short>& indices);

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
                   std::vector<unsigned short>& indices);

}  // namespace fieldbrik
