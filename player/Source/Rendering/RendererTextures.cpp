// The textures: bricks and the sky.
//
// Both are the era's own images, compiled into the exe (see Tools/assets.rc.in)
// and read back by id. What decides which image a brick gets is the last segment
// of its TextureID, so a place file written for the old client finds its art
// without edits: rbxasset://textures/Brick.png is bricks/Brick.png here, matched
// case-insensitively.
//
// The texture only ever covers the top face of a brick, stretched once across it,
// which is what a decal did in the era. The sides keep their flat colour.
//
// The sky is six pictures, one per face of a cube round the camera, sampled by the
// direction each pixel looks along: that is the shape the era shipped it in, and
// the only shape this reads.
//
// With no sky in the exe there is no sky pass at all and the window's clear colour
// is what you see: replacing the gradient outright is deliberate, because a missing
// sky should be obvious rather than quietly plausible.

#include "Rendering/Renderer.h"

#include <windows.h>

#include <d3d11.h>

#include <DirectXMath.h>

#include <algorithm>
#include <cctype>
#include <cwctype>
#include <filesystem>
#include <fstream>
#include <iterator>
#include <string>
#include <vector>

#include "Rendering/Mesh.h"
#include "Rendering/Resources.h"
#include "Rendering/Texture.h"
// Generated beside the build by CMake; the build folder is on the include path.
#include "TextureTable.generated.h"
#include "World/Part.h"

using namespace DirectX;
using Microsoft::WRL::ComPtr;

