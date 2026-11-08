// The head and its face.
//
// The era's head was not a box: it was a model, and the face was a picture on
// the front of it. Both are compiled into the exe as resources (see
// Tools/assets.rc.in) and read back by id here, so the client is still one file
// you double-click with nothing to install beside it.
//
// The assets are the ones the website's avatar renderer already uses, read from
// public/avatar/assets at build time rather than copied into this folder: one
// copy of each in the repository, and the two renderers cannot drift apart.
//
// If either asset cannot be read, the generated rounded block is drawn instead
// and there is no face. That is a build problem rather than a runtime one, but
// falling back keeps the client usable while it is being worked on.

#include "Rendering/Renderer.h"

#include <windows.h>

#include <d3d11.h>

#include <DirectXMath.h>

#include <string>
#include <vector>

#include "Rendering/Mesh.h"
#include "Rendering/ObjMesh.h"
#include "Rendering/Resources.h"
#include "Rendering/Texture.h"
#include "World/Part.h"

using namespace DirectX;

namespace fieldbrik {
namespace {

// The head model measures 1.181 wide, 1.1047 tall and 1.181 deep, centred on its
// own origin and symmetric about x = 0. It is drawn at its own size rather than
// stretched into the 2x1x1 head part, because 1.18 studs across a 2-stud torso
// is the proportion the era had; 1.0 means "as modelled".
constexpr float kHeadModelScale = 1.0f;

// The face is a square plane in the head's own space, sized from the head rather
// than from the image. The website's renderer puts it at 0.82 of the head's
// height, which is 1.048 in the model's own units.
constexpr float kFaceSize = 1.048f;

// A hair in front of the deepest point on the front of the head: close enough
// that it never looks loose, far enough that it cannot z-fight with the surface.
constexpr float kFaceDepth = 0.5906f + 0.0005f;

// RCDATA, as a number because the resource script carries no headers.
constexpr WORD kResourceTypeData = 10;

bool ReadResource(int id, std::vector<unsigned char>& bytes, std::wstring& error) {
  const HMODULE module = GetModuleHandleW(nullptr);

  const HRSRC found =
      FindResourceW(module, MAKEINTRESOURCEW(id), MAKEINTRESOURCEW(kResourceTypeData));
  if (!found) {
    error = L"An asset is missing from the executable.";
    return false;
  }

  const HGLOBAL loaded = LoadResource(module, found);
  const void* data = loaded ? LockResource(loaded) : nullptr;
  const DWORD size = SizeofResource(module, found);

  if (!data || size == 0) {
    error = L"An asset in the executable could not be read.";
    return false;
  }

  const auto* first = static_cast<const unsigned char*>(data);
  bytes.assign(first, first + size);
  return true;
}

// Four corners, wound so the plane faces +Z, which is the direction the avatar
// walks in. UV (0,0) is the image's top left.
void BuildFaceQuad(std::vector<Vertex>& vertices, std::vector<unsigned int>& indices) {
  vertices.clear();
  indices.clear();

  const float half = kFaceSize * 0.5f;

  struct Corner {
    float x;
    float y;
    float u;
    float v;
  };

  const Corner corners[4] = {
      {-half, half, 0.0f, 0.0f},
      {half, half, 1.0f, 0.0f},
      {half, -half, 1.0f, 1.0f},
      {-half, -half, 0.0f, 1.0f},
  };

  for (const Corner& corner : corners) {
    Vertex vertex;
    vertex.position = {corner.x, corner.y, kFaceDepth};
    vertex.normal = {0.0f, 0.0f, 1.0f};

    // The texture coordinate travels in the colour, which is the channel the
    // shader already interpolates; the draw's own colour is white so it costs
    // nothing.
    vertex.colour = {corner.u, corner.v, 0.0f};
    vertices.push_back(vertex);
  }

  const unsigned int order[6] = {0, 1, 2, 0, 2, 3};
  indices.assign(order, order + 6);
}

}  // namespace

bool Renderer::LoadHeadAssets() {
  std::vector<unsigned char> bytes;
  std::wstring error;

  // Both the renderer's own last error and the one the application reports: a
  // headless avatar is a mystery worth explaining rather than a silent fallback.
  const auto fail = [this](const std::wstring& text) {
    lastError_ = text;
    headAssetError_ = text;
    return false;
  };

  if (!ReadResource(kHeadMeshResource, bytes, error)) return fail(error);

  MeshData head;
  const std::string text(bytes.begin(), bytes.end());
  if (!ParseObj(text, head, error)) return fail(error);

  if (!headModel_.Create(device_.Get(), head.vertices, head.indices)) {
    return fail(L"The head mesh could not be uploaded.");
  }

  if (!ReadResource(kFaceTextureResource, bytes, error)) return fail(error);

  if (!CreateTextureFromPng(device_.Get(), bytes.data(), bytes.size(),
                            faceTexture_.GetAddressOf(), error)) {
    return fail(error);
  }

  std::vector<Vertex> vertices;
  std::vector<unsigned int> indices;
  BuildFaceQuad(vertices, indices);

  if (!faceQuad_.Create(device_.Get(), vertices, indices)) {
    return fail(L"The face could not be prepared.");
  }

  return true;
}

// Scale, rotate, translate, exactly as Part::ModelMatrix does - but with the
// model's own scale rather than the head part's box, because the model is not a
// unit cube.
XMFLOAT4X4 Renderer::HeadMatrix(const Part& part) const {
  const XMMATRIX scale = XMMatrixScaling(kHeadModelScale, kHeadModelScale, kHeadModelScale);
  const XMMATRIX rotate = part.RotationMatrix();
  const XMMATRIX translate =
      XMMatrixTranslation(part.position.x, part.position.y, part.position.z);

  XMFLOAT4X4 result;
  XMStoreFloat4x4(&result, scale * rotate * translate);
  return result;
}

void Renderer::DrawHead(const Part& part, const XMFLOAT4& colour) {
  if (!headModel_.Valid()) {
    // No model: the generated rounded block stands in, with no face.
    if (head_.Valid()) {
      SetObject(part.ModelMatrix(), colour, false);
      head_.Draw(context_.Get());
    }
    return;
  }

  const XMFLOAT4X4 matrix = HeadMatrix(part);

  SetObject(matrix, colour, false);
  headModel_.Draw(context_.Get());

  if (!faceQuad_.Valid() || !faceTexture_) return;


  // The face is the head's own geometry with a picture on it: same transform, a
  // textured draw, and alpha test rather than blending, so the head stays solid
  // behind the transparent parts of the image.
  const XMFLOAT4 white(1.0f, 1.0f, 1.0f, 1.0f);
  ID3D11ShaderResourceView* textures[] = {faceTexture_.Get()};
  context_->PSSetShaderResources(0, 1, textures);

  SetObject(matrix, white, true);
  faceQuad_.Draw(context_.Get());

  ID3D11ShaderResourceView* plain[] = {whiteTexture_.Get()};
  context_->PSSetShaderResources(0, 1, plain);
}

}  // namespace fieldbrik
