#include "Rendering/Mesh.h"

#include <cmath>

using namespace DirectX;

namespace fieldbrik {
namespace {

void AddFace(std::vector<Vertex>& vertices, std::vector<unsigned int>& indices,
             XMFLOAT3 a, XMFLOAT3 b, XMFLOAT3 c, XMFLOAT3 d, XMFLOAT3 normal,
             XMFLOAT3 colour = {1.0f, 1.0f, 1.0f}) {
  const unsigned int base = static_cast<unsigned int>(vertices.size());
  vertices.push_back({a, normal, colour});
  vertices.push_back({b, normal, colour});
  vertices.push_back({c, normal, colour});
  vertices.push_back({d, normal, colour});

  indices.push_back(base + 0);
  indices.push_back(base + 1);
  indices.push_back(base + 2);
  indices.push_back(base + 0);
  indices.push_back(base + 2);
  indices.push_back(base + 3);
}

void AddTriangle(std::vector<Vertex>& vertices,
                 std::vector<unsigned int>& indices, XMFLOAT3 a, XMFLOAT3 b,
                 XMFLOAT3 c, XMFLOAT3 normal, XMFLOAT3 colour) {
  const unsigned int base = static_cast<unsigned int>(vertices.size());
  vertices.push_back({a, normal, colour});
  vertices.push_back({b, normal, colour});
  vertices.push_back({c, normal, colour});

  indices.push_back(base + 0);
  indices.push_back(base + 1);
  indices.push_back(base + 2);
}

}  // namespace

void BuildUnitCube(std::vector<Vertex>& vertices,
                   std::vector<unsigned int>& indices) {
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

void BuildHead(std::vector<Vertex>& vertices,
               std::vector<unsigned int>& indices) {
  vertices.clear();
  indices.clear();

  // Rounded vertical edges, and a top and bottom that are drawn in a little, so
  // the block reads as the head mesh rather than as a second torso.
  constexpr float kRadius = 0.11f;
  constexpr int kCornerSegments = 3;
  constexpr float hx = 0.5f;
  constexpr float hz = 0.5f;

  const float cornerX = hx - kRadius;
  const float cornerZ = hz - kRadius;

  // The silhouette, walked anticlockwise from +X: four corners of three segments
  // each. Point and outward normal are both kept, because the sides are shaded
  // from the normal rather than from a face normal.
  std::vector<XMFLOAT3> points;
  std::vector<XMFLOAT3> normals;

  for (int corner = 0; corner < 4; ++corner) {
    const float start = static_cast<float>(corner) * 90.0f;
    const float centreX = (corner == 0 || corner == 3) ? cornerX : -cornerX;
    const float centreZ = (corner == 0 || corner == 1) ? cornerZ : -cornerZ;

    for (int segment = 0; segment <= kCornerSegments; ++segment) {
      if (segment == 0 && corner > 0) continue;  // the previous corner ended here

      const float degrees =
          start + 90.0f * static_cast<float>(segment) /
                      static_cast<float>(kCornerSegments);
      const float radians = XMConvertToRadians(degrees);
      const float sine = std::sin(radians);
      const float cosine = std::cos(radians);

      points.push_back({centreX + kRadius * cosine, 0.0f,
                        centreZ + kRadius * sine});
      normals.push_back({cosine, 0.0f, sine});
    }
  }

  // Four rings up the side: the outer two pulled in towards the middle, which is
  // the rounding on the top and bottom edges.
  struct Ring {
    float y;
    float inset;
    float tilt;  // how much of the shading normal leans up or down
  };

  const Ring rings[] = {{-0.5f, 0.90f, -0.55f},
                        {-0.38f, 1.0f, 0.0f},
                        {0.38f, 1.0f, 0.0f},
                        {0.5f, 0.90f, 0.55f}};
  constexpr int kRingCount = static_cast<int>(sizeof(rings) / sizeof(rings[0]));

  const size_t count = points.size();
  for (int ring = 0; ring < kRingCount - 1; ++ring) {
    for (size_t i = 0; i < count; ++i) {
      const size_t next = (i + 1) % count;

      const auto place = [&points, &rings](const XMFLOAT3& point, int which) {
        return XMFLOAT3{point.x * rings[which].inset, rings[which].y,
                        point.z * rings[which].inset};
      };

      const XMFLOAT3 normal = [&normals, i, next, &rings, ring]() {
        XMFLOAT3 average{normals[i].x + normals[next].x, 0.0f,
                         normals[i].z + normals[next].z};
        const float length =
            std::sqrt(average.x * average.x + average.z * average.z);
        if (length < 1e-5f) return XMFLOAT3{0.0f, 1.0f, 0.0f};
        average.x /= length;
        average.z /= length;
        average.y = (rings[ring].tilt + rings[ring + 1].tilt) * 0.5f;
        const float normalLength = std::sqrt(average.x * average.x +
                                             average.y * average.y +
                                             average.z * average.z);
        average.x /= normalLength;
        average.y /= normalLength;
        average.z /= normalLength;
        return average;
      }();

      AddFace(vertices, indices, place(points[i], ring),
              place(points[next], ring), place(points[next], ring + 1),
              place(points[i], ring + 1), normal);
    }
  }

  // The top and bottom: a fan from the middle of the ring, so the inset rings
  // close the shape instead of leaving it open.
  for (size_t i = 0; i < count; ++i) {
    const size_t next = (i + 1) % count;
    const float topInset = rings[kRingCount - 1].inset;
    const float bottomInset = rings[0].inset;

    AddTriangle(vertices, indices, {0.0f, 0.5f, 0.0f},
                {points[i].x * topInset, 0.5f, points[i].z * topInset},
                {points[next].x * topInset, 0.5f, points[next].z * topInset},
                {0.0f, 1.0f, 0.0f}, {1.0f, 1.0f, 1.0f});

    AddTriangle(vertices, indices, {0.0f, -0.5f, 0.0f},
                {points[next].x * bottomInset, -0.5f, points[next].z * bottomInset},
                {points[i].x * bottomInset, -0.5f, points[i].z * bottomInset},
                {0.0f, -1.0f, 0.0f}, {1.0f, 1.0f, 1.0f});
  }
}

bool Mesh::Create(ID3D11Device* device, const std::vector<Vertex>& vertices,
                  const std::vector<unsigned int>& indices) {
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
      static_cast<UINT>(indices.size() * sizeof(unsigned int));
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
  if (!Valid() || indexCount_ == 0) return;

  const UINT stride = sizeof(Vertex);
  const UINT offset = 0;
  ID3D11Buffer* buffers[] = {vertexBuffer_.Get()};

  context->IASetVertexBuffers(0, 1, buffers, &stride, &offset);
  context->IASetIndexBuffer(indexBuffer_.Get(), DXGI_FORMAT_R32_UINT, 0);
  context->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST);
  context->DrawIndexed(indexCount_, 0, 0);
}

void Mesh::Release() {
  vertexBuffer_.Reset();
  indexBuffer_.Reset();
  indexCount_ = 0;
}

}  // namespace fieldbrik
