// The application: owns the window, the world, the player, the camera, the
// renderer, input and the frame loop.
//
// Kept free of Direct3D and Win32 drawing detail on purpose. If the renderer is
// ever replaced, or a second platform appears, this file should not need to
// change beyond the types it holds.

#pragma once

#include <windows.h>

#include <vector>

#include "Camera/Camera.h"
#include "Characters/Avatar.h"
#include "Characters/Player.h"
#include "Input/Input.h"
#include "Rendering/Renderer.h"
#include "Window/Window.h"
#include "World/Part.h"
#include "World/World.h"

namespace fieldbrik {

class App {
 public:
  App(HINSTANCE instance, int showCommand);
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
  void UpdateCamera(float deltaSeconds);
  void SetTitle(int framesPerSecond);
  DirectX::XMFLOAT3 FocusPoint() const;

  HINSTANCE instance_;
  int showCommand_;
  int failureCode_ = 1;

  Window window_;
  Renderer renderer_;
  Input input_;

  World world_;
  Player player_;
  Avatar avatar_;
  Camera camera_;

  // Rebuilt each frame rather than allocated per frame.
  std::vector<Part> avatarParts_;

  bool initialised_ = false;
};

}  // namespace fieldbrik
