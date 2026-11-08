// The application: owns the window, the renderer, input and the frame loop.
//
// Kept free of Direct3D and Win32 detail on purpose. If the renderer is ever
// replaced, or a second platform appears, this file should not need to change
// beyond the types it holds.

#pragma once

#include <windows.h>

#include <string>

#include "Input/Input.h"
#include "Rendering/Renderer.h"
#include "Window/Window.h"

namespace fieldbrik {

class App {
 public:
  App(HINSTANCE instance, int showCommand);
  ~App();

  App(const App&) = delete;
  App& operator=(const App&) = delete;

  // Creates the window and the renderer. On failure it has already told the
  // user why, and FailureCode() says what to return.
  bool Initialise();

  // Runs until the window closes. Returns the process exit code.
  int Run();

  int FailureCode() const { return failureCode_; }

 private:
  void UpdateTitle(double seconds, int frames);

  HINSTANCE instance_;
  int showCommand_;
  int failureCode_ = 1;

  Window window_;
  Renderer renderer_;
  Input input_;

  std::wstring title_;
  bool initialised_ = false;
};

}  // namespace fieldbrik
