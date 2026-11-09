#include "Hud/Hud.h"

#include <windows.h>

#include <algorithm>
#include <cmath>
#include <cstring>
#include <string>
#include <vector>

#include "Input/Input.h"
#include "Rendering/Resources.h"

using namespace DirectX;


namespace fieldbrik {
namespace {

// The era's measurements, in pixels at any window size: the interface did not
// scale with the window, it sat in the corners.
constexpr float kPad = 12.0f;
constexpr float kKey = 32.0f;
constexpr float kKeyGap = 2.0f;
constexpr float kChatWidth = 32.0f;
constexpr float kChatHeight = 23.0f;
constexpr float kCameraButton = 24.0f;
constexpr float kReport = 48.0f;
constexpr float kTopButtonHeight = 36.0f;
constexpr float kLeaderboardWidth = 210.0f;
constexpr float kLeaderboardHeader = 34.0f;
constexpr float kLeaderboardRow = 20.0f;
constexpr int kLeaderboardRows = 1;
constexpr float kChatBarHeight = 22.0f;
constexpr float kBottomStrip = 22.0f;
constexpr float kSlotWidth = 72.0f;
constexpr float kSlotHeight = 55.0f;

// The era's palette: flat, opaque greys and hard edges. 2008's interface was
// solid rectangles with one-pixel borders, not translucent modern panels, so
// there is no soft shadow or rounded shell anywhere in these colours.
const XMFLOAT4 kPanel(0.13f, 0.13f, 0.13f, 0.96f);
const XMFLOAT4 kRowText(0.92f, 0.94f, 0.97f, 1.0f);
const XMFLOAT4 kTopStrip(0.80f, 0.80f, 0.80f, 1.0f);
const XMFLOAT4 kTopStripTop(0.90f, 0.90f, 0.90f, 1.0f);
const XMFLOAT4 kTopStripBottom(0.62f, 0.62f, 0.62f, 1.0f);
const XMFLOAT4 kTopButton(0.75f, 0.75f, 0.75f, 1.0f);
const XMFLOAT4 kTopButtonHover(0.90f, 0.90f, 0.90f, 1.0f);
const XMFLOAT4 kTopButtonDown(0.68f, 0.68f, 0.68f, 1.0f);
const XMFLOAT4 kTopText(0.07f, 0.07f, 0.07f, 1.0f);
const XMFLOAT4 kWhite(1.0f, 1.0f, 1.0f, 1.0f);
const XMFLOAT4 kDim(0.0f, 0.0f, 0.0f, 0.55f);
const XMFLOAT4 kQuickPanel(0.16f, 0.16f, 0.16f, 0.97f);
const XMFLOAT4 kQuickBorder(0.62f, 0.62f, 0.62f, 1.0f);
const XMFLOAT4 kQuickHover(0.20f, 0.32f, 0.55f, 1.0f);
const XMFLOAT4 kChatPrompt(1.0f, 1.0f, 1.0f, 1.0f);
const XMFLOAT4 kPlayerName(0.42f, 0.34f, 0.62f, 1.0f);
const XMFLOAT4 kEditText(0.55f, 0.55f, 0.55f, 1.0f);
const XMFLOAT4 kHamburger(0.84f, 0.84f, 0.84f, 1.0f);
const XMFLOAT4 kHamburgerLine(0.30f, 0.30f, 0.30f, 1.0f);
const XMFLOAT4 kTopStripBand(0.86f, 0.86f, 0.86f, 1.0f);

// The backpack strip along the bottom, as the era drew it: a flat dark bar with
// six square slots and a number under each one.
const XMFLOAT4 kBackpack(0.72f, 0.72f, 0.72f, 0.98f);
const XMFLOAT4 kBackpackTop(0.83f, 0.83f, 0.83f, 0.98f);
const XMFLOAT4 kBackpackBottom(0.58f, 0.58f, 0.58f, 0.98f);
const XMFLOAT4 kSlotLine(0.46f, 0.46f, 0.46f, 1.0f);
const XMFLOAT4 kBottomStripFill(0.55f, 0.55f, 0.55f, 0.94f);
const XMFLOAT4 kBottomStripEdge(0.78f, 0.78f, 0.78f, 1.0f);
const XMFLOAT4 kHealthTrack(0.03f, 0.03f, 0.03f, 0.55f);
const XMFLOAT4 kHealthFill(0.20f, 0.72f, 0.16f, 1.0f);
const XMFLOAT4 kHealthLabel(0.10f, 0.18f, 0.55f, 1.0f);

// Draws a label into an image with GDI, in the era's font.
//
// 2008's text was a hard-edged bitmap face with a one-pixel black edge, not the
// antialiased text a modern toolkit produces. lfQuality is NONANTIALIASED so the
// glyph is a crisp mask, and that mask is grown by a pixel on the CPU to bake the
// outline in: white inside the glyph, black for the ring around it, transparent
// beyond. GDI writes no alpha, so the mask is read from the red channel.
//
// Drawn with a white tint this is white text with a black edge; any other tint
// recolours the glyph and leaves the edge black, which is what makes it read as
// the era's outlined text.
bool RenderLabel(const std::wstring& text, int pointSize, bool bold,
                 TextStyle style, std::vector<unsigned char>& pixels,
                 int& width, int& height) {
  HDC screen = CreateCompatibleDC(nullptr);
  if (!screen) return false;

  LOGFONTW description{};
  description.lfHeight = -pointSize;
  description.lfWeight = bold ? FW_BOLD : FW_NORMAL;
  description.lfQuality = NONANTIALIASED_QUALITY;
  lstrcpynW(description.lfFaceName, L"Arial", LF_FACESIZE);

  HFONT face = CreateFontIndirectW(&description);
  HGDIOBJ previousFont = SelectObject(screen, face);

  SIZE extent{};
  GetTextExtentPoint32W(screen, text.c_str(), static_cast<int>(text.size()),
                        &extent);

  // Three spare pixels a side, so the one-pixel outline always has room.
  width = std::max(1, static_cast<int>(extent.cx) + 6);
  height = std::max(1, static_cast<int>(extent.cy) + 6);

  BITMAPINFO info{};
  info.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
  info.bmiHeader.biWidth = width;
  info.bmiHeader.biHeight = -height;  // top-down
  info.bmiHeader.biPlanes = 1;
  info.bmiHeader.biBitCount = 32;
  info.bmiHeader.biCompression = BI_RGB;

  void* bits = nullptr;
  HBITMAP bitmap =
      CreateDIBSection(screen, &info, DIB_RGB_COLORS, &bits, nullptr, 0);

  bool drawn = false;
  if (bitmap && bits) {
    HGDIOBJ previousBitmap = SelectObject(screen, bitmap);
    std::memset(bits, 0, static_cast<size_t>(width) * height * 4);

    SetBkMode(screen, TRANSPARENT);
    SetTextColor(screen, RGB(255, 255, 255));
    TextOutW(screen, 3, 3, text.c_str(), static_cast<int>(text.size()));

    const unsigned char* source = static_cast<const unsigned char*>(bits);
    const size_t count = static_cast<size_t>(width) * height;

    std::vector<unsigned char> mask(count, 0);
    for (size_t index = 0; index < count; ++index) {
      mask[index] = source[index * 4 + 0];
    }

    pixels.assign(count * 4, 0);

    // The glyph itself is laid down first in every style: a crisp white mask
    // that the HUD shader tints.
    for (size_t index = 0; index < count; ++index) {
      if (mask[index] == 0) continue;
      pixels[index * 4 + 0] = 255;
      pixels[index * 4 + 1] = 255;
      pixels[index * 4 + 2] = 255;
      pixels[index * 4 + 3] = 255;
    }

    if (style == TextStyle::Outline) {
      // A one-pixel black ring, for text that lies on the world and has to stay
      // readable over grass, brick and sky.
      for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
          const size_t index = static_cast<size_t>(y) * width + x;
          if (mask[index] > 0) continue;

          bool ring = false;
          for (int oy = -1; oy <= 1 && !ring; ++oy) {
            for (int ox = -1; ox <= 1; ++ox) {
              const int nx = x + ox;
              const int ny = y + oy;
              if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
              if (mask[static_cast<size_t>(ny) * width + nx] > 0) {
                ring = true;
                break;
              }
            }
          }

          if (ring) {
            pixels[index * 4 + 3] = 255;  // black outline, opaque
          }
        }
      }
    } else if (style == TextStyle::Shadow) {
      // The player list's soft edge: two offset copies behind the glyph, a tight
      // dark one and a wider faint one, which is what the era's labels read as
      // rather than a hard outline.
      struct Offset {
        int x;
        int y;
        unsigned char alpha;
      };
      const Offset offsets[] = {{1, 1, 150}, {2, 2, 55}};

      for (const Offset& offset : offsets) {
        for (int y = 0; y < height; ++y) {
          for (int x = 0; x < width; ++x) {
            const size_t maskIndex = static_cast<size_t>(y) * width + x;
            if (mask[maskIndex] == 0) continue;

            const int tx = x + offset.x;
            const int ty = y + offset.y;
            if (tx < 0 || ty < 0 || tx >= width || ty >= height) continue;

            unsigned char* target =
                &pixels[(static_cast<size_t>(ty) * width + tx) * 4];
            if (target[3] != 0) continue;  // never paint over the glyph
            target[0] = 0;
            target[1] = 0;
            target[2] = 0;
            target[3] = offset.alpha;
          }
        }
      }
    }

