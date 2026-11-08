#include "Rendering/Texture.h"

#include <windows.h>

#include <d3d11.h>
#include <wincodec.h>
#include <wrl/client.h>

#include <cstdint>
#include <vector>

// Generated beside the build by CMake; the build folder is on the include path.
// It is included for kSkyFaceCount: how many faces a cube has is the table's
// business, not this file's.
#include "TextureTable.generated.h"

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

// An image as the GPU wants it: 32-bit RGBA, row by row, whatever the file
// happened to be stored as.
struct DecodedImage {
  UINT width = 0;
  UINT height = 0;
  std::vector<unsigned char> pixels;
};

bool DecodeImage(const void* bytes, std::size_t size, DecodedImage& image,
                 std::wstring& error) {
  if (!bytes || size == 0) return Fail(error, L"The texture was empty.");

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

  if (FAILED(converter->GetSize(&image.width, &image.height)) || image.width == 0 ||
      image.height == 0) {
    return Fail(error, L"The image had no size.");
  }

  const UINT stride = image.width * 4;
  image.pixels.resize(static_cast<std::size_t>(stride) * image.height);

  if (FAILED(converter->CopyPixels(nullptr, stride,
                                   static_cast<UINT>(image.pixels.size()),
                                   image.pixels.data()))) {
    return Fail(error, L"The image's pixels could not be copied out.");
  }

  return true;
}

}  // namespace

bool CreateTextureFromPng(ID3D11Device* device, const void* bytes, std::size_t size,
                          ID3D11ShaderResourceView** view, std::wstring& error) {
  if (!device) return Fail(error, L"There is no device to upload the texture to.");
  if (!view) return Fail(error, L"There was nowhere to put the texture.");

  DecodedImage image;
  if (!DecodeImage(bytes, size, image, error)) return false;

  D3D11_TEXTURE2D_DESC description{};
  description.Width = image.width;
  description.Height = image.height;
  description.MipLevels = 1;
  description.ArraySize = 1;
  description.Format = DXGI_FORMAT_R8G8B8A8_UNORM;
  description.SampleDesc.Count = 1;
  description.SampleDesc.Quality = 0;
  description.Usage = D3D11_USAGE_DEFAULT;
  description.BindFlags = D3D11_BIND_SHADER_RESOURCE;

  D3D11_SUBRESOURCE_DATA data{};
  data.pSysMem = image.pixels.data();
  data.SysMemPitch = image.width * 4;

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

bool CreateTextureCubeFromImages(ID3D11Device* device, const void* const* images,
                                 const std::size_t* sizes, int count,
                                 ID3D11ShaderResourceView** view,
                                 std::wstring& error) {
  if (!device) return Fail(error, L"There is no device to upload the sky to.");
  if (!view) return Fail(error, L"There was nowhere to put the sky.");
  if (!images || !sizes || count != kSkyFaceCount) {
    return Fail(error, L"The sky does not have six faces.");
  }

  // All six are decoded before anything is uploaded, so a bad face fails before
  // half a sky exists on the GPU.
  DecodedImage faces[kSkyFaceCount];
  for (int face = 0; face < kSkyFaceCount; ++face) {
    if (!DecodeImage(images[face], sizes[face], faces[face], error)) return false;

    if (faces[face].width != faces[face].height) {
      return Fail(error, L"A sky face is not square.");
    }
    if (faces[face].width != faces[0].width) {
      return Fail(error, L"The sky's faces are different sizes.");
    }
  }

  D3D11_TEXTURE2D_DESC description{};
  description.Width = faces[0].width;
  description.Height = faces[0].width;
  description.MipLevels = 1;
  description.ArraySize = static_cast<UINT>(kSkyFaceCount);
  description.Format = DXGI_FORMAT_R8G8B8A8_UNORM;
  description.SampleDesc.Count = 1;
  description.SampleDesc.Quality = 0;
  description.Usage = D3D11_USAGE_DEFAULT;
  description.BindFlags = D3D11_BIND_SHADER_RESOURCE;
  description.MiscFlags = D3D11_RESOURCE_MISC_TEXTURECUBE;

  D3D11_SUBRESOURCE_DATA data[kSkyFaceCount]{};
  for (int face = 0; face < kSkyFaceCount; ++face) {
    data[face].pSysMem = faces[face].pixels.data();
    data[face].SysMemPitch = faces[face].width * 4;
  }

  ComPtr<ID3D11Texture2D> texture;
  if (FAILED(device->CreateTexture2D(&description, data, &texture))) {
    return Fail(error, L"The sky could not be created on the GPU.");
  }

  D3D11_SHADER_RESOURCE_VIEW_DESC viewDescription{};
  viewDescription.Format = description.Format;
  viewDescription.ViewDimension = D3D11_SRV_DIMENSION_TEXTURECUBE;
  viewDescription.TextureCube.MipLevels = 1;

  if (FAILED(device->CreateShaderResourceView(texture.Get(), &viewDescription,
                                              view))) {
    return Fail(error, L"The sky could not be bound for drawing.");
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

bool CreateTextureFromBgra(ID3D11Device* device, int width, int height,
                           const void* pixels, ID3D11ShaderResourceView** view,
                           std::wstring& error) {
  if (!device || !pixels || !view || width <= 0 || height <= 0) {
    return Fail(error, L"The interface image was empty.");
  }

  D3D11_TEXTURE2D_DESC description{};
  description.Width = static_cast<UINT>(width);
  description.Height = static_cast<UINT>(height);
  description.MipLevels = 1;
  description.ArraySize = 1;
  description.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
  description.SampleDesc.Count = 1;
  description.Usage = D3D11_USAGE_DEFAULT;
  description.BindFlags = D3D11_BIND_SHADER_RESOURCE;

  D3D11_SUBRESOURCE_DATA data{};
  data.pSysMem = pixels;
  data.SysMemPitch = static_cast<UINT>(width) * 4;

  ComPtr<ID3D11Texture2D> texture;
  if (FAILED(device->CreateTexture2D(&description, &data, &texture))) {
    return Fail(error, L"An interface image could not be uploaded.");
  }

  if (FAILED(device->CreateShaderResourceView(texture.Get(), nullptr, view))) {
    return Fail(error, L"An interface image could not be bound.");
  }

  return true;
}

}  // namespace fieldbrik
