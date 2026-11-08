#include "Rendering/Mesh.h"

namespace fieldbrik {
namespace {

void AddFace(std::vector<Vertex>& vertices, std::vector<unsigned short>& indices,
             DirectX::XMFLOAT3 a, DirectX::XMFLOAT3 b, DirectX::XMFLOAT3 c,
             DirectX::XMFLOAT3 d, DirectX::XMFLOAT3 normal) {
  const unsigned short base = static_cast<unsigned short>(vertices.size());
  vertices.push_back({a, normal});
  vertices.push_back({b, normal});
  vertices.push_back({c, normal});
  vertices.push_back({d, normal});

  indices.push_back(base + 0);
  indices.push_back(base + 1);
  indices.push_back(base + 2);
  indices.push_back(base + 0);
  indices.push_back(base + 2);
  indices.push_back(base + 3);
}

}  // namespace

void BuildUnitCube(std::vector<Vertex>& vertices,
                   std::vector<unsigned short>& indices) {
  vertices.clear();
  indices.clear();

  constexpr float h = 0.5f;

  AddFace(vertices, indices, {-h, -h, h}, {h, -h, h}, {h, h, h}, {-h, h, h},
          {0.0f, 0.0f, 1.0f});
  AddFace(vertices, indices, {h, -h, -h}, {-h, -h, -h}, {-h, h, -h}, {h, h, -h},
          {0.0f, 0.0f, -1.0f});
  AddFace(vertices, indices, {h, -h, h}, {h, -h, -h}, {h, h, -h}, {h, h, h},
          {1.0f, 0.0f, 0.0f});
  AddFace(vertices, indices, {-h, -h, -h}, {-h, -h, h}, {-h, h, h}, {-h, h, -h},
          {-1.0f, 0.0f, 0.0f});
  AddFace(vertices, indices, {-h, h, h}, {h, h, h}, {h, h, -h}, {-h, h, -h},
          {0.0f, 1.0f, 0.0f});
  AddFace(vertices, indices, {-h, -h, -h}, {h, -h, -h}, {h, -h, h}, {-h, -h, h},
          {0.0f, -1.0f, 0.0f});
}

bool Mesh::Create(ID3D11Device* device, const std::vector<Vertex>& vertices,
                  const std::vector<unsigned short>& indices) {
  Release();

  if (vertices.empty() || indices.empty()) return false;

  D3D11_BUFFER_DESC vertexDesc{};
  vertexDesc.Usage = D3D11_USAGE_IMMUTABLE;
  vertexDesc.ByteWidth = static_cast<UINT>(vertices.size() * sizeof(Vertex));
  vertexDesc.BindFlags = D3D11_BIND_VERTEX_BUFFER;

  D3D11_SUBRESOURCE_DATA vertexData{};
  vertexData.pSysMem = vertices.data();

  if (FAILED(device->CreateBuffer(&vertexDesc, &vertexData, &vertexBuffer_))) {
    return false;
  }

  D3D11_BUFFER_DESC indexDesc{};
  indexDesc.Usage = D3D11_USAGE_IMMUTABLE;
  indexDesc.ByteWidth =
      static_cast<UINT>(indices.size() * sizeof(unsigned short));
  indexDesc.BindFlags = D3D11_BIND_INDEX_BUFFER;

  D3D11_SUBRESOURCE_DATA indexData{};
  indexData.pSysMem = indices.data();

  if (FAILED(device->CreateBuffer(&indexDesc, &indexData, &indexBuffer_))) {
    Release();
    return false;
  }

  indexCount_ = static_cast<unsigned int>(indices.size());
  return true;
}

void Mesh::Draw(ID3D11DeviceContext* context) const {
  if (!Valid()) return;

  const UINT stride = sizeof(Vertex);
  const UINT offset = 0;
  ID3D11Buffer* buffers[] = {vertexBuffer_.Get()};

  context->IASetVertexBuffers(0, 1, buffers, &stride, &offset);
  context->IASetIndexBuffer(indexBuffer_.Get(), DXGI_FORMAT_R16_UINT, 0);
  context->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST);
  context->DrawIndexed(indexCount_, 0, 0);
}

void Mesh::Release() {
  vertexBuffer_.Reset();
  indexBuffer_.Reset();
  indexCount_ = 0;
}

}  // namespace fieldbrik
