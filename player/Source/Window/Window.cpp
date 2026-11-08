#include "Window/Window.h"

#include <windows.h>

namespace fieldbrik {
namespace {

constexpr wchar_t kClassName[] = L"FieldBrikPlayerWindow";

}  // namespace

Window::~Window() { Destroy(); }

bool Window::Create(HINSTANCE instance, int width, int height,
                    const wchar_t* title, int showCommand) {
  WNDCLASSEXW windowClass{};
  windowClass.cbSize = sizeof(windowClass);
  windowClass.style = CS_HREDRAW | CS_VREDRAW;
  windowClass.lpfnWndProc = &Window::WndProc;
  windowClass.hInstance = instance;
  windowClass.hCursor = LoadCursorW(nullptr, IDC_ARROW);
  windowClass.hbrBackground = nullptr;  // The renderer paints every pixel.
  windowClass.lpszClassName = kClassName;

  // Registering the class twice is not an error worth failing over: it happens
  // if a second window is opened in one process.
  if (!RegisterClassExW(&windowClass) &&
      GetLastError() != ERROR_CLASS_ALREADY_EXISTS) {
    return false;
  }

  RECT rect{0, 0, width, height};
  AdjustWindowRectEx(&rect, WS_OVERLAPPEDWINDOW, FALSE, 0);

  handle_ = CreateWindowExW(0, kClassName, title, WS_OVERLAPPEDWINDOW,
                            CW_USEDEFAULT, CW_USEDEFAULT,
                            rect.right - rect.left, rect.bottom - rect.top,
                            nullptr, nullptr, instance, this);

  if (!handle_) return false;

  width_ = width;
  height_ = height;

  ShowWindow(handle_, showCommand);
  UpdateWindow(handle_);
  return true;
}

void Window::Destroy() {
  if (handle_) {
    SetWindowLongPtrW(handle_, GWLP_USERDATA, 0);
    DestroyWindow(handle_);
    handle_ = nullptr;
  }
}

bool Window::PumpMessages() {
  MSG message{};
  while (PeekMessageW(&message, nullptr, 0, 0, PM_REMOVE)) {
    if (message.message == WM_QUIT) {
      running_ = false;
      return false;
    }
    TranslateMessage(&message);
    DispatchMessageW(&message);
  }
  return running_ && handle_ != nullptr;
}

void Window::SetTitle(const std::wstring& title) {
  if (handle_) SetWindowTextW(handle_, title.c_str());
}

int Window::TakeWheel() {
  const int notches = wheel_;
  wheel_ = 0;
  return notches;
}

LRESULT CALLBACK Window::WndProc(HWND handle, UINT message, WPARAM wparam,
                                 LPARAM lparam) {
  if (message == WM_NCCREATE) {
    auto* create = reinterpret_cast<CREATESTRUCTW*>(lparam);
    auto* self = static_cast<Window*>(create->lpCreateParams);
    SetWindowLongPtrW(handle, GWLP_USERDATA,
                      reinterpret_cast<LONG_PTR>(self));
    self->handle_ = handle;
  }

  auto* self = reinterpret_cast<Window*>(
      GetWindowLongPtrW(handle, GWLP_USERDATA));

  if (self) return self->HandleMessage(message, wparam, lparam);

  return DefWindowProcW(handle, message, wparam, lparam);
}

LRESULT Window::HandleMessage(UINT message, WPARAM wparam, LPARAM lparam) {
  switch (message) {
    case WM_SIZE: {
      const int width = LOWORD(lparam);
      const int height = HIWORD(lparam);
      minimised_ = (wparam == SIZE_MINIMIZED);

      if (!minimised_ && width > 0 && height > 0) {
        width_ = width;
        height_ = height;
        if (resize_) resize_(width_, height_);
      }
      return 0;
    }

    case WM_MOUSEWHEEL: {
      // A high-resolution wheel sends fractions of a notch, so a scroll smaller
      // than one notch still counts once it is pointing anywhere at all.
      const int delta = GET_WHEEL_DELTA_WPARAM(wparam);
      if (delta >= WHEEL_DELTA) {
        wheel_ += delta / WHEEL_DELTA;
      } else if (delta <= -WHEEL_DELTA) {
        wheel_ += delta / WHEEL_DELTA;
      } else {
        wheel_ += delta > 0 ? 1 : -1;
      }
      return 0;
    }

    case WM_SETCURSOR: {
      // Answering every hit test here is what makes the frame's edges wear the
      // era's resize arrow instead of the system one.
      if (cursor_) {
        ::SetCursor(cursor_(LOWORD(lparam)));
        return TRUE;
      }
      break;
    }

    case WM_ACTIVATE:
      // Coming back from the background is not something that happened in the
      // world, so the client starts its clock over rather than simulating the
      // time it was away.
      if (LOWORD(wparam) != WA_INACTIVE && activate_) activate_();
      break;

    case WM_CLOSE:
      if (close_) close_();
      Destroy();
      return 0;

    case WM_DESTROY:
      running_ = false;
      PostQuitMessage(0);
      return 0;

    default:
      break;
  }

  return DefWindowProcW(handle_, message, wparam, lparam);
}

}  // namespace fieldbrik
