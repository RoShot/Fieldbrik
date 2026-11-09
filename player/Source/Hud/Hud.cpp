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
constexpr float kChatBarHeight = 22.0f;

// The backpack strip, sized to the 2008 bar: six slots, 74 by 55 pixels each.
constexpr float kSlotWidth = 74.0f;
constexpr float kSlotHeight = 55.0f;
constexpr int kSlots = 6;

// The vertical health meter on the right edge.
constexpr float kHealthWidth = 6.0f;
constexpr float kHealthHeight = 150.0f;

const XMFLOAT4 kPanel(0.10f, 0.12f, 0.16f, 0.78f);
const XMFLOAT4 kColumn(0.50f, 0.58f, 0.72f, 0.85f);
const XMFLOAT4 kRowText(0.92f, 0.94f, 0.97f, 1.0f);
const XMFLOAT4 kTopButton(0.62f, 0.64f, 0.67f, 0.96f);
const XMFLOAT4 kTopButtonHover(0.72f, 0.74f, 0.77f, 0.98f);
const XMFLOAT4 kTopButtonDown(0.55f, 0.57f, 0.60f, 0.98f);
const XMFLOAT4 kTopText(0.09f, 0.09f, 0.09f, 1.0f);
const XMFLOAT4 kWhite(1.0f, 1.0f, 1.0f, 1.0f);
const XMFLOAT4 kDim(0.0f, 0.0f, 0.0f, 0.55f);
const XMFLOAT4 kChatPanel(0.07f, 0.08f, 0.11f, 0.74f);
const XMFLOAT4 kChatBorder(0.36f, 0.39f, 0.46f, 0.90f);
const XMFLOAT4 kChatBorderActive(0.58f, 0.63f, 0.72f, 0.95f);
const XMFLOAT4 kChatHover(0.30f, 0.36f, 0.48f, 0.85f);
const XMFLOAT4 kChatPrompt(0.62f, 0.65f, 0.70f, 1.0f);
const XMFLOAT4 kHealthTrack(0.03f, 0.03f, 0.03f, 0.55f);
const XMFLOAT4 kHealthFill(0.20f, 0.72f, 0.16f, 1.0f);
const XMFLOAT4 kHealthLabel(0.10f, 0.18f, 0.55f, 1.0f);
const XMFLOAT4 kBackpack(0.72f, 0.72f, 0.72f, 0.98f);
const XMFLOAT4 kBackpackTop(0.83f, 0.83f, 0.83f, 0.98f);
const XMFLOAT4 kBackpackBottom(0.58f, 0.58f, 0.58f, 0.98f);
const XMFLOAT4 kSlotLine(0.46f, 0.46f, 0.46f, 1.0f);
const XMFLOAT4 kBackpackEdge(0.92f, 0.92f, 0.92f, 1.0f);
const XMFLOAT4 kBackpackEdgeDark(0.45f, 0.45f, 0.45f, 1.0f);

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
  if (!MakeLabel(L"Health", 12, true, health_)) return false;

  hotbarNumbers_.resize(kSlots);
  for (int slot = 0; slot < kSlots; ++slot) {
    const wchar_t number[2] = {static_cast<wchar_t>(L'1' + slot), L'\0'};
    if (!MakeLabel(number, 10, false, hotbarNumbers_[slot])) return false;
  }
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

