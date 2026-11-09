// The era's in-game HUD.
//
// Everything here is where it was in a 2008 client: the movement keys in the lower
// right corner, the chat button in the lower left raised off the bottom edge, the
// camera buttons just under the player list, the report button under those, and
// Fullscreen / Help / Exit across the top left corner.
//
// The key and camera art is the era's own, out of content/textures/ui. There were
// no Fullscreen, Help or Exit images in the drop, so those three buttons and every
// label are drawn by GDI in the era's font (Arial) into images at startup, then
// drawn as ordinary HUD quads. That keeps the interface sharp at any window size
// without shipping a font file.

#pragma once

#include <windows.h>

#include <d3d11.h>
#include <wrl/client.h>

#include <string>
#include <vector>

#include "Chat/Chat.h"
#include "Rendering/Renderer.h"

namespace fieldbrik {

class Input;

// How a label's glyph is edged. 2008 did not outline every piece of text: the
// player list had a soft shadow, the top strip was plain dark type on grey, and
// only the small world-facing labels carried a hard black edge.
enum class TextStyle { Outline, Shadow, Plain };

class Hud {
 public:
  // What a click asked the client to do. The HUD never does any of it itself: the
  // application owns the camera, the window and the process.
  enum class Action { None, Fullscreen, Exit, ZoomIn, ZoomOut, TiltUp };

  bool Load(Renderer& renderer, HWND window);

  // The HUD is laid out in pixels, so a resize only moves the pieces.
  void Resize(int width, int height);

  // One action per frame at most; later clicks wait for the next frame.
  Action Update(const Input& input);

  // Escape closes the help screen before it closes the client.
  bool CloseHelp();

  bool HelpOpen() const { return helpOpen_; }

  // True while the pointer is over a part of the interface that takes clicks.
  // The camera stays still then, so pressing a button does not drag the view.
  bool PointerOverInterface() const { return hover_ != Hit::None; }

  // True while the press the interface handled is still held. That press
  // belongs to the button, so it must not turn into a camera drag on the
  // frames that follow, once the help screen has gone.
  bool SwallowingDrag() const { return swallowDrag_; }

  void Collect(std::vector<Renderer::HudSprite>& sprites) const;

  // Ages the chat log and its caret.
  void Tick(float seconds);

  // Characters typed this frame, from the window's message queue.
  void TypeText(const std::wstring& characters) { chatModel_.Type(characters); }

  bool ChatTyping() const { return chatModel_.Typing(); }
  bool QuickChatOpen() const { return chatModel_.Open(); }
  void BeginChat() { chatModel_.BeginTyping(); }
  void ScrollQuickChat(int rows) { chatModel_.Scroll(rows); }

  // Escape closes the chat or the help screen before it closes the game.
  bool HandleEscape();

 private:
  // What the pointer is over. The movement keys are a picture of the keyboard
  // rather than buttons, so they are deliberately not here.
  enum class Hit {
    None,
    Fullscreen,
    Help,
    Exit,
    ZoomIn,
    ZoomOut,
    Tilt,
    Report,
    Chat,
    Tools,
    HelpPanel,
    HelpClose,
    ChatBar,
    QuickPanel
  };

  struct Rect {
    float x = 0.0f;
    float y = 0.0f;
    float width = 0.0f;
    float height = 0.0f;

    bool Contains(float px, float py) const {
      return px >= x && py >= y && px < x + width && py < y + height;
    }
  };

  // A label already rendered to an image: its size is what centres it.
  struct Label {
    Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> view;
    float width = 0.0f;
    float height = 0.0f;
  };

  bool LoadKeyArt();
  bool MakeLabels();
  bool LoadTexture(int resourceId,
                   Microsoft::WRL::ComPtr<ID3D11ShaderResourceView>& view);
  bool MakeLabel(const wchar_t* text, int pointSize, bool bold, Label& label,
                 TextStyle style = TextStyle::Outline);