    SelectObject(screen, previousBitmap);
    drawn = true;
  }

  if (bitmap) DeleteObject(bitmap);
  SelectObject(screen, previousFont);
  DeleteObject(face);
  DeleteDC(screen);
  return drawn;
}

}  // namespace

bool Hud::LoadTexture(int resourceId,
                      Microsoft::WRL::ComPtr<ID3D11ShaderResourceView>& view) {
  if (!renderer_) return false;
  return renderer_->LoadHudTexture(resourceId, view.GetAddressOf());
}

bool Hud::LoadKeyArt() {
  struct Entry {
    int id;
    Microsoft::WRL::ComPtr<ID3D11ShaderResourceView>* view;
  };

  const Entry entries[] = {
      {kHudKeyWResource, &keyW_},         {kHudKeyWDownResource, &keyWDown_},
      {kHudKeyAResource, &keyA_},         {kHudKeyADownResource, &keyADown_},
      {kHudKeySResource, &keyS_},         {kHudKeySDownResource, &keySDown_},
      {kHudKeyDResource, &keyD_},         {kHudKeyDDownResource, &keyDDown_},
      {kHudChatResource, &chat_},         {kHudZoomInResource, &zoomIn_},
      {kHudZoomOutResource, &zoomOut_},   {kHudTiltResource, &tiltUp_},
      {kHudReportResource, &report_},
      {kHudChatHoverResource, &chatHover_},
      {kHudChatDownResource, &chatDown_},
      {kHudZoomInHoverResource, &zoomInHover_},
      {kHudZoomInDownResource, &zoomInDown_},
      {kHudZoomOutHoverResource, &zoomOutHover_},
      {kHudZoomOutDownResource, &zoomOutDown_},
      {kHudTiltDownResource, &tiltDown_},
      {kHudReportDownResource, &reportDown_},
  };

  for (const Entry& entry : entries) {
    if (!LoadTexture(entry.id, *entry.view)) return false;
  }
  return true;
}

