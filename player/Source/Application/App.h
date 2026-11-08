// The application: owns the window, the world, the player, the camera, the
// renderer, input and the frame loop.
//
// Kept free of Direct3D and Win32 drawing detail on purpose. If the renderer is
// ever replaced, or a second platform appears, this file should not need to
// change beyond the types it holds.

#pragma once

#include <windows.h>

#include <string>
#include <vector>

#include "Camera/Camera.h"
#include "Hud/Hud.h"
#include "Characters/Avatar.h"
#include "Characters/Player.h"
#include "Input/Input.h"
#include "Rendering/Renderer.h"
#include "Window/Cursors.h"
#include "Window/Window.h"
#include "World/Part.h"
#include "World/World.h"

namespace fieldbrik {

class App {
 public:
  // `placePath` is what was passed on the command line, empty when the client was
  // double-clicked.
  App(HINSTANCE instance, int showCommand, const std::wstring& placePath);
  ~App();

  App(const App&) = delete;
  App& operator=(const App&) = delete;

  // Creates the window, the renderer, the world and the player. On failure it has
  // already told the user why, and FailureCode() says what to return.
  bool Initialise();

  // Runs until the window closes. Returns the process exit code.
  int Run();

  int FailureCode() const { return failureCode_; }

 private:
  // Loads the place named on the command line, or the one beside the exe, and
  // falls back to the built-in place when neither is there.
  void LoadWorld();

  void UpdateCamera(float deltaSeconds);
  void SetTitle(int framesPerSecond);
  DirectX::XMFLOAT3 FocusPoint() const;

  HINSTANCE instance_;
  int showCommand_;
  std::wstring placePath_;
  int failureCode_ = 1;

  Window window_;
  Renderer renderer_;
  Input input_;
  Cursors cursors_;
  Hud hud_;

  World world_;
  Player player_;
  Avatar avatar_;
  Camera camera_;

  // Where the avatar is drawn, which trails the player by a frame or two so a
  // one-stud step up does not read as a snap.
  DirectX::XMFLOAT3 renderedFeet_{0.0f, 0.0f, 0.0f};

  // Rebuilt each frame rather than allocated per frame.
  std::vector<Part> avatarParts_;

  // Rebuilt each frame rather than allocated per frame.
  std::vector<Renderer::HudSprite> hudSprites_;

  // Set by the HUD's Exit button, which leaves the loop the same way the
  // window's close button does.
  bool exitRequested_ = false;

  bool initialised_ = false;

  // Set when the window is activated again, so the loop can start its clock over
  // instead of treating the time in the background as a frame.
  bool clockReset_ = false;
};

}  // namespace fieldbrik
