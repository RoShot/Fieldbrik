// The renderer: a Direct3D 11 device, one swap chain, one depth buffer, and the
// shaders that draw bricks.
//
// The device survives a resize; the back buffer views, the depth buffer and the
// viewport are rebuilt. Every part is drawn as the same unit cube scaled and
// moved by its own matrix, which is why a brick can be any size without having
// its own geometry.

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
class World;

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
  void DrawWorld(const World& world, const Camera& camera);
  void EndFrame();

  void WaitForGpu();
  void Shutdown();

  const std::wstring& LastError() const { return lastError_; }

 private:
  bool CreatePipeline();
  bool CreateTargets();
  void ReleaseTargets();

  // Binds a render target for whichever texture is buffer 0 right now. A
  // flip-model swap chain rotates its buffers on Present, so this cannot be
  // cached once at startup.
  bool BindBackBuffer();

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

  // One view per back buffer texture. With two buffers this is two entries, and
  // it saves recreating a view every frame while still following the rotation.
  struct BackBufferView {
    Microsoft::WRL::ComPtr<ID3D11Texture2D> texture;
    Microsoft::WRL::ComPtr<ID3D11RenderTargetView> view;
  };
  std::vector<BackBufferView> backBufferViews_;

  Mesh cube_;

  int width_ = 0;
  int height_ = 0;
  std::wstring lastError_;
};

}  // namespace fieldbrik
