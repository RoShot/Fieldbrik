#include "Rendering/Renderer.h"

#include <windows.h>

#include <d3d11.h>
#include <dxgi1_2.h>

namespace fieldbrik {
namespace {

// The oldest feature level we accept. Anything that runs Windows 10 has 11_0.
constexpr D3D_FEATURE_LEVEL kFeatureLevels[] = {D3D_FEATURE_LEVEL_11_0,
                                                D3D_FEATURE_LEVEL_10_1,
                                                D3D_FEATURE_LEVEL_10_0};

}  // namespace

Renderer::~Renderer() { Shutdown(); }

bool Renderer::Initialise(HWND handle, int width, int height) {
  width_ = width > 0 ? width : 1;
  height_ = height > 0 ? height : 1;

  // The swap chain has to be created by a factory, and the device has to be
  // made for the same adapter, so the factory comes first.
  Microsoft::WRL::ComPtr<IDXGIFactory1> factory;
  HRESULT result = CreateDXGIFactory1(IID_PPV_ARGS(&factory));
  if (FAILED(result)) {
    lastError_ = L"DXGI could not be started.";
    return false;
  }

  Microsoft::WRL::ComPtr<IDXGIAdapter> adapter;
  if (FAILED(factory->EnumAdapters(0, &adapter))) {
    lastError_ = L"No graphics adapter was found.";
    return false;
  }

  // BGRA is not requested because something needs it today; it is requested
  // because screenshot capture and Direct2D expect it later.
  UINT flags = D3D11_CREATE_DEVICE_BGRA_SUPPORT;

  result = D3D11CreateDevice(
      adapter.Get(), D3D_DRIVER_TYPE_UNKNOWN, nullptr, flags, kFeatureLevels,
      static_cast<UINT>(sizeof(kFeatureLevels) / sizeof(kFeatureLevels[0])),
      D3D11_SDK_VERSION, &device_, nullptr, &context_);

  if (FAILED(result)) {
    lastError_ =
        L"Direct3D 11 could not be started. The graphics driver may be too old.";
    return false;
  }

  DXGI_SWAP_CHAIN_DESC description{};
  description.BufferCount = 2;
  description.BufferDesc.Width = static_cast<UINT>(width_);
  description.BufferDesc.Height = static_cast<UINT>(height_);
  description.BufferDesc.Format = DXGI_FORMAT_R8G8B8A8_UNORM;
  description.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
  description.OutputWindow = handle;
  description.SampleDesc.Count = 1;
  description.SampleDesc.Quality = 0;
  description.Windowed = TRUE;
  description.SwapEffect = DXGI_SWAP_EFFECT_FLIP_DISCARD;

  result = factory->CreateSwapChain(device_.Get(), &description, &swapChain_);
  if (FAILED(result)) {
    lastError_ = L"The swap chain could not be created for this window.";
    return false;
  }

  // Alt+Enter would hand the window to Direct3D's own fullscreen path, which
  // fights the Win32 resize handling. Fullscreen becomes a client feature.
  Microsoft::WRL::ComPtr<IDXGIFactory> dxgiFactory;
  if (SUCCEEDED(swapChain_->GetParent(IID_PPV_ARGS(&dxgiFactory)))) {
    dxgiFactory->MakeWindowAssociation(handle, DXGI_MWA_NO_ALT_ENTER);
  }

  return CreateTargets();
}

bool Renderer::CreateTargets() {
  ReleaseTargets();

  Microsoft::WRL::ComPtr<ID3D11Texture2D> backBuffer;
  HRESULT result = swapChain_->GetBuffer(0, IID_PPV_ARGS(&backBuffer));
  if (FAILED(result)) {
    lastError_ = L"The back buffer could not be read.";
    return false;
  }

  result = device_->CreateRenderTargetView(backBuffer.Get(), nullptr,
                                           &targetView_);
  if (FAILED(result)) {
    lastError_ = L"A render target could not be made for the back buffer.";
    return false;
  }

  D3D11_VIEWPORT viewport{};
  viewport.TopLeftX = 0.0f;
  viewport.TopLeftY = 0.0f;
  viewport.Width = static_cast<float>(width_);
  viewport.Height = static_cast<float>(height_);
  viewport.MinDepth = 0.0f;
  viewport.MaxDepth = 1.0f;

  ID3D11RenderTargetView* targets[] = {targetView_.Get()};
  context_->OMSetRenderTargets(1, targets, nullptr);
  context_->RSSetViewports(1, &viewport);
  return true;
}

void Renderer::ReleaseTargets() {
  if (context_) context_->OMSetRenderTargets(0, nullptr, nullptr);
  targetView_.Reset();
}

void Renderer::Resize(int width, int height) {
  if (!swapChain_ || width <= 0 || height <= 0) return;
  if (width == width_ && height == height_) return;

  width_ = width;
  height_ = height;

  // Buffers cannot be resized while a view still points at one.
  ReleaseTargets();
  context_->Flush();

  const HRESULT result =
      swapChain_->ResizeBuffers(0, static_cast<UINT>(width_),
                                static_cast<UINT>(height_), DXGI_FORMAT_UNKNOWN, 0);

  if (FAILED(result)) {
    // A failed resize is not fatal: the next WM_SIZE usually succeeds, and the
    // old buffers stay valid until then.
    lastError_ = L"The window was resized but the buffers could not follow.";
    return;
  }

  CreateTargets();
}

void Renderer::BeginFrame(const float clearColour[4]) {
  if (!context_ || !targetView_) return;
  context_->ClearRenderTargetView(targetView_.Get(), clearColour);
}

void Renderer::EndFrame() {
  if (!swapChain_) return;
  // Present with vsync: the client idles at the display rate rather than
  // spinning a core flat.
  swapChain_->Present(1, 0);
}

void Renderer::WaitForGpu() {
  if (!context_) return;
  context_->Flush();
}

void Renderer::Shutdown() {
  ReleaseTargets();
  swapChain_.Reset();
  context_.Reset();
  device_.Reset();
}

}  // namespace fieldbrik