bool Hud::MakeLabel(const wchar_t* text, int pointSize, bool bold, Label& label,
                    TextStyle style) {
  std::vector<unsigned char> pixels;
  int width = 0;
  int height = 0;
  if (!RenderLabel(text, pointSize, bold, style, pixels, width, height)) {
    return false;
  }

  if (!renderer_->CreateHudTextureFromBgra(width, height, pixels.data(),
                                           label.view.GetAddressOf())) {
    return false;
  }

  label.width = static_cast<float>(width);
  label.height = static_cast<float>(height);
  return true;
}

bool Hud::MakeLabels() {
  if (!MakeLabel(L"Fullscreen", 14, false, fullscreen_, TextStyle::Plain)) {
    return false;
  }
  if (!MakeLabel(L"Help...", 14, false, helpButton_, TextStyle::Plain)) {
    return false;
  }
  if (!MakeLabel(L"Exit", 14, false, exit_, TextStyle::Plain)) return false;
  if (!MakeLabel(L"Tools", 14, false, tools_, TextStyle::Plain)) return false;
  if (!MakeLabel(L"Edit", 14, false, edit_, TextStyle::Plain)) return false;
  if (!MakeLabel(L"Health", 12, true, health_)) return false;

  hotbarNumbers_.resize(6);
  for (int slot = 0; slot < 6; ++slot) {
    const wchar_t number[2] = {static_cast<wchar_t>(L'1' + slot), L'\0'};
    if (!MakeLabel(number, 11, false, hotbarNumbers_[slot],
                   TextStyle::Shadow)) {
      return false;
    }
  }

  if (!MakeLabel(L"Players", 28, false, players_, TextStyle::Shadow)) {
    return false;
  }
  if (!MakeLabel(L"You", 15, false, you_, TextStyle::Shadow)) return false;
  if (!MakeLabel(L"Help", 16, true, helpTitle_)) return false;
  if (!MakeLabel(L"Close", 12, false, helpClose_)) return false;

  const wchar_t* lines[] = {
      L"Move - W A S D",
      L"Jump - Space",
      L"Look - hold the left mouse button and drag",
      L"Zoom - the mouse wheel, or the camera buttons",
      L"Report abuse - the Report button on the right",
      L"Close this - Escape, or the Close button",
  };

  helpLines_.resize(std::size(lines));
  for (size_t index = 0; index < std::size(lines); ++index) {
    if (!MakeLabel(lines[index], 12, false, helpLines_[index])) return false;
  }
  return true;
}

bool Hud::Load(Renderer& renderer, HWND window) {
  renderer_ = &renderer;
  window_ = window;

  if (!LoadKeyArt()) {
    return false;
  }
  if (!MakeLabels()) {
    return false;
  }
  if (!MakeChatLabels()) {
    return false;
  }

  Layout();
  return true;
}

void Hud::Resize(int width, int height) {
  width_ = std::max(1, width);
  height_ = std::max(1, height);
  Layout();
}