namespace fieldbrik {

bool Renderer::AddTexturesFromDirectory(const std::wstring& directory) {
  namespace fs = std::filesystem;

  std::error_code failure;
  if (!fs::is_directory(directory, failure)) return false;

  int added = 0;
  for (const fs::directory_entry& entry :
       fs::directory_iterator(directory, failure)) {
    if (failure) break;
    if (!entry.is_regular_file(failure)) continue;

    std::wstring extension = entry.path().extension().wstring();
    std::transform(extension.begin(), extension.end(), extension.begin(),
                   [](wchar_t letter) {
                     return static_cast<wchar_t>(std::towlower(letter));
                   });
    if (extension != L".png") continue;

    const std::wstring file = entry.path().filename().wstring();
    std::string name(file.size(), '\0');
    const int length = WideCharToMultiByte(
        CP_ACP, 0, file.c_str(), static_cast<int>(file.size()), name.data(),
        static_cast<int>(name.size()), nullptr, nullptr);
    if (length <= 0) continue;
    name.resize(static_cast<size_t>(length));

    std::ifstream source(entry.path(), std::ios::binary);
    if (!source) continue;

    std::vector<unsigned char> bytes((std::istreambuf_iterator<char>(source)),
                                     std::istreambuf_iterator<char>());
    if (bytes.empty()) continue;

    ComPtr<ID3D11ShaderResourceView> view;
    std::wstring message;
    if (!CreateTextureFromPng(device_.Get(), bytes.data(), bytes.size(),
                              view.GetAddressOf(), message)) {
      continue;
    }

    // The embedded table is searched first, so a name that is already compiled in
    // keeps the exe's art and this copy is only a decoy. The key is the same one
    // TextureKey below builds: last path segment, lowercased.
    std::string key = name;
    const std::size_t cut = key.find_last_of("/\\");
    if (cut != std::string::npos) key.erase(0, cut + 1);
    std::transform(key.begin(), key.end(), key.begin(), [](unsigned char letter) {
      return static_cast<char>(std::tolower(letter));
    });

    TextureEntry texture;
    texture.name = key;
    texture.view = view;
    textures_.push_back(texture);
    ++added;
  }

  return added > 0;
}

namespace {

// RCDATA, as a number because the resource script carries no headers.
constexpr WORD kResourceTypeData = 10;

// The textured top face sits this far above the brick's own top, in the part's
// own space, so it cannot fight with the face it is covering. At any size the
// bricks in a place are, that is a fraction of a stud.
constexpr float kTopFaceLift = 0.002f;

std::string Narrow(const wchar_t* text) {
  if (!text || !*text) return std::string();

  const int needed = WideCharToMultiByte(CP_UTF8, 0, text, -1, nullptr, 0, nullptr,
                                         nullptr);
  if (needed <= 1) return std::string();

  std::string result(static_cast<std::size_t>(needed - 1), '\0');
  WideCharToMultiByte(CP_UTF8, 0, text, -1, result.data(), needed, nullptr, nullptr);
  return result;
}

// The name a TextureID is looked up by: its last path segment, lowercased. That
// is what makes a rbxasset path and a bare file name the same key.
std::string TextureKey(const std::string& textureId) {
  const std::size_t cut = textureId.find_last_of("/\\");
  std::string name =
      cut == std::string::npos ? textureId : textureId.substr(cut + 1);

  std::transform(name.begin(), name.end(), name.begin(), [](unsigned char c) {
    return static_cast<char>(std::tolower(c));
  });
  return name;
}

// A unit square across the top of a brick, carrying its texture coordinates in
// the colour channel: the shader has no texture coordinate attribute, because the
// face plane already taught it to read them from there.
void BuildTopFace(std::vector<Vertex>& vertices, std::vector<unsigned int>& indices) {
  vertices.clear();
  indices.clear();

  constexpr float kHalf = 0.5f;
  constexpr float kTop = 0.5f + kTopFaceLift;

  struct Corner {
    float x;
    float z;
    float u;
    float v;
  };

  const Corner corners[4] = {
      {-kHalf, kHalf, 0.0f, 0.0f},
      {kHalf, kHalf, 1.0f, 0.0f},
      {kHalf, -kHalf, 1.0f, 1.0f},
      {-kHalf, -kHalf, 0.0f, 1.0f},
  };

  for (const Corner& corner : corners) {
    Vertex vertex;
    vertex.position = {corner.x, kTop, corner.z};
    vertex.normal = {0.0f, 1.0f, 0.0f};
    vertex.colour = {corner.u, corner.v, 0.0f};
    vertices.push_back(vertex);
  }

  const unsigned int order[6] = {0, 1, 2, 0, 2, 3};
  indices.assign(order, order + 6);
}

}  // namespace

bool ReadEmbedded(int id, std::vector<unsigned char>& bytes, std::wstring& error) {
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

bool Renderer::LoadTextures() {
  std::vector<unsigned char> bytes;
  std::wstring error;

  textures_.clear();

  for (const EmbeddedTexture& embedded : kEmbeddedTextures) {
    if (embedded.id == 0 || !embedded.name || embedded.name[0] == L'\0') continue;

    if (!ReadEmbedded(embedded.id, bytes, error)) {
      lastError_ = error;
      return false;
    }

    ComPtr<ID3D11ShaderResourceView> view;
    if (!CreateTextureFromPng(device_.Get(), bytes.data(), bytes.size(),
                              view.GetAddressOf(), error)) {
      lastError_ = error;
      return false;
    }

    TextureEntry entry;
    entry.name = TextureKey(Narrow(embedded.name));
    entry.view = view;
    textures_.push_back(entry);
  }

  // The sky, when the folder has all six faces. Its sampler is linear, because a
  // sky is a photograph rather than line art, and clamped, because the faces meet
  // exactly and there is nothing to wrap.
  if (kSkyPresent) {
    D3D11_SAMPLER_DESC description{};
    description.Filter = D3D11_FILTER_MIN_MAG_MIP_LINEAR;
    description.AddressU = D3D11_TEXTURE_ADDRESS_CLAMP;
    description.AddressV = D3D11_TEXTURE_ADDRESS_CLAMP;
    description.AddressW = D3D11_TEXTURE_ADDRESS_CLAMP;
    description.ComparisonFunc = D3D11_COMPARISON_NEVER;
    description.MaxLOD = D3D11_FLOAT32_MAX;

    if (FAILED(device_->CreateSamplerState(&description, &skySampler_))) {
      lastError_ = L"The sky's sampler could not be created.";
      return false;
    }

    // Six faces, in the order the table lists them: +X, -X, +Y, -Y, +Z, -Z.
    std::vector<std::vector<unsigned char>> faces(kSkyFaceCount);
    const void* images[kSkyFaceCount]{};
    std::size_t sizes[kSkyFaceCount]{};

    for (int face = 0; face < kSkyFaceCount; ++face) {
      if (!ReadEmbedded(kSkyCubeFaceIds[face], faces[face], error)) {
        lastError_ = error;
        return false;
      }
      images[face] = faces[face].data();
      sizes[face] = faces[face].size();
    }

    if (!CreateTextureCubeFromImages(device_.Get(), images, sizes, kSkyFaceCount,
                                     skyCube_.GetAddressOf(), error)) {
      lastError_ = error;
      return false;
    }
  }

  // The surface strip. Point filtering and wrapping: a stud is one tile of 32
  // pixels and has to repeat, not smear, across a face of any size.
  if (kSurfacesPresent) {
    if (!ReadEmbedded(kSurfacesResource, bytes, error)) {
      lastError_ = error;
      return false;
    }

    if (!CreateTextureFromPng(device_.Get(), bytes.data(), bytes.size(),
                              surfacesTexture_.GetAddressOf(), error)) {
      lastError_ = error;
      return false;
    }

    D3D11_SAMPLER_DESC description{};
    description.Filter = D3D11_FILTER_MIN_MAG_MIP_POINT;
    description.AddressU = D3D11_TEXTURE_ADDRESS_WRAP;
    description.AddressV = D3D11_TEXTURE_ADDRESS_WRAP;
    description.AddressW = D3D11_TEXTURE_ADDRESS_WRAP;
    description.ComparisonFunc = D3D11_COMPARISON_NEVER;
    description.MaxLOD = D3D11_FLOAT32_MAX;

    if (FAILED(device_->CreateSamplerState(&description, &surfacesSampler_))) {
      lastError_ = L"The surface sampler could not be created.";
      return false;
    }
  }

  // The sun, the moon and the flare, each optional: a missing one is simply not
  // drawn, and the sky is still a sky.
  {
    const int ids[3] = {kSunResource, kMoonResource, kFlareResource};
    const bool present[3] = {kSunPresent, kMoonPresent, kFlarePresent};
    ID3D11ShaderResourceView** targets[3] = {sunTexture_.GetAddressOf(),
                                             moonTexture_.GetAddressOf(),
                                             flareTexture_.GetAddressOf()};

    for (int index = 0; index < 3; ++index) {
      if (!present[index]) continue;

      if (!ReadEmbedded(ids[index], bytes, error) ||
          !CreateTextureFromPng(device_.Get(), bytes.data(), bytes.size(),
                                targets[index], error)) {
        lastError_ = error;
        return false;
      }
    }
  }

  std::vector<Vertex> vertices;
  std::vector<unsigned int> indices;
  BuildTopFace(vertices, indices);

  if (!topFace_.Create(device_.Get(), vertices, indices)) {
    lastError_ = L"The textured top face could not be prepared.";
    return false;
  }

  return true;
}

const ID3D11ShaderResourceView* Renderer::FindTexture(
    const std::string& textureId) const {
  const std::string key = TextureKey(textureId);

  for (const TextureEntry& entry : textures_) {
    if (entry.name == key) return entry.view.Get();
  }
  return nullptr;
}

std::vector<std::string> Renderer::MissingTextures(
    const std::vector<Part>& parts) const {
  std::vector<std::string> missing;

  // A part's own TextureID and each of its per-face decals, checked once per
  // distinct id: the same picture on a dozen bricks is one missing file.
  const auto report = [this, &missing](const std::string& id) {
    if (id.empty()) return;
    if (FindTexture(id) != nullptr) return;
    if (std::find(missing.begin(), missing.end(), id) != missing.end()) return;
    missing.push_back(id);
  };

  for (const Part& part : parts) {
    report(part.textureId);
    for (const std::string& face : part.faceTextures) report(face);
  }

  return missing;
}

}  // namespace fieldbrik