  void Layout();
  void LayoutChat();

  bool MakeChatLabels();
  bool BuildLineLabel(const std::wstring& text, Label& label);
  void RefreshChatLabels();
  void CollectChat(std::vector<Renderer::HudSprite>& sprites) const;
  void CollectBackpack(std::vector<Renderer::HudSprite>& sprites) const;

  Hit HitTest(float x, float y) const;

  // Picks the art for a button: pressed, hovered, or at rest.
  ID3D11ShaderResourceView* Art(ID3D11ShaderResourceView* base,
                                ID3D11ShaderResourceView* hover,
                                ID3D11ShaderResourceView* down,
                                Hit hit) const;

  // The top buttons are drawn, so they answer the pointer with a colour.
  DirectX::XMFLOAT4 TopColour(Hit hit) const;

  static void Add(std::vector<Renderer::HudSprite>& sprites, const Rect& rect,
                  const DirectX::XMFLOAT4& colour,
                  ID3D11ShaderResourceView* texture);
  static void AddLabel(std::vector<Renderer::HudSprite>& sprites,
                       const Label& label, const Rect& rect,
                       const DirectX::XMFLOAT4& colour);
  static void AddCentred(std::vector<Renderer::HudSprite>& sprites,
                         const Label& label, const Rect& box,
                         const DirectX::XMFLOAT4& colour);

  Renderer* renderer_ = nullptr;
  HWND window_ = nullptr;

  int width_ = 1024;
  int height_ = 768;
  bool helpOpen_ = false;
  Hit hover_ = Hit::None;
  Hit pressed_ = Hit::None;
  bool swallowDrag_ = false;

  Chat chatModel_;
  Label chatTitle_;
  Label chatPrompt_;
  std::vector<Label> chatPhrases_;
  std::vector<Label> chatLogLabels_;
  std::vector<std::wstring> chatLogKeys_;
  Label chatTyped_;
  std::wstring chatTypedSource_;
  float chatBlink_ = 0.0f;
  float cursorX_ = 0.0f;
  float cursorY_ = 0.0f;
  Rect chatBar_;
  Rect chatLog_;
  Rect quickPanel_;
  std::vector<Rect> quickRows_;

  // The era's key art, up and pressed, and the buttons that had art of their own.
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> keyW_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> keyWDown_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> keyA_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> keyADown_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> keyS_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> keySDown_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> keyD_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> keyDDown_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> chat_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> zoomIn_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> zoomOut_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> tiltUp_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> report_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> chatHover_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> chatDown_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> zoomInHover_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> zoomInDown_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> zoomOutHover_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> zoomOutDown_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> tiltDown_;
  Microsoft::WRL::ComPtr<ID3D11ShaderResourceView> reportDown_;

  Label fullscreen_;
  Label helpButton_;
  Label exit_;
  Label tools_;
  Label edit_;
  Label players_;
  Label you_;
  Label health_;
  std::vector<Label> hotbarNumbers_;
  Label helpTitle_;
  Label helpClose_;
  std::vector<Label> helpLines_;

  // The backpack strip along the bottom, and whether Tools currently shows it.
  bool hotbarVisible_ = true;
  Rect hotbar_;
  std::vector<Rect> hotbarSlots_;

  // The era's vertical health meter on the right edge.
  Rect healthTrack_;
  Rect healthFill_;

  Rect topStrip_;
  Rect hamburger_;
  Rect topFullscreen_;
  Rect topHelp_;
  Rect topExit_;
  Rect topTools_;
  Rect topEdit_;
  Rect leaderboard_;
  Rect chatButton_;
  Rect zoomInButton_;
  Rect zoomOutButton_;
  Rect tiltButton_;
  Rect reportButton_;
  Rect wasdW_;
  Rect wasdA_;
  Rect wasdS_;
  Rect wasdD_;
  Rect helpPanel_;
  Rect helpCloseButton_;
};

}  // namespace fieldbrik