void Hud::Layout() {
  const float width = static_cast<float>(width_);
  const float height = static_cast<float>(height_);

  // Top left: one grey strip along the top edge, carrying the three buttons the
  // 2008 client put there and the Tools and Edit switches after them. Each
  // button is as wide as its text plus a little breathing room, so the strip is
  // only as long as it needs to be rather than a row of equal blocks.
  // The menu square sits alone in the very corner, then the world shows through
  // before the strip starts: that gap is what the 2008 client had, and it is why
  // the strip does not begin at the window edge.
  hamburger_ = {0.0f, 0.0f, 56.0f, 56.0f};

  constexpr float widths[] = {84.0f, 84.0f, 84.0f, 60.0f, 50.0f};

  float stripWidth = 0.0f;
  for (const float w : widths) stripWidth += w;

  const float stripX = std::round(width * 0.1429f);
  topStrip_ = {stripX, 0.0f, stripWidth, kTopButtonHeight};

  float topX = stripX;
  topFullscreen_ = {topX, 0.0f, widths[0], kTopButtonHeight};
  topX += widths[0];
  topHelp_ = {topX, 0.0f, widths[1], kTopButtonHeight};
  topX += widths[1];
  topExit_ = {topX, 0.0f, widths[2], kTopButtonHeight};
  topX += widths[2];
  topTools_ = {topX, 0.0f, widths[3], kTopButtonHeight};
  topX += widths[3];
  topEdit_ = {topX, 0.0f, widths[4], kTopButtonHeight};

  // The backpack strip: six slots along the bottom left, sitting straight on the
  // bottom bar the way the era drew it, rather than centred and floating.
  constexpr int kSlots = 6;
  const float hotbarWidth = kSlots * kSlotWidth;
  hotbar_ = {0.0f, height - kBottomStrip - kSlotHeight, hotbarWidth,
             kSlotHeight};

  hotbarSlots_.clear();
  for (int slot = 0; slot < kSlots; ++slot) {
    hotbarSlots_.push_back(
        {hotbar_.x + slot * kSlotWidth, hotbar_.y, kSlotWidth, kSlotHeight});
  }

  // The health meter stands on the right edge, its label underneath it.
  constexpr float kHealthWidth = 6.0f;
  constexpr float kHealthHeight = 150.0f;
  healthTrack_ = {width - 34.0f, height * 0.45f, kHealthWidth, kHealthHeight};
  healthFill_ = healthTrack_;

  // Top right: the player list, which the camera buttons sit underneath.
  leaderboard_ = {width - 28.0f - kLeaderboardWidth, 34.0f, kLeaderboardWidth,
                  kLeaderboardHeader + kLeaderboardRow * kLeaderboardRows + 2.0f};

  const float cameraTop = leaderboard_.y + leaderboard_.height + 8.0f;
  const float cameraRight = width - kPad - kCameraButton * 2.0f - kKeyGap;

  tiltButton_ = {cameraRight, cameraTop, kCameraButton, kCameraButton};
  zoomInButton_ = {cameraRight + kCameraButton + kKeyGap, cameraTop, kCameraButton,
                   kCameraButton};
  zoomOutButton_ = {cameraRight + kCameraButton + kKeyGap,
                    cameraTop + kCameraButton + kKeyGap, kCameraButton,
                    kCameraButton};

  reportButton_ = {width - kPad - kReport,
                   cameraTop + kCameraButton * 2.0f + kKeyGap + 8.0f, kReport,
                   kReport};

  // Lower right: W above A S D, which is how the keyboard looks.
  const float clusterWidth = kKey * 3.0f + kKeyGap * 2.0f;
  const float clusterHeight = kKey * 2.0f + kKeyGap;
  const float clusterX = width - kPad - clusterWidth;
  const float clusterY = height - kBottomStrip - 8.0f - clusterHeight;

  wasdW_ = {clusterX + kKey + kKeyGap, clusterY, kKey, kKey};
  wasdA_ = {clusterX, clusterY + kKey + kKeyGap, kKey, kKey};
  wasdS_ = {clusterX + kKey + kKeyGap, clusterY + kKey + kKeyGap, kKey, kKey};
  wasdD_ = {clusterX + (kKey + kKeyGap) * 2.0f, clusterY + kKey + kKeyGap, kKey,
            kKey};

  // Lower left: the chat button, raised off the bottom edge.
  chatButton_ = {kPad, height - kPad - kChatHeight - 36.0f, kChatWidth,
                 kChatHeight};

  // The help screen: a panel in the middle, with everything else dimmed.
  const float panelWidth = std::min(460.0f, width - 40.0f);
  const float panelHeight = std::min(310.0f, height - 40.0f);

  helpPanel_ = {(width - panelWidth) * 0.5f, (height - panelHeight) * 0.5f,
                panelWidth, panelHeight};
  helpCloseButton_ = {helpPanel_.x + panelWidth - helpClose_.width - 32.0f,
                      helpPanel_.y + panelHeight - 34.0f,
                      helpClose_.width + 20.0f, 24.0f};

  LayoutChat();
}

void Hud::Add(std::vector<Renderer::HudSprite>& sprites, const Rect& rect,
              const XMFLOAT4& colour, ID3D11ShaderResourceView* texture) {
  Renderer::HudSprite sprite;
  sprite.x = rect.x;
  sprite.y = rect.y;
  sprite.width = rect.width;
  sprite.height = rect.height;
  sprite.colour = colour;
  sprite.texture = texture;
  sprites.push_back(sprite);
}

void Hud::AddLabel(std::vector<Renderer::HudSprite>& sprites,
                   const Label& label, const Rect& rect,
                   const XMFLOAT4& colour) {
  if (!label.view) return;

  Renderer::HudSprite sprite;
  sprite.x = rect.x;
  sprite.y = rect.y;
  sprite.width = label.width;
  sprite.height = label.height;
  sprite.colour = colour;
  sprite.texture = label.view.Get();
  sprites.push_back(sprite);
}

void Hud::AddCentred(std::vector<Renderer::HudSprite>& sprites,
                     const Label& label, const Rect& box,
                     const XMFLOAT4& colour) {
  if (!label.view) return;

  Rect placed;
  placed.x = box.x + (box.width - label.width) * 0.5f;
  placed.y = box.y + (box.height - label.height) * 0.5f;
  placed.width = label.width;
  placed.height = label.height;
  AddLabel(sprites, label, placed, colour);
}

Hud::Hit Hud::HitTest(float x, float y) const {
  if (helpOpen_) {
    if (helpCloseButton_.Contains(x, y)) return Hit::HelpClose;
    if (helpPanel_.Contains(x, y)) return Hit::HelpPanel;
    return Hit::None;
  }

  if (topFullscreen_.Contains(x, y)) return Hit::Fullscreen;
  if (topHelp_.Contains(x, y)) return Hit::Help;
  if (topExit_.Contains(x, y)) return Hit::Exit;
  if (topTools_.Contains(x, y)) return Hit::Tools;
  // Edit is drawn greyed out and is deliberately not a hit: it is a placeholder.

  if (zoomInButton_.Contains(x, y)) return Hit::ZoomIn;
  if (zoomOutButton_.Contains(x, y)) return Hit::ZoomOut;
  if (tiltButton_.Contains(x, y)) return Hit::Tilt;
  if (reportButton_.Contains(x, y)) return Hit::Report;
  if (chatBar_.Contains(x, y)) return Hit::ChatBar;
  if (chatModel_.Open() && quickPanel_.Contains(x, y)) return Hit::QuickPanel;
  if (chatButton_.Contains(x, y)) return Hit::Chat;

  return Hit::None;
}

