// The window: a normal resizable Windows window, nothing else.
//
// It knows nothing about Direct3D. Whoever owns the window registers a resize
// handler and a close handler, and the window calls them. That keeps Win32 in
// one place and the graphics code out of the message loop.

#pragma once

#include <windows.h>

#include <functional>
#include <string>

namespace fieldbrik {

class Window {
 public:
  using ResizeHandler = std::function<void(int width, int height)>;
  using CloseHandler = std::function<void()>;

  Window() = default;
  ~Window();

  Window(const Window&) = delete;
  Window& operator=(const Window&) = delete;

  bool Create(HINSTANCE instance, int width, int height, const wchar_t* title,
              int showCommand);

  void Destroy();

  // Pumps every pending message. Returns false once the window has gone.
  bool PumpMessages();

  void SetTitle(const std::wstring& title);

  // Mouse wheel notches gathered since the last call: +1 per notch scrolled up,
  // -1 per notch down. Reading it clears it. The wheel arrives as a window
  // message rather than a polled key, which is why it lives here and not in
  // Input.
  int TakeWheel();

  HWND Handle() const { return handle_; }
  int Width() const { return width_; }
  int Height() const { return height_; }
  bool IsMinimised() const { return minimised_; }

  void OnResize(ResizeHandler handler) { resize_ = std::move(handler); }
  void OnClose(CloseHandler handler) { close_ = std::move(handler); }

 private:
  static LRESULT CALLBACK WndProc(HWND handle, UINT message, WPARAM wparam,
                                  LPARAM lparam);

  LRESULT HandleMessage(UINT message, WPARAM wparam, LPARAM lparam);

  HWND handle_ = nullptr;
  int width_ = 0;
  int height_ = 0;
  int wheel_ = 0;
  bool minimised_ = false;
  bool running_ = true;

  ResizeHandler resize_;
  CloseHandler close_;
};

}  // namespace fieldbrik
