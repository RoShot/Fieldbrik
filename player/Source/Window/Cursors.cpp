#include "Window/Cursors.h"

#include <wincodec.h>
#include <wrl/client.h>

#include <cstring>
#include <string>
#include <vector>

#include "Rendering/Resources.h"

using Microsoft::WRL::ComPtr;

namespace fieldbrik {
namespace {

bool DecodePng(const std::vector<unsigned char>& bytes, int& width, int& height,
               std::vector<unsigned char>& pixels) {
  if (bytes.empty()) return false;

  CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);

  ComPtr<IWICImagingFactory> factory;
  HRESULT hr = CoCreateInstance(CLSID_WICImagingFactory, nullptr,
                                CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&factory));
  if (FAILED(hr)) {
    return false;
  }

  ComPtr<IWICStream> stream;
  hr = factory->CreateStream(&stream);
  if (FAILED(hr)) {
    return false;
  }

  hr = stream->InitializeFromMemory(const_cast<BYTE*>(bytes.data()),
                                    static_cast<DWORD>(bytes.size()));
  if (FAILED(hr)) {
    return false;
  }

  ComPtr<IWICBitmapDecoder> decoder;
  hr = factory->CreateDecoderFromStream(stream.Get(), nullptr,
                                        WICDecodeMetadataCacheOnLoad, &decoder);
  if (FAILED(hr)) {
    return false;
  }

  ComPtr<IWICBitmapFrameDecode> frame;
  hr = decoder->GetFrame(0, &frame);
  if (FAILED(hr)) {
    return false;
  }

  ComPtr<IWICFormatConverter> converter;
  hr = factory->CreateFormatConverter(&converter);
  if (FAILED(hr)) {
    return false;
  }

  hr = converter->Initialize(frame.Get(), GUID_WICPixelFormat32bppBGRA,
                             WICBitmapDitherTypeNone, nullptr, 0.0,
                             WICBitmapPaletteTypeCustom);
  if (FAILED(hr)) {
    return false;
  }

  UINT decodedWidth = 0;
  UINT decodedHeight = 0;
  hr = converter->GetSize(&decodedWidth, &decodedHeight);
  if (FAILED(hr) || decodedWidth == 0 || decodedHeight == 0) {
    return false;
  }

  width = static_cast<int>(decodedWidth);
  height = static_cast<int>(decodedHeight);
  pixels.resize(static_cast<size_t>(width) * static_cast<size_t>(height) * 4);

  hr = converter->CopyPixels(nullptr, static_cast<UINT>(width * 4),
                             static_cast<UINT>(pixels.size()), pixels.data());
  if (FAILED(hr)) {
    return false;
  }

  return true;
}

void FindTip(const std::vector<unsigned char>& pixels, int width, int height,
             int& x, int& y) {
  int bestX = x;
  int bestY = y;
  int bestSum = width + height + 1;

  for (int row = 0; row < height; ++row) {
    for (int column = 0; column < width; ++column) {
      const size_t alpha =
          (static_cast<size_t>(row) * static_cast<size_t>(width) +
           static_cast<size_t>(column)) *
              4 +
          3;
      if (pixels[alpha] <= 16) continue;

      // Nearest the corner wins, which on a diagonally drawn arrow is the point.
      const int sum = column + row;
      if (sum < bestSum) {
        bestSum = sum;
        bestX = column;
        bestY = row;
      }
    }
  }

  x = bestX;
  y = bestY;
}

HCURSOR Build(const std::vector<unsigned char>& pixels, int width, int height,
              int hotX, int hotY) {
  const size_t stride = static_cast<size_t>(width) * 4;
  std::vector<unsigned char> flipped(pixels.size());
  for (int row = 0; row < height; ++row) {
    std::memcpy(flipped.data() + static_cast<size_t>(row) * stride,
                pixels.data() + static_cast<size_t>(height - 1 - row) * stride,
                stride);
  }

  BITMAPINFOHEADER header{};
  header.biSize = sizeof(header);
  header.biWidth = width;
  header.biHeight = height;
  header.biPlanes = 1;
  header.biBitCount = 32;
  header.biCompression = BI_RGB;

  HDC screen = GetDC(nullptr);
  void* bits = nullptr;
  HBITMAP colour =
      CreateDIBSection(screen, reinterpret_cast<BITMAPINFO*>(&header),
                       DIB_RGB_COLORS, &bits, nullptr, 0);
  ReleaseDC(nullptr, screen);

  if (!colour || !bits) {
    if (colour) DeleteObject(colour);
    return nullptr;
  }

  std::memcpy(bits, flipped.data(), flipped.size());

  const int maskStride = ((width + 15) / 16) * 2;
  std::vector<unsigned char> maskBits(
      static_cast<size_t>(maskStride) * static_cast<size_t>(height), 0);
  HBITMAP mask = CreateBitmap(width, height, 1, 1, maskBits.data());

  if (!mask) {
    DeleteObject(colour);
    return nullptr;
  }

  ICONINFO info{};
  info.fIcon = FALSE;
  info.xHotspot = hotX;
  info.yHotspot = hotY;
  info.hbmMask = mask;
  info.hbmColor = colour;

  HCURSOR cursor = CreateIconIndirect(&info);

  DeleteObject(mask);
  DeleteObject(colour);

  return cursor;
}

HCURSOR FromResource(int id, bool centre, bool& owned) {
  std::vector<unsigned char> bytes;
  std::wstring error;
  if (!ReadEmbedded(id, bytes, error)) {
    return nullptr;
  }

  int width = 0;
  int height = 0;
  std::vector<unsigned char> pixels;
  if (!DecodePng(bytes, width, height, pixels)) {
    return nullptr;
  }

  int hotX = width / 2;
  int hotY = height / 2;
  if (!centre) {
    hotX = 0;
    hotY = 0;
    FindTip(pixels, width, height, hotX, hotY);
  }

  HCURSOR cursor = Build(pixels, width, height, hotX, hotY);
  if (cursor) {
    owned = true;
  }
  return cursor;
}

}  // namespace

Cursors::~Cursors() {
  if (ownsArrow_ && arrow_) DestroyCursor(arrow_);
  if (ownsDrag_ && drag_) DestroyCursor(drag_);
  if (ownsResize_ && resize_) DestroyCursor(resize_);
}

void Cursors::Load() {
  arrow_ = FromResource(kArrowCursorResource, false, ownsArrow_);
  if (!arrow_) arrow_ = LoadCursorW(nullptr, IDC_ARROW);

  drag_ = FromResource(kDragCursorResource, false, ownsDrag_);
  if (!drag_) drag_ = LoadCursorW(nullptr, IDC_HAND);

  resize_ = FromResource(kResizeCursorResource, true, ownsResize_);
  if (!resize_) resize_ = LoadCursorW(nullptr, IDC_SIZENWSE);
}

HCURSOR Cursors::For(unsigned hitTest, bool dragging) const {
  switch (hitTest) {
    case HTLEFT:
    case HTRIGHT:
    case HTTOP:
    case HTBOTTOM:
    case HTTOPLEFT:
    case HTTOPRIGHT:
    case HTBOTTOMLEFT:
    case HTBOTTOMRIGHT:
      return resize_ ? resize_ : arrow_;
    default:
      break;
  }

  if (dragging && drag_) return drag_;
  return arrow_;
}

}  // namespace fieldbrik