ID3D11ShaderResourceView* Hud::Art(ID3D11ShaderResourceView* base,
                                   ID3D11ShaderResourceView* hover,
                                   ID3D11ShaderResourceView* down,
                                   Hit hit) const {
  if (hit != Hit::None && pressed_ == hit) return down ? down : base;
  if (hit != Hit::None && hover_ == hit) return hover ? hover : base;
  return base;
}

XMFLOAT4 Hud::TopColour(Hit hit) const {
  if (pressed_ == hit) return kTopButtonDown;
  if (hover_ == hit) return kTopButtonHover;
  return {1.0f, 1.0f, 1.0f, 0.0f};
}

Hud::Action Hud::Update(const Input& input) {
  POINT cursor = input.CursorPosition();
  if (window_) ScreenToClient(window_, &cursor);

  const float x = static_cast<float>(cursor.x);
  const float y = static_cast<float>(cursor.y);

  // The pointer is followed every frame, not only when it clicks: the art answers
  // the cursor, and the camera needs to know when the interface has the mouse.
  cursorX_ = x;
  cursorY_ = y;
  hover_ = HitTest(x, y);
  if (!input.LeftButton()) {
    pressed_ = Hit::None;
    swallowDrag_ = false;
  }

  // The bar has the keyboard while it is open: Enter sends, Backspace edits.
  // The letter keys never reach the player while this is true.
  if (chatModel_.Typing()) {
    if (input.KeyPressed(VK_RETURN)) {
      chatModel_.Submit();
      return Action::None;
    }
    if (input.KeyPressed(VK_BACK)) chatModel_.Backspace();
    if (!input.LeftPressed()) return Action::None;
  } else if (!input.LeftPressed()) {
    return Action::None;
  }

  pressed_ = hover_;
  swallowDrag_ = helpOpen_ || hover_ != Hit::None;

  // The quick chat menu takes the click while it is open, and a click that
  // misses it puts it away.
  if (chatModel_.Open()) {
    const std::vector<Chat::Phrase>& phrases = Chat::Phrases();
    if (hover_ == Hit::QuickPanel) {
      for (size_t row = 0; row < quickRows_.size(); ++row) {
        const size_t index = static_cast<size_t>(chatModel_.ScrollOffset()) + row;
        if (index < phrases.size() && quickRows_[row].Contains(x, y)) {
          chatModel_.Add(L"You", phrases[index].text);
          chatModel_.Close();
          return Action::None;
        }
      }
      return Action::None;
    }
    chatModel_.Close();
  }

  if (hover_ == Hit::Chat) {
    chatModel_.Toggle();
    return Action::None;
  }

  if (hover_ == Hit::ChatBar) {
    chatModel_.BeginTyping();
    return Action::None;
  }

  // While the help screen is up it is the only thing that can be clicked: the
  // Close button dismisses it, the panel itself swallows the click, and a click
  // anywhere else leaves the screen as well.
  if (helpOpen_) {
    if (hover_ == Hit::HelpClose || hover_ == Hit::None) helpOpen_ = false;
    return Action::None;
  }

  switch (hover_) {
    case Hit::Fullscreen:
      return Action::Fullscreen;
    case Hit::Help:
      helpOpen_ = true;
      return Action::None;
    case Hit::Exit:
      return Action::Exit;
    case Hit::Tools:
      hotbarVisible_ = !hotbarVisible_;
      return Action::None;
    case Hit::ZoomIn:
      return Action::ZoomIn;
    case Hit::ZoomOut:
      return Action::ZoomOut;
    case Hit::Tilt:
      return Action::TiltUp;
    case Hit::Chat:
    case Hit::Report:
    case Hit::None:
    case Hit::HelpPanel:
    case Hit::HelpClose:
      return Action::None;
  }

  return Action::None;
}

bool Hud::CloseHelp() {
  if (!helpOpen_) return false;
  helpOpen_ = false;
  return true;
}

