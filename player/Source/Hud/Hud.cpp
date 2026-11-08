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
constexpr float kTopButtonHeight = 22.0f;
constexpr float kLeaderboardWidth = 180.0f;
constexpr float kLeaderboardHeader = 20.0f;
constexpr float kLeaderboardRow = 18.0f;
constexpr int kLeaderboardRows = 3;

const XMFLOAT4 kPanel(0.10f, 0.12f, 0.16f, 0.78f);
const XMFLOAT4 kColumn(0.50f, 0.58f, 0.72f, 0.85f);
const XMFLOAT4 kRowText(0.92f, 0.94f, 0.97f, 1.0f);
const XMFLOAT4 kTopButton(0.62f, 0.64f, 0.67f, 0.96f);
const XMFLOAT4 kTopText(0.09f, 0.09f, 0.09f, 1.0f);
const XMFLOAT4 kWhite(1.0f, 1.0f, 1.0f, 1.0f);
const XMFLOAT4 kDim(0.0f, 0.0f, 0.0f, 0.55f);

// Draws a label into an image with GDI, in the era's font. GDI antialiases into
// the colour channels with no alpha, so the red channel becomes the alpha and the
// colour becomes white: the quad's own colour then tints it.
bool RenderLabel(const std::wstring& text, int pointSize, bool bold,
                 std::vector<unsigned char>& pixels, int& width, int& height) {
  HDC screen = CreateCompatibleDC(nullptr);
  if (!screen) return false;

  LOGFONTW description{};
  description.lfHeight = -pointSize;
  description.lfWeight = bold ? FW_BOLD : FW_NORMAL;
  description.lfQuality = ANTIALIASED_QUALITY;
  lstrcpynW(description.lfFaceName, L"Arial", LF_FACESIZE);

  HFONT face = CreateFontIndirectW(&description);
  HGDIOBJ previousFont = SelectObject(screen, face);

  SIZE extent{};
  GetTextExtentPoint32W(screen, text.c_str(), static_cast<int>(text.size()),
                        &extent);

  width = std::max(1, static_cast<int>(extent.cx) + 4);
  height = std::max(1, static_cast<int>(extent.cy) + 4);

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
    TextOutW(screen, 2, 2, text.c_str(), static_cast<int>(text.size()));

    auto* source = static_cast<unsigned char*>(bits);
    pixels.assign(source, source + static_cast<size_t>(width) * height * 4);
    for (size_t index = 0; index < pixels.size(); index += 4) {
      pixels[index + 0] = 255;
      pixels[index + 1] = 255;
      pixels[index + 2] = 255;
      pixels[index + 3] = source[index];
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
  };

  for (const Entry& entry : entries) {
    if (!LoadTexture(entry.id, *entry.view)) return false;
  }
  return true;
}

bool Hud::MakeLabel(const wchar_t* text, int pointSize, bool bold,
                    Label& label) {
  std::vector<unsigned char> pixels;
  int width = 0;
  int height = 0;
  if (!RenderLabel(text, pointSize, bold, pixels, width, height)) return false;

  if (!renderer_->CreateHudTextureFromBgra(width, height, pixels.data(),
                                           label.view.GetAddressOf())) {
    return false;
  }

  label.width = static_cast<float>(width);
  label.height = static_cast<float>(height);
  return true;
}

