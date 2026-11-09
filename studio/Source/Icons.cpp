#include "Icons.h"

#include <wincodec.h>
#include <wrl/client.h>

#include <algorithm>

using Microsoft::WRL::ComPtr;

namespace fieldbrik {
namespace {

// Everything the toolbar can draw. Keeping the list here rather than in the
// toolbar means a missing file is a silent gap, not a crash or a placeholder
// square pretending to be art.
const wchar_t* const kIconNames[] = {
    L"new",   L"open", L"save",     L"undo",   L"redo",
    L"select", L"move", L"scale",   L"rotate", L"part",
    L"sphere", L"cylinder", L"wedge", L"play",
};

}  // namespace

Icons::~Icons() { Release(); }

void Icons::Release() {
  for (auto& entry : icons_) {
    if (entry.second.bitmap) DeleteObject(entry.second.bitmap);
  }
  icons_.clear();
}

bool Icons::Load(const std::wstring& directory) {
  Release();

  ComPtr<IWICImagingFactory> factory;
  if (FAILED(CoCreateInstance(CLSID_WICImagingFactory, nullptr,
                              CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&factory)))) {
    return false;
  }

  int loaded = 0;
  for (const wchar_t* name : kIconNames) {
    const std::wstring path = directory + L"\\" + name + L".png";

    ComPtr<IWICBitmapDecoder> decoder;
    if (FAILED(factory->CreateDecoderFromFilename(
            path.c_str(), nullptr, GENERIC_READ, WICDecodeMetadataCacheOnDemand,
            &decoder))) {
      continue;
    }

    ComPtr<IWICBitmapFrameDecode> frame;
    if (FAILED(decoder->GetFrame(0, &frame))) continue;

    // Premultiplied BGRA, which is the layout AlphaBlend wants and lets the
    // toolbar draw the icons straight onto the grey strip.
    ComPtr<IWICFormatConverter> converter;
    if (FAILED(factory->CreateFormatConverter(&converter))) continue;
    if (FAILED(converter->Initialize(frame.Get(), GUID_WICPixelFormat32bppPBGRA,
                                     WICBitmapDitherTypeNone, nullptr, 0.0,
                                     WICBitmapPaletteTypeCustom))) {
      continue;
    }

    UINT width = 0;
    UINT height = 0;
    if (FAILED(converter->GetSize(&width, &height)) || width == 0 ||
        height == 0) {
      continue;
    }

    BITMAPINFO info{};
    info.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    info.bmiHeader.biWidth = static_cast<LONG>(width);
    info.bmiHeader.biHeight = -static_cast<LONG>(height);  // Top row first.
    info.bmiHeader.biPlanes = 1;
    info.bmiHeader.biBitCount = 32;
    info.bmiHeader.biCompression = BI_RGB;

    void* pixels = nullptr;
    HBITMAP bitmap =
        CreateDIBSection(nullptr, &info, DIB_RGB_COLORS, &pixels, nullptr, 0);
    if (!bitmap || !pixels) {
      if (bitmap) DeleteObject(bitmap);
      continue;
    }

    const UINT stride = width * 4;
    if (FAILED(converter->CopyPixels(nullptr, stride, stride * height,
                                     static_cast<BYTE*>(pixels)))) {
      DeleteObject(bitmap);
      continue;
    }

    Icon icon;
    icon.bitmap = bitmap;
    icon.width = static_cast<int>(width);
    icon.height = static_cast<int>(height);
    icons_[name] = icon;
    ++loaded;
  }

  return loaded > 0;
}

const Icon* Icons::Find(const std::wstring& name) const {
  const auto found = icons_.find(name);
  return found == icons_.end() ? nullptr : &found->second;
}

}  // namespace fieldbrik