void Hud::Collect(std::vector<Renderer::HudSprite>& sprites) const {
  sprites.clear();
  if (!renderer_) return;

  // The health meter: a dark track with the era's bright green filling it, and
  // the word under it in the old blue. Full for now; damage is not in yet.
  Add(sprites, healthTrack_, kHealthTrack, nullptr);
  Add(sprites, healthFill_, kHealthFill, nullptr);
  Rect healthText = {healthTrack_.x + (healthTrack_.width - health_.width) * 0.5f,
                     healthTrack_.y + healthTrack_.height + 2.0f, health_.width,
                     health_.height};
  AddLabel(sprites, health_, healthText, kHealthLabel);

  CollectBackpack(sprites);

  // The player list the way the 2008 client drew it: the word "Players" and the
  // name under it straight on the world, with no panel behind them and no column
  // strip. The name is the era's muted purple, not a modern accent colour.
  const float headerX =
      leaderboard_.x + leaderboard_.width - players_.width;
  Rect header = {headerX, leaderboard_.y, players_.width, kLeaderboardHeader};
  AddLabel(sprites, players_, header, kWhite);

  Rect row = {headerX, leaderboard_.y + 30.0f, you_.width, kLeaderboardRow};
  AddLabel(sprites, you_, row, kPlayerName);

  // The camera buttons, then the report button under them, each in the art
  // for its state: at rest, under the pointer, or pressed.
  Add(sprites, tiltButton_, kWhite,
      Art(tiltUp_.Get(), nullptr, tiltDown_.Get(), Hit::Tilt));
  Add(sprites, zoomInButton_, kWhite,
      Art(zoomIn_.Get(), zoomInHover_.Get(), zoomInDown_.Get(), Hit::ZoomIn));
  Add(sprites, zoomOutButton_, kWhite,
      Art(zoomOut_.Get(), zoomOutHover_.Get(), zoomOutDown_.Get(),
          Hit::ZoomOut));
  Add(sprites, reportButton_, kWhite,
      Art(report_.Get(), nullptr, reportDown_.Get(), Hit::Report));

  // The keys, showing pressed art while they are actually held.
  Add(sprites, wasdW_, kWhite,
      (GetAsyncKeyState('W') & 0x8000) ? keyWDown_.Get() : keyW_.Get());
  Add(sprites, wasdA_, kWhite,
      (GetAsyncKeyState('A') & 0x8000) ? keyADown_.Get() : keyA_.Get());
  Add(sprites, wasdS_, kWhite,
      (GetAsyncKeyState('S') & 0x8000) ? keySDown_.Get() : keyS_.Get());
  Add(sprites, wasdD_, kWhite,
      (GetAsyncKeyState('D') & 0x8000) ? keyDDown_.Get() : keyD_.Get());

  Add(sprites, chatButton_, kWhite,
      Art(chat_.Get(), chatHover_.Get(), chatDown_.Get(), Hit::Chat));

  // The top left strip. These have no art of their own, so they answer the
  // pointer with the colour of the strip.
  // The menu square: a light box with three dark rules in it. There is no menu
  // behind it, so it is drawn but not a hit target.
  Add(sprites, hamburger_, kHamburger, nullptr);
  Add(sprites, {hamburger_.x, hamburger_.y + hamburger_.height - 1.0f,
                hamburger_.width, 1.0f},
      kTopStripBottom, nullptr);
  Add(sprites, {hamburger_.x + hamburger_.width - 1.0f, hamburger_.y, 1.0f,
                hamburger_.height},
      kTopStripBottom, nullptr);
  for (int line = 0; line < 3; ++line) {
    Add(sprites, {hamburger_.x + 12.0f, hamburger_.y + 17.0f + line * 8.0f,
                  32.0f, 4.0f},
        kHamburgerLine, nullptr);
  }

  // The strip is drawn once and the buttons only tint the part of it they own
  // while they are hovered or held, so at rest the chrome reads as one band.
  Add(sprites, topStrip_, kTopStrip, nullptr);
  Add(sprites, {topStrip_.x, topStrip_.y, topStrip_.width, 1.0f}, kTopStripTop,
      nullptr);
  Add(sprites, {topStrip_.x, topStrip_.y + 1.0f, topStrip_.width, 9.0f},
      kTopStripBand, nullptr);
  Add(sprites, {topStrip_.x, topStrip_.y + topStrip_.height - 8.0f,
                topStrip_.width, 7.0f},
      kTopStripBottom, nullptr);
  Add(sprites, {topStrip_.x, topStrip_.y + topStrip_.height - 1.0f,
                topStrip_.width, 1.0f},
      kTopStripBottom, nullptr);

  Add(sprites, topFullscreen_, TopColour(Hit::Fullscreen), nullptr);
  Add(sprites, topHelp_, TopColour(Hit::Help), nullptr);
  Add(sprites, topExit_, TopColour(Hit::Exit), nullptr);
  Add(sprites, topTools_, TopColour(Hit::Tools), nullptr);

  // Left-aligned in its button with a small pad, not centred: the era set these
  // labels against the left edge of the strip.
  const auto topLabel = [&sprites](const Label& label, const Rect& box,
                                   const XMFLOAT4& colour) {
    if (!label.view) return;
    Rect placed{box.x + 8.0f, box.y + (box.height - label.height) * 0.5f,
                label.width, label.height};
    Hud::AddLabel(sprites, label, placed, colour);
  };

  topLabel(fullscreen_, topFullscreen_, kTopText);
  topLabel(helpButton_, topHelp_, kTopText);
  topLabel(exit_, topExit_, kTopText);
  topLabel(tools_, topTools_, kTopText);
  topLabel(edit_, topEdit_, kEditText);

  CollectChat(sprites);

  if (!helpOpen_) return;

  // The help screen dims the client and sits over it.
  Rect whole = {0.0f, 0.0f, static_cast<float>(width_),
                static_cast<float>(height_)};
  Add(sprites, whole, kDim, nullptr);
  Add(sprites, helpPanel_, kPanel, nullptr);

  Rect title = {helpPanel_.x + 16.0f, helpPanel_.y + 12.0f,
                helpPanel_.width - 32.0f, 24.0f};
  AddLabel(sprites, helpTitle_, title, kWhite);

  float lineY = helpPanel_.y + 48.0f;
  for (const Label& label : helpLines_) {
    Rect line = {helpPanel_.x + 20.0f, lineY, label.width, label.height};
    AddLabel(sprites, label, line, kRowText);
    lineY += label.height + 10.0f;
  }

  Add(sprites, helpCloseButton_,
      hover_ == Hit::HelpClose ? kTopButtonHover : kTopButton, nullptr);
  AddCentred(sprites, helpClose_, helpCloseButton_, kTopText);
}


