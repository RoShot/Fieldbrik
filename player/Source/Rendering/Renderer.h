// The renderer: a Direct3D 11 device, one swap chain, one depth buffer, and the
// shaders that draw bricks.
//
// The device survives a resize; the back buffer views, the depth buffer and the
// viewport are rebuilt. Every part is drawn as the same unit cube scaled and
// moved by its own matrix, which is why a brick can be any size without having
// its own geometry. Two shapes sit beside the cube — the stud and the head — and
// the sky behind them is six pictures round a cube.

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
  // the world is drawn: sampled by the direction each pixel looks along, so it
  // turns with the camera instead of sitting on the screen.
  void DrawSky(const Camera& camera);

  // Draws a list of parts. The world and the avatar are drawn as separate lists
  // so a future second player, or a selection outline, needs no special case.
  //
  // `surfaces` gives each brick the era's surface strip on its faces: studs on
  // top, inlets underneath, weld on the sides, one tile per stud so nothing is
  // stretched. The avatar passes false: its only studs are the two on its arms.
  void DrawParts(const std::vector<Part>& parts, const Camera& camera,
                 bool surfaces = false);

  // One flat stud centred on the top of each arm, from the same strip. Nothing
  // else on the body wears one.
  void DrawAvatarStuds(const std::vector<Part>& parts, const Camera& camera);

  // The sun, the moon and the flare, drawn over the sky and behind the world as
  // additive billboards: the sun where the art is brightest, the moon opposite,
  // and the flare mirrored across the screen while the sun is in view.
  void DrawSkyObjects(const Camera& camera);

  // The HUD: screen-space quads with alpha, drawn after everything else. The
  // coordinates are pixels with the origin at the top left, so the caller thinks
  // in the same units Windows does.
  struct HudSprite {
    float x = 0.0f;
    float y = 0.0f;
    float width = 0.0f;
    float height = 0.0f;
    DirectX::XMFLOAT4 colour{1.0f, 1.0f, 1.0f, 1.0f};
    ID3D11ShaderResourceView* texture = nullptr;
  };

  void DrawHud(const std::vector<HudSprite>& sprites);

  // Interface images: the era's art from the exe, and text drawn by GDI.
  bool LoadHudTexture(int resourceId, ID3D11ShaderResourceView** view);
  bool CreateHudTextureFromBgra(int width, int height, const void* pixels,
                                ID3D11ShaderResourceView** view);

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

  // Adds every PNG in a folder to the brick texture table, keyed by file name in
  // lower case, which is the way a TextureID is looked up. Studio uses this so
  // dropped-in art works without a rebuild; images already compiled into the exe
  // are found first and win. Returns true when at least one image was added.
  bool AddTexturesFromDirectory(const std::wstring& directory);

 private:
  bool CreatePipeline();
  bool CreateHudPipeline();
  bool CreateTargets();
  void ReleaseTargets();

  // Binds a render target for whichever texture is buffer 0 right now. A
  // flip-model swap chain rotates its buffers on Present, so this cannot be
  // cached once at startup.
  bool BindBackBuffer();

  // Input layout, shaders, states and the per-frame constants, ready for parts
  //
  void BindGeometry(const Camera& camera);

  // One draw's own matrix and colour. `textured` switches the pixel shader to
  // sampling and alpha-testing instead of shading a flat colour, which is how the
  // face is drawn over the head. `surfaces` samples the surface strip instead of
  // the object's colour, and `size` is the part's extent in studs, which is what
  // decides how many studs a face shows. `litTexture` gives a textured draw the
  // same shading as the face it covers, which is what makes a decal belong to its
  // brick; the head's face leaves it off and stays at full brightness.
  void SetObject(const DirectX::XMFLOAT4X4& world, const DirectX::XMFLOAT4& colour,
                 bool textured = false, const DirectX::XMFLOAT3* size = nullptr,
                 bool surfaces = false, bool billboard = false,
                 bool litTexture = false);

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

  // The other part shapes, built once and scaled by each part's own size. A
  // part whose mesh failed to build falls back to the cube rather than vanishing.
  Mesh sphere_;
  Mesh cylinder_;
  Mesh wedge_;

  // One square per face of a brick, in the order PartFace lists them: top,
  // bottom, front (-Z), back (+Z), right (+X), left (-X). A face with a decal is
  // drawn with its own texture; the rest keep the surface strip.
  Mesh decalFaces_[6];

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

  // The surface strip and its sampler: point filtering so a stud stays a stud,
  // and wrapping so one stud can repeat across a face of any size.
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> surfacesTexture_;
  Microsoft::WRL::ComPtr<ID3D11SamplerState> surfacesSampler_;

  // The sun, the moon and the flare, and the quad that carries each of them.
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> sunTexture_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> moonTexture_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> flareTexture_;
  Microsoft::WRL::ComPtr<ID3D11BlendState> additiveBlend_;
  Mesh billboard_;

  // The sky's six faces, in one cube texture (the era's own art).
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> skyCube_;

  // Linear filtering for the sky, and clamped: the faces meet exactly, so there
  // is nothing to wrap.
  Microsoft::WRL::ComPtr<ID3D11SamplerState> skySampler_;

  // A brick texture and the key its TextureID is matched by: the last path
  // segment, lowercased.
  struct TextureEntry {
    std::string name;
    Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> view;
  };
  std::vector<TextureEntry> textures_;

  // The HUD's own pipeline: a four-vertex strip built from the vertex id, a
  // rectangle of constants, alpha blending and no depth testing.
  Microsoft::WRL::ComPtr<ID3D11VertexShader> hudVertexShader_;
  Microsoft::WRL::ComPtr<ID3D11PixelShader> hudPixelShader_;
  Microsoft::WRL::ComPtr<ID3D11Buffer> hudBuffer_;
  Microsoft::WRL::ComPtr<ID3D11BlendState> hudBlend_;
  Microsoft::WRL::ComPtr<ID3D11DepthStencilState> hudDepth_;
  Microsoft::WRL::ComPtr<ID3D11SamplerState> hudSampler_;

  int width_ = 0;
  int height_ = 0;
  std::wstring lastError_;
  std::wstring headAssetError_;
};

}  // namespace fieldbrik
