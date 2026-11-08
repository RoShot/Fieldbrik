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
  using CursorHandler = std::function<HCURSOR(unsigned hitTest)>;
  using ActivateHandler = std::function<void()>;

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

  // Borderless over the whole monitor, and back to the window it was. The client
  // resizes itself through the same WM_SIZE path as a drag, so the renderer does
  // not need to know which happened.
  void ToggleFullscreen();
  bool Fullscreen() const { return fullscreen_; }

  // Mouse wheel notches gathered since the last call: +1 per notch scrolled up,
  // -1 per notch down. Reading it clears it. The wheel arrives as a window
  // message rather than a polled key, which is why it lives here and not in
  // Input.
  int TakeWheel();

  HWND Handle() const { return handle_; }
  int Width() const { return width_; }
  int Height() const { return height_; }
  bool IsMinimised() const { return minimised_; }

  // Characters typed since the last call, for the chat bar. Nothing else
  // reads the keyboard as text: the world reads key states.
  void TakeTyped(std::wstring& out);


  void OnResize(ResizeHandler handler) { resize_ = std::move(handler); }
  void OnClose(CloseHandler handler) { close_ = std::move(handler); }

  // Asked on every WM_SETCURSOR, with the hit test Windows reported.
  void OnSetCursor(CursorHandler handler) { cursor_ = std::move(handler); }

  // Called when the window comes back to the foreground, which is when the frame
  // clock has to start over: time spent away is not time the world stood still.
  void OnActivate(ActivateHandler handler) { activate_ = std::move(handler); }

 private:
  static LRESULT CALLBACK WndProc(HWND handle, UINT message, WPARAM wparam,
                                  LPARAM lparam);

  LRESULT HandleMessage(UINT message, WPARAM wparam, LPARAM lparam);

  HWND handle_ = nullptr;
  int width_ = 0;
  int height_ = 0;
  int wheel_ = 0;
  std::wstring typed_;
  bool minimised_ = false;
  bool fullscreen_ = false;
  RECT windowedRect_{};
  LONG_PTR windowedStyle_ = 0;
  bool running_ = true;

  ResizeHandler resize_;
  CloseHandler close_;
  CursorHandler cursor_;
  ActivateHandler activate_;
};

}  // namespace fieldbrik
