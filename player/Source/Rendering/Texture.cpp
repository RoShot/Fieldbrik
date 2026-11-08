#include "Rendering/Texture.h"

#include <windows.h>

#include <d3d11.h>
#include <wincodec.h>
#include <wrl/client.h>

#include <cstdint>
#include <vector>

using Microsoft::WRL::ComPtr;

namespace fieldbrik {
namespace {

// WIC is a COM API, so the thread that decodes has to be in an apartment. The
// client decodes once, at startup, on the same thread that creates the device;
// a static keeps that to one initialise and one uninitialise for the process.
struct ComApartment {
  ComApartment() { CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED); }
  ~ComApartment() { CoUninitialize(); }
};

void EnsureCom() { static ComApartment apartment; }

bool Fail(std::wstring& error, const wchar_t* text) {
  error = text;
  return false;
}

}  // namespace

bool CreateTextureFromPng(ID3D11Device* device, const void* bytes, std::size_t size,
                          ID3D11ShaderResourceView** view, std::wstring& error) {
  if (!device) return Fail(error, L"There is no device to upload the texture to.");
  if (!bytes || size == 0) return Fail(error, L"The texture was empty.");
  if (!view) return Fail(error, L"There was nowhere to put the texture.");

  EnsureCom();

  ComPtr<IWICImagingFactory> factory;
  if (FAILED(CoCreateInstance(CLSID_WICImagingFactory, nullptr, CLSCTX_INPROC_SERVER,
                              IID_PPV_ARGS(&factory)))) {
    return Fail(error, L"Windows Imaging Component could not be started.");
  }

  // InitializeFromMemory wants a writable pointer but only reads it, and the
  // bytes are a resource in the exe's own image, so casting away const is safe.
  ComPtr<IWICStream> stream;
  if (FAILED(factory->CreateStream(&stream)) ||
      FAILED(stream->InitializeFromMemory(
          static_cast<BYTE*>(const_cast<void*>(bytes)),
          static_cast<DWORD>(size)))) {
    return Fail(error, L"The texture could not be read from memory.");
  }

  ComPtr<IWICBitmapDecoder> decoder;
  if (FAILED(factory->CreateDecoderFromStream(stream.Get(), nullptr,
                                              WICDecodeMetadataCacheOnLoad,
                                              &decoder))) {
    return Fail(error, L"The texture is not an image this machine can decode.");
  }

  ComPtr<IWICBitmapFrameDecode> frame;
  if (FAILED(decoder->GetFrame(0, &frame))) {
    return Fail(error, L"The image had no frame to read.");
  }

  // Whatever the file is stored as, the texture wants 32-bit RGBA: the face
  // images rely on alpha, so a converted 24-bit copy would lose the cut-out.
  ComPtr<IWICFormatConverter> converter;
  if (FAILED(factory->CreateFormatConverter(&converter)) ||
      FAILED(converter->Initialize(frame.Get(), GUID_WICPixelFormat32bppRGBA,
                                   WICBitmapDitherTypeNone, nullptr, 0.0,
                                   WICBitmapPaletteTypeCustom))) {
    return Fail(error, L"The image could not be converted to RGBA.");
  }

  UINT width = 0;
  UINT height = 0;
  if (FAILED(converter->GetSize(&width, &height)) || width == 0 || height == 0) {
    return Fail(error, L"The image had no size.");
  }

  const UINT stride = width * 4;
  std::vector<unsigned char> pixels(static_cast<std::size_t>(stride) * height);
  if (FAILED(converter->CopyPixels(nullptr, stride,
                                   static_cast<UINT>(pixels.size()),
                                   pixels.data()))) {
    return Fail(error, L"The image's pixels could not be copied out.");
  }

  D3D11_TEXTURE2D_DESC description{};
  description.Width = width;
  description.Height = height;
  description.MipLevels = 1;
  description.ArraySize = 1;
  description.Format = DXGI_FORMAT_R8G8B8A8_UNORM;
  description.SampleDesc.Count = 1;
  description.SampleDesc.Quality = 0;
  description.Usage = D3D11_USAGE_DEFAULT;
  description.BindFlags = D3D11_BIND_SHADER_RESOURCE;

  D3D11_SUBRESOURCE_DATA data{};
  data.pSysMem = pixels.data();
  data.SysMemPitch = stride;

  ComPtr<ID3D11Texture2D> texture;
  if (FAILED(device->CreateTexture2D(&description, &data, &texture))) {
    return Fail(error, L"The texture could not be created on the GPU.");
  }

  D3D11_SHADER_RESOURCE_VIEW_DESC viewDescription{};
  viewDescription.Format = description.Format;
  viewDescription.ViewDimension = D3D11_SRV_DIMENSION_TEXTURE2D;
  viewDescription.Texture2D.MipLevels = 1;

  if (FAILED(device->CreateShaderResourceView(texture.Get(), &viewDescription,
                                              view))) {
    return Fail(error, L"The texture could not be bound for drawing.");
  }

  return true;
}

bool CreateWhiteTexture(ID3D11Device* device, ID3D11ShaderResourceView** view,
                        std::wstring& error) {
  if (!device || !view) return Fail(error, L"There is nowhere to put the texture.");

  const std::uint32_t white = 0xFFFFFFFFu;

  D3D11_TEXTURE2D_DESC description{};
  description.Width = 1;
  description.Height = 1;
  description.MipLevels = 1;
  description.ArraySize = 1;
  description.Format = DXGI_FORMAT_R8G8B8A8_UNORM;
  description.SampleDesc.Count = 1;
  description.Usage = D3D11_USAGE_IMMUTABLE;
  description.BindFlags = D3D11_BIND_SHADER_RESOURCE;

  D3D11_SUBRESOURCE_DATA data{};
  data.pSysMem = &white;
  data.SysMemPitch = sizeof(white);

  ComPtr<ID3D11Texture2D> texture;
  if (FAILED(device->CreateTexture2D(&description, &data, &texture))) {
    return Fail(error, L"The default texture could not be created.");
  }

  if (FAILED(device->CreateShaderResourceView(texture.Get(), nullptr, view))) {
    return Fail(error, L"The default texture could not be bound.");
  }

  return true;
}

}  // namespace fieldbrik
