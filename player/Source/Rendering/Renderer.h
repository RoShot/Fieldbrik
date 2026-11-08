// The renderer: a Direct3D 11 device, one swap chain, one back buffer.
//
// Milestone 1 only clears the screen. The pieces that matter later are already
// here: the device survives a resize, the back buffer is recreated rather than
// the device, and there is a WaitForGpu before anything is released so closing
// the client cannot leave the driver with work in flight.

#pragma once

#include <windows.h>

#include <d3d11.h>
#include <dxgi1_2.h>
#include <wrl/client.h>

#include <string>

namespace fieldbrik {

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
  void EndFrame();

  void WaitForGpu();
  void Shutdown();

  const std::wstring& LastError() const { return lastError_; }

 private:
  bool CreateTargets();
  void ReleaseTargets();

  Microsoft::WRL::ComPtr<ID3D11Device> device_;
  Microsoft::WRL::ComPtr<ID3D11DeviceContext> context_;
  Microsoft::WRL::ComPtr<IDXGISwapChain> swapChain_;
  Microsoft::WRL::ComPtr<ID3D11RenderTargetView> targetView_;

  int width_ = 0;
  int height_ = 0;
  std::wstring lastError_;
};

}  // namespace fieldbrik