void Hud::SetPlayerName(const std::wstring& name) {
  const std::wstring wanted = name.empty() ? L"You" : name;
  if (wanted == playerName_) return;

  playerName_ = wanted;

  Label label;
  if (MakeLabel(wanted.c_str(), 12, false, label)) you_ = label;
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

  // The backpack strip along the bottom left, cleared of the chat bar: six slots
  // of the 2008 size, not a row of small centred squares.
  const float hotbarWidth = kSlots * kSlotWidth;
  hotbar_ = {0.0f, height - kPad - kChatBarHeight - 4.0f - kSlotHeight,
             hotbarWidth, kSlotHeight};

  hotbarSlots_.clear();
  for (int slot = 0; slot < kSlots; ++slot) {
    hotbarSlots_.push_back(
        {hotbar_.x + slot * kSlotWidth, hotbar_.y, kSlotWidth, kSlotHeight});
  }

  // The health meter stands on the right edge, its label underneath.
  healthTrack_ = {width - 34.0f, height * 0.45f, kHealthWidth, kHealthHeight};
  healthFill_ = healthTrack_;

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
  return kTopButton;
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

  // The health meter: the dark track and the green bar, with the word under it.
  Add(sprites, healthTrack_, kHealthTrack, nullptr);
  Add(sprites, healthFill_, kHealthFill, nullptr);

  Rect healthText = {healthTrack_.x + (healthTrack_.width - health_.width) * 0.5f,
                     healthTrack_.y + healthTrack_.height + 2.0f, health_.width,
                     health_.height};
  AddLabel(sprites, health_, healthText, kHealthLabel);

  CollectBackpack(sprites);

  // The player list: a column header and one row, which is everyone in the place.
  Rect header = {leaderboard_.x, leaderboard_.y, leaderboard_.width,
                 kLeaderboardHeader};
  Add(sprites, leaderboard_, kPanel, nullptr);
  Add(sprites, header, kColumn, nullptr);
  AddCentred(sprites, players_, header, kWhite);

  Rect row = {leaderboard_.x + 8.0f, leaderboard_.y + kLeaderboardHeader + 4.0f,
              leaderboard_.width - 16.0f, kLeaderboardRow};
  AddLabel(sprites, you_, row, kRowText);

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
  Add(sprites, topFullscreen_, TopColour(Hit::Fullscreen), nullptr);
  AddCentred(sprites, fullscreen_, topFullscreen_, kTopText);
  Add(sprites, topHelp_, TopColour(Hit::Help), nullptr);
  AddCentred(sprites, helpButton_, topHelp_, kTopText);
  Add(sprites, topExit_, TopColour(Hit::Exit), nullptr);
  AddCentred(sprites, exit_, topExit_, kTopText);

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

  Add(sprites, helpCloseButton_, TopColour(Hit::HelpClose), nullptr);
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
  if (!MakeLabel(L"Click here or press /", 12, false, chatPrompt_)) return false;

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
  if (!RenderLabel(line, 12, false, pixels, width, height)) return false;
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
      if (BuildLineLabel(line.text, label)) {
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

  // The bar runs along the bottom left; the movement keys keep the right corner.
  const float barWidth = std::min(520.0f, width - kPad * 2.0f - 140.0f);
  chatBar_ = {kPad, height - kPad - kChatBarHeight, barWidth, kChatBarHeight};

  // The chat button sits just above the bar, not on the bottom edge.
  chatButton_ = {kPad, hotbar_.y - 6.0f - kChatHeight, kChatWidth, kChatHeight};

  // The log lives under the top strip, where the era put it.
  chatLog_ = {kPad, kTopButtonHeight + 6.0f, 330.0f, 108.0f};

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
  // The era's strip: one grey bar with a light top edge and a dark bottom one,
  // six slots joined by thin rules, a small white number in the bottom left.
  Add(sprites, hotbar_, kBackpack, nullptr);
  Add(sprites, {hotbar_.x, hotbar_.y, hotbar_.width, 1.0f}, kBackpackEdge,
      nullptr);
  Add(sprites, {hotbar_.x, hotbar_.y + 1.0f, hotbar_.width, 9.0f},
      kBackpackTop, nullptr);
  Add(sprites, {hotbar_.x, hotbar_.y + hotbar_.height - 10.0f, hotbar_.width,
                9.0f},
      kBackpackBottom, nullptr);
  Add(sprites, {hotbar_.x, hotbar_.y + hotbar_.height - 1.0f, hotbar_.width,
                1.0f},
      kBackpackEdgeDark, nullptr);

  for (size_t slot = 0; slot < hotbarSlots_.size(); ++slot) {
    const Rect& where = hotbarSlots_[slot];

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

  if (!lines.empty()) {
    Add(sprites, chatLog_, kChatPanel, nullptr);

    float y = chatLog_.y + 4.0f;
    for (size_t index = 0; index < lines.size() && index < chatLogLabels_.size();
         ++index) {
      const float alpha = Chat::LineAlpha(lines[index]);
      if (alpha > 0.0f) {
        Rect where = {chatLog_.x + 8.0f, y, chatLogLabels_[index].width,
                      chatLogLabels_[index].height};
        const XMFLOAT4 colour = {1.0f, 1.0f, 1.0f, alpha};
        AddLabel(sprites, chatLogLabels_[index], where, colour);
      }
      y += chatLogLabels_[index].height + 2.0f;
    }
  }

  // The bar itself, bright-edged while it has the keyboard.
  const bool active = chatModel_.Typing();
  Add(sprites, chatBar_, active ? kChatBorderActive : kChatBorder, nullptr);

  Rect inner = {chatBar_.x + 1.0f, chatBar_.y + 1.0f, chatBar_.width - 2.0f,
                chatBar_.height - 2.0f};
  Add(sprites, inner, kChatPanel, nullptr);

  if (chatTyped_.view && !chatTypedSource_.empty()) {
    Rect text = {chatBar_.x + 7.0f, chatBar_.y + 3.0f, chatTyped_.width,
                 chatTyped_.height};
    AddLabel(sprites, chatTyped_, text, kWhite);
  } else {
    Rect prompt = {chatBar_.x + 7.0f, chatBar_.y + 3.0f, chatPrompt_.width,
                   chatPrompt_.height};
    AddLabel(sprites, chatPrompt_, prompt, kChatPrompt);
  }

  if (active) {
    const float phase = chatBlink_ * 2.0f;
    if (phase - std::floor(phase) < 0.5f) {
      const float offset = chatTyped_.view ? chatTyped_.width : 0.0f;
      Rect caret = {chatBar_.x + 8.0f + offset, chatBar_.y + 4.0f, 1.0f,
                    chatBar_.height - 8.0f};
      Add(sprites, caret, kWhite, nullptr);
    }
  }

  if (!chatModel_.Open()) return;

  Add(sprites, quickPanel_, kChatPanel, nullptr);

  Rect title = {quickPanel_.x + 8.0f, quickPanel_.y + 4.0f, chatTitle_.width,
                chatTitle_.height};
  AddLabel(sprites, chatTitle_, title, kWhite);

  const std::vector<Chat::Phrase>& phrases = Chat::Phrases();
  for (size_t row = 0; row < quickRows_.size(); ++row) {
    const size_t index = static_cast<size_t>(chatModel_.ScrollOffset()) + row;
    if (index >= phrases.size()) break;

    const Rect& where = quickRows_[row];
    if (where.Contains(cursorX_, cursorY_)) {
      Add(sprites, where, kChatHover, nullptr);
    }

    const Label& label = chatPhrases_[index];
    Rect text = {where.x + 4.0f, where.y + (where.height - label.height) * 0.5f,
                 label.width, label.height};
    AddLabel(sprites, label, text, kRowText);
  }
}

}  // namespace fieldbrik