void Hud::Tick(float seconds) {
  chatModel_.Tick(seconds);
  chatBlink_ += seconds;
  RefreshChatLabels();
}

bool Hud::HandleEscape() {
  if (chatModel_.Typing()) {
    chatModel_.CancelTyping();
    return true;
  }
  if (helpOpen_) {
    helpOpen_ = false;
    return true;
  }
  if (chatModel_.Open()) {
    chatModel_.Close();
    return true;
  }
  return false;
}

bool Hud::MakeChatLabels() {
  if (!MakeLabel(L"Quick chat", 12, true, chatTitle_)) return false;
  if (!MakeLabel(L"To chat click here or press \"/\" key", 12, false,
                 chatPrompt_, TextStyle::Shadow)) {
    return false;
  }

  const std::vector<Chat::Phrase>& phrases = Chat::Phrases();
  chatPhrases_.resize(phrases.size());
  for (size_t index = 0; index < phrases.size(); ++index) {
    if (!MakeLabel(phrases[index].text, 12, false, chatPhrases_[index])) {
      return false;
    }
  }
  return true;
}

bool Hud::BuildLineLabel(const std::wstring& text, Label& label) {
  // A line that would run past the panel is cut rather than left to overflow.
  constexpr size_t kMaxCharacters = 52;
  std::wstring line = text;
  if (line.size() > kMaxCharacters) {
    line = line.substr(0, kMaxCharacters - 3) + L"...";
  }

  std::vector<unsigned char> pixels;
  int width = 0;
  int height = 0;
  if (!RenderLabel(line, 12, false, TextStyle::Outline, pixels, width, height)) {
    return false;
  }
  if (!renderer_->CreateHudTextureFromBgra(width, height, pixels.data(),
                                           label.view.GetAddressOf())) {
    return false;
  }

  label.width = static_cast<float>(width);
  label.height = static_cast<float>(height);
  return true;
}

void Hud::RefreshChatLabels() {
  const std::vector<Chat::Line>& lines = chatModel_.Lines();

  bool stale = lines.size() != chatLogKeys_.size();
  if (!stale) {
    for (size_t index = 0; index < lines.size(); ++index) {
      if (chatLogKeys_[index] != lines[index].text) {
        stale = true;
        break;
      }
    }
  }

  if (stale) {
    chatLogLabels_.clear();
    chatLogKeys_.clear();
    for (const Chat::Line& line : lines) {
      Label label;
      if (BuildLineLabel(line.who + L": " + line.text, label)) {
        chatLogLabels_.push_back(label);
        chatLogKeys_.push_back(line.text);
      }
    }
  }

  if (chatModel_.Buffer() != chatTypedSource_) {
    chatTypedSource_ = chatModel_.Buffer();
    chatTyped_ = Label();
    if (!chatTypedSource_.empty()) {
      Label label;
      if (BuildLineLabel(chatTypedSource_, label)) chatTyped_ = label;
    }
  }
}

void Hud::LayoutChat() {
  const float width = static_cast<float>(width_);
  const float height = static_cast<float>(height_);

  // The prompt sits on the bottom edge with no bar around it, the way the 2008
  // client put it. Its rectangle is only the click target for starting a
  // message.
  const float barWidth = std::min(330.0f, width - kPad * 2.0f - 140.0f);
  chatBar_ = {5.0f, height - 20.0f, barWidth, 18.0f};

  // The chat button sits above the backpack strip, which now owns the bottom
  // centre, so the icon never lands on a slot.
  chatButton_ = {kPad, hotbar_.y - 6.0f - kChatHeight, kChatWidth, kChatHeight};

  // The log is plain text under the top strip, with no panel around it.
  chatLog_ = {kPad, kTopButtonHeight + 10.0f, 460.0f, 8 * 15.0f};

  // The quick chat panel opens upwards out of the chat button.
  constexpr float kRowHeight = 18.0f;
  const float room = chatButton_.y - 44.0f;
  const int rows = std::min(18, std::max(4, static_cast<int>(room / kRowHeight)));
  const float panelHeight = rows * kRowHeight + 28.0f;

  quickPanel_ = {kPad, chatButton_.y - 8.0f - panelHeight, 306.0f, panelHeight};

  quickRows_.clear();
  for (int row = 0; row < rows; ++row) {
    quickRows_.push_back({quickPanel_.x + 6.0f,
                          quickPanel_.y + 24.0f + row * kRowHeight,
                          quickPanel_.width - 12.0f, kRowHeight});
  }
}

