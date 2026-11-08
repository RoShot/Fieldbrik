// The renderer: a Direct3D 11 device, one swap chain, one depth buffer, and the
// shaders that draw bricks.
//
// The device survives a resize; the back buffer views, the depth buffer and the
// viewport are rebuilt. Every part is drawn as the same unit cube scaled and
// moved by its own matrix, which is why a brick can be any size without having
// its own geometry. Two shapes sit beside the cube — the stud and the head — and
// one panorama covers the sky.

#pragma once

#include <windows.h>

#include <d3d11.h>
#include <dxgi1_2.h>
#include <wrl/client.h>

#include <string>
#include <vector>

#include "Rendering/Mesh.h"

namespace fieldbrik {

class Camera;
struct Part;

class Renderer {
 public:
  Renderer() = default;
  ~Renderer();

  Renderer(const Renderer&) = delete;
  Renderer& operator=(const Renderer&) = delete;

  bool Initialise(HWND handle, int width, int height);

  // Called from the window's resize handler. Zero-sized requests (a minimised
  // window) are ignored.
  void Resize(int width, int height);

  void BeginFrame(const float clearColour[4]);

  // The sky goes down before anything else and covers whatever is left after
  // the world is drawn: a panorama sampled by the direction each pixel looks
  // along, so it turns with the camera instead of sitting on the screen.
  void DrawSky(const Camera& camera);

  // Draws a list of parts. The world and the avatar are drawn as separate lists
  // so a future second player, or a selection outline, needs no special case.
  void DrawParts(const std::vector<Part>& parts, const Camera& camera);

  // The world's studs never move, so they are built once and drawn as a single
  // batch. The avatar's are rebuilt each frame, because it does.
  void BuildWorldStuds(const std::vector<Part>& parts);
  void DrawWorldStuds(const Camera& camera);
  void DrawStuds(const std::vector<Part>& parts, const Camera& camera);

  void EndFrame();

  void WaitForGpu();
  void Shutdown();

  const std::wstring& LastError() const { return lastError_; }

  // Empty when the head model and its face loaded. Otherwise it says which step
  // failed, and the avatar is drawn without them.
  const std::wstring& HeadAssetError() const { return headAssetError_; }

  // Every TextureID the parts ask for that this exe does not carry. Empty when
  // each one has an image; the client refuses to run otherwise, because a brick
  // in the wrong colour is a bug that hides.
  std::vector<std::string> MissingTextures(const std::vector<Part>& parts) const;

 private:
  bool CreatePipeline();
  bool CreateTargets();
  void ReleaseTargets();

  // Binds a render target for whichever texture is buffer 0 right now. A
  // flip-model swap chain rotates its buffers on Present, so this cannot be
  // cached once at startup.
  bool BindBackBuffer();

  // Input layout, shaders, states and the per-frame constants, ready for parts
  // or studs.
  void BindGeometry(const Camera& camera);

  // One draw's own matrix and colour. `textured` switches the pixel shader to
  // sampling and alpha-testing instead of shading a flat colour, which is how the
  // face is drawn over the head.
  void SetObject(const DirectX::XMFLOAT4X4& world, const DirectX::XMFLOAT4& colour,
                 bool textured = false);

  // The head and its face, in RendererHead.cpp. Both come out of the executable's
  // own resources; without them the generated rounded block is drawn instead.
  bool LoadHeadAssets();
  void DrawHead(const Part& part, const DirectX::XMFLOAT4& colour);
  DirectX::XMFLOAT4X4 HeadMatrix(const Part& part) const;

  // The textures - bricks looked up by the last segment of their TextureID, and
  // the sky panorama. In RendererTextures.cpp.
  bool LoadTextures();
  const ID3D11ShaderResourceView* FindTexture(const std::string& textureId) const;

  Microsoft::WRL::ComPtr<ID3D11Device> device_;
  Microsoft::WRL::ComPtr<ID3D11DeviceContext> context_;
  Microsoft::WRL::ComPtr<IDXGISwapChain> swapChain_;

  Microsoft::WRL::ComPtr<ID3D11RenderTargetView> targetView_;
  Microsoft::WRL::ComPtr<ID3D11Texture2D> depthTexture_;
  Microsoft::WRL::ComPtr<ID3D11DepthStencilView> depthView_;

  Microsoft::WRL::ComPtr<ID3D11VertexShader> vertexShader_;
  Microsoft::WRL::ComPtr<ID3D11PixelShader> pixelShader_;
  Microsoft::WRL::ComPtr<ID3D11InputLayout> inputLayout_;
  Microsoft::WRL::ComPtr<ID3D11Buffer> frameBuffer_;
  Microsoft::WRL::ComPtr<ID3D11Buffer> objectBuffer_;
  Microsoft::WRL::ComPtr<ID3D11RasterizerState> rasterState_;

  // The sky: its own shaders, its own constants, and a depth state that leaves
  // the depth buffer alone, because the sky is behind everything by definition.
  Microsoft::WRL::ComPtr<ID3D11VertexShader> skyVertexShader_;
  Microsoft::WRL::ComPtr<ID3D11PixelShader> skyPixelShader_;
  Microsoft::WRL::ComPtr<ID3D11Buffer> skyBuffer_;
  Microsoft::WRL::ComPtr<ID3D11DepthStencilState> skyDepthState_;

  // One view per back buffer texture. With two buffers this is two entries, and
  // it saves recreating a view every frame while still following the rotation.
  struct BackBufferView {
    Microsoft::WRL::ComPtr<ID3D11Texture2D> texture;
    Microsoft::WRL::ComPtr<ID3D11RenderTargetView> view;
  };
  std::vector<BackBufferView> backBufferViews_;

  Mesh cube_;
  Mesh head_;
  Mesh worldStuds_;
  Mesh avatarStuds_;

  // The era's head model and the plane its face is drawn on.
  Mesh headModel_;
  Mesh faceQuad_;

  // One square across the top of a brick, carrying its texture coordinates in
  // the colour channel like the face plane does.
  Mesh topFace_;

  // The face image, and a single white texel bound whenever a draw is not
  // textured so the pipeline is never left with a hole in it.
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> faceTexture_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> whiteTexture_;

  // Point filtering, clamped: the face is 128 pixels of line art and is meant to
  // stay sharp rather than be smoothed. Brick textures use it too.
  Microsoft::WRL::ComPtr<ID3D11SamplerState> samplerState_;

  // The sky's panorama and its own sampler: linear, and wrapping round, because
  // a wrapped picture has an edge that must not show.
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> skyTexture_;
  Microsoft::WRL::ComPtr<ID3D11SamplerState> skySampler_;

  // A brick texture and the key its TextureID is matched by: the last path
  // segment, lowercased.
  struct TextureEntry {
    std::string name;
    Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> view;
  };
  std::vector<TextureEntry> textures_;

  // The avatar can only ever wear so many studs; this is its ceiling.
  static constexpr unsigned int kAvatarStudVertices = 4096;
  static constexpr unsigned int kAvatarStudIndices = 8192;

  int width_ = 0;
  int height_ = 0;
  std::wstring lastError_;
  std::wstring headAssetError_;
};

}  // namespace fieldbrik