bool Hud::MakeLabels() {
  if (!MakeLabel(L"Fullscreen", 12, false, fullscreen_)) return false;
  if (!MakeLabel(L"Help...", 12, false, helpButton_)) return false;
  if (!MakeLabel(L"Exit", 12, false, exit_)) return false;
  if (!MakeLabel(L"Players", 12, true, players_)) return false;
  if (!MakeLabel(L"You", 12, false, you_)) return false;
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

  // Top left: the three buttons the 2007 client put along the top edge.
  const float fullscreenWidth = fullscreen_.width + 16.0f;
  const float helpWidth = helpButton_.width + 16.0f;
  const float exitWidth = exit_.width + 16.0f;

  topFullscreen_ = {0.0f, 0.0f, fullscreenWidth, kTopButtonHeight};
  topHelp_ = {fullscreenWidth, 0.0f, helpWidth, kTopButtonHeight};
  topExit_ = {fullscreenWidth + helpWidth, 0.0f, exitWidth, kTopButtonHeight};

  // Top right: the player list, which the camera buttons sit underneath.
  leaderboard_ = {width - kPad - kLeaderboardWidth, 8.0f, kLeaderboardWidth,
                  kLeaderboardHeader + kLeaderboardRow * kLeaderboardRows + 6.0f};

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
  const float clusterY = height - kPad - clusterHeight;

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

Hud::Action Hud::Update(const Input& input) {
  if (!input.LeftPressed()) return Action::None;

  POINT cursor = input.CursorPosition();
  if (window_) ScreenToClient(window_, &cursor);

  const float x = static_cast<float>(cursor.x);
  const float y = static_cast<float>(cursor.y);

  // While the help screen is up it is the only thing that can be clicked.
  if (helpOpen_) {
    if (helpCloseButton_.Contains(x, y)) helpOpen_ = false;
    return Action::None;
  }

  if (topFullscreen_.Contains(x, y)) return Action::Fullscreen;
  if (topHelp_.Contains(x, y)) {
    helpOpen_ = true;
    return Action::None;
  }
  if (topExit_.Contains(x, y)) return Action::Exit;

  if (zoomInButton_.Contains(x, y)) return Action::ZoomIn;
  if (zoomOutButton_.Contains(x, y)) return Action::ZoomOut;
  if (tiltButton_.Contains(x, y)) return Action::TiltUp;

  // Chat and Report are laid out where they belong but have nothing behind them
  // yet: there is no chat and nobody to report.
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

  // The player list: a column header and one row, which is everyone in the place.
  Rect header = {leaderboard_.x, leaderboard_.y, leaderboard_.width,
                 kLeaderboardHeader};
  Add(sprites, leaderboard_, kPanel, nullptr);
  Add(sprites, header, kColumn, nullptr);
  AddCentred(sprites, players_, header, kWhite);

  Rect row = {leaderboard_.x + 8.0f, leaderboard_.y + kLeaderboardHeader + 4.0f,
              leaderboard_.width - 16.0f, kLeaderboardRow};
  AddLabel(sprites, you_, row, kRowText);

  // The camera buttons, then the report button under them.
  Add(sprites, tiltButton_, kWhite, tiltUp_.Get());
  Add(sprites, zoomInButton_, kWhite, zoomIn_.Get());
  Add(sprites, zoomOutButton_, kWhite, zoomOut_.Get());
  Add(sprites, reportButton_, kWhite, report_.Get());

  // The keys, showing pressed art while they are actually held.
  Add(sprites, wasdW_, kWhite,
      (GetAsyncKeyState('W') & 0x8000) ? keyWDown_.Get() : keyW_.Get());
  Add(sprites, wasdA_, kWhite,
      (GetAsyncKeyState('A') & 0x8000) ? keyADown_.Get() : keyA_.Get());
  Add(sprites, wasdS_, kWhite,
      (GetAsyncKeyState('S') & 0x8000) ? keySDown_.Get() : keyS_.Get());
  Add(sprites, wasdD_, kWhite,
      (GetAsyncKeyState('D') & 0x8000) ? keyDDown_.Get() : keyD_.Get());

  Add(sprites, chatButton_, kWhite, chat_.Get());

  // The top left strip.
  Add(sprites, topFullscreen_, kTopButton, nullptr);
  AddCentred(sprites, fullscreen_, topFullscreen_, kTopText);
  Add(sprites, topHelp_, kTopButton, nullptr);
  AddCentred(sprites, helpButton_, topHelp_, kTopText);
  Add(sprites, topExit_, kTopButton, nullptr);
  AddCentred(sprites, exit_, topExit_, kTopText);

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

  Add(sprites, helpCloseButton_, kTopButton, nullptr);
  AddCentred(sprites, helpClose_, helpCloseButton_, kTopText);
}

}  // namespace fieldbrik