void Hud::CollectBackpack(std::vector<Renderer::HudSprite>& sprites) const {
  if (!hotbarVisible_) return;

  // The backpack as the era drew it: one light grey strip with a light top edge
  // and a dark bottom one, vertical rules between the six slots, and a small
  // white number in the bottom left of each. No gaps, no dark modern panel.
  Add(sprites, hotbar_, kBackpack, nullptr);
  Add(sprites, {hotbar_.x, hotbar_.y, hotbar_.width, 1.0f}, kTopStripTop,
      nullptr);
  Add(sprites, {hotbar_.x, hotbar_.y + 1.0f, hotbar_.width, 9.0f},
      kBackpackTop, nullptr);
  Add(sprites, {hotbar_.x, hotbar_.y + hotbar_.height - 10.0f, hotbar_.width,
                9.0f},
      kBackpackBottom, nullptr);
  Add(sprites, {hotbar_.x, hotbar_.y + hotbar_.height - 1.0f, hotbar_.width,
                1.0f},
      kTopStripBottom, nullptr);

  for (size_t slot = 0; slot < hotbarSlots_.size(); ++slot) {
    const Rect& where = hotbarSlots_[slot];

    // One rule between neighbours; the strip's own ends close the outside.
    if (slot > 0) {
      Add(sprites, {where.x, where.y + 1.0f, 1.0f, where.height - 2.0f},
          kSlotLine, nullptr);
    }

    if (slot < hotbarNumbers_.size()) {
      const Label& number = hotbarNumbers_[slot];
      Rect text = {where.x + 4.0f,
                   where.y + where.height - number.height - 2.0f,
                   number.width, number.height};
      AddLabel(sprites, number, text, kWhite);
    }
  }
}

void Hud::CollectChat(std::vector<Renderer::HudSprite>& sprites) const {
  const std::vector<Chat::Line>& lines = chatModel_.Lines();

  // The bottom bar: a grey strip the full width of the window, the prompt sitting
  // on it. The backpack strip stands directly on top of it, so the two read as
  // one piece of chrome the way they did in 2008.
  Add(sprites, {0.0f, static_cast<float>(height_) - kBottomStrip,
                static_cast<float>(width_), kBottomStrip},
      kBottomStripFill, nullptr);
  Add(sprites, {0.0f, static_cast<float>(height_) - kBottomStrip,
                static_cast<float>(width_), 1.0f},
      kBottomStripEdge, nullptr);

  // The era's log was outlined text lying on the world: no panel, no shadow, no
  // rounded shell. Lines sit on the tab strip's own line height and the log
  // simply disappears when there is nothing to say.
  float y = chatLog_.y;
  for (size_t index = 0; index < lines.size() && index < chatLogLabels_.size();
       ++index) {
    const float alpha = Chat::LineAlpha(lines[index]);
    if (alpha > 0.0f) {
      Rect where = {chatLog_.x, y, chatLogLabels_[index].width,
                    chatLogLabels_[index].height};
      const XMFLOAT4 colour = {1.0f, 1.0f, 1.0f, alpha};
      AddLabel(sprites, chatLogLabels_[index], where, colour);
    }
    y += chatLogLabels_[index].height - 4.0f;
  }

  // The prompt sits straight on the world with nothing behind it, and while a
  // message is being typed the prompt gives way to the message and a caret.
  if (!chatModel_.Typing()) {
    Rect prompt = {chatBar_.x, chatBar_.y, chatPrompt_.width,
                   chatPrompt_.height};
    AddLabel(sprites, chatPrompt_, prompt, kChatPrompt);
  } else {
    if (chatTyped_.view && !chatTypedSource_.empty()) {
      Rect text = {chatBar_.x, chatBar_.y, chatTyped_.width,
                   chatTyped_.height};
      AddLabel(sprites, chatTyped_, text, kWhite);
    }

    const float phase = chatBlink_ * 2.0f;
    if (phase - std::floor(phase) < 0.5f) {
      const float offset = chatTyped_.view ? chatTyped_.width : 0.0f;
      Rect caret = {chatBar_.x + offset, chatBar_.y, 2.0f, 14.0f};
      Add(sprites, caret, kWhite, nullptr);
    }
  }

  if (!chatModel_.Open()) return;

  // The quick chat list is the one place a panel belongs: a square, opaque grey
  // box with a one-pixel light border, like a 2008 menu.
  Add(sprites, quickPanel_, kQuickPanel, nullptr);
  Add(sprites, {quickPanel_.x, quickPanel_.y, quickPanel_.width, 1.0f},
      kQuickBorder, nullptr);
  Add(sprites, {quickPanel_.x, quickPanel_.y + quickPanel_.height - 1.0f,
                quickPanel_.width, 1.0f},
      kQuickBorder, nullptr);
  Add(sprites, {quickPanel_.x, quickPanel_.y, 1.0f, quickPanel_.height},
      kQuickBorder, nullptr);
  Add(sprites, {quickPanel_.x + quickPanel_.width - 1.0f, quickPanel_.y, 1.0f,
                quickPanel_.height},
      kQuickBorder, nullptr);

  Rect title = {quickPanel_.x + 8.0f, quickPanel_.y + 4.0f, chatTitle_.width,
                chatTitle_.height};
  AddLabel(sprites, chatTitle_, title, kWhite);

  const std::vector<Chat::Phrase>& phrases = Chat::Phrases();
  for (size_t row = 0; row < quickRows_.size(); ++row) {
    const size_t index = static_cast<size_t>(chatModel_.ScrollOffset()) + row;
    if (index >= phrases.size()) break;

    const Rect& where = quickRows_[row];
    if (where.Contains(cursorX_, cursorY_)) {
      Add(sprites, where, kQuickHover, nullptr);
    }

    const Label& label = chatPhrases_[index];
    Rect text = {where.x + 4.0f, where.y + (where.height - label.height) * 0.5f,
                 label.width, label.height};
    AddLabel(sprites, label, text, kRowText);
  }
}

}  // namespace fieldbrik
