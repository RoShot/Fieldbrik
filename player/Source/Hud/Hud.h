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

#include "Rendering/Renderer.h"

namespace fieldbrik {

class Input;

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

  void Collect(std::vector<Renderer::HudSprite>& sprites) const;

 private:
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
  bool MakeLabel(const wchar_t* text, int pointSize, bool bold, Label& label);

  void Layout();

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

  Label fullscreen_;
  Label helpButton_;
  Label exit_;
  Label players_;
  Label you_;
  Label helpTitle_;
  Label helpClose_;
  std::vector<Label> helpLines_;

  Rect topFullscreen_;
  Rect topHelp_;
  Rect topExit_;
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
