#include "Application/App.h"

#include <windows.h>

#include <cstdio>

namespace fieldbrik {
namespace {

constexpr int kStartWidth = 1024;
constexpr int kStartHeight = 768;

// The early-client sky: a flat, pale blue, a little greener than a modern one.
constexpr float kSkyColour[4] = {0.56f, 0.78f, 0.94f, 1.0f};

std::wstring Format(const wchar_t* format, int a, int b, int c) {
  wchar_t buffer[256];
  swprintf_s(buffer, format, a, b, c);
  return std::wstring(buffer);
}

void ShowError(const wchar_t* message) {
  MessageBoxW(nullptr, message, L"FieldBrik Player", MB_OK | MB_ICONERROR);
}

}  // namespace

App::App(HINSTANCE instance, int showCommand)
    : instance_(instance), showCommand_(showCommand) {}

App::~App() = default;

bool App::Initialise() {
  if (!window_.Create(instance_, kStartWidth, kStartHeight, L"FieldBrik Player",
                      showCommand_)) {
    ShowError(L"The client could not create its window.");
    failureCode_ = 2;
    return false;
  }

  // The renderer follows the window: a resize is the window's business, and it
  // tells the renderer afterwards.
  window_.OnResize([this](int width, int height) {
    if (initialised_) renderer_.Resize(width, height);
  });

  window_.OnClose([this]() { renderer_.WaitForGpu(); });

  if (!renderer_.Initialise(window_.Handle(), window_.Width(), window_.Height())) {
    ShowError(renderer_.LastError().empty()
                  ? L"Direct3D 11 could not be started on this machine."
                  : renderer_.LastError().c_str());
    failureCode_ = 3;
    return false;
  }

  initialised_ = true;
  title_ = Format(L"FieldBrik Player 0.1 - %d x %d - %d fps", window_.Width(),
                  window_.Height(), 0);
  window_.SetTitle(title_);
  return true;
}

int App::Run() {
  LARGE_INTEGER frequency{};
  LARGE_INTEGER previous{};
  QueryPerformanceFrequency(&frequency);
  QueryPerformanceCounter(&previous);

  double titleElapsed = 0.0;
  int titleFrames = 0;

  // The loop: pump the window, sample the keyboard, draw one frame.
  while (window_.PumpMessages()) {
    input_.Update();

    if (input_.KeyDown(VK_ESCAPE)) break;

    LARGE_INTEGER now{};
    QueryPerformanceCounter(&now);
    const double delta =
        static_cast<double>(now.QuadPart - previous.QuadPart) /
        static_cast<double>(frequency.QuadPart);
    previous = now;

    // A minimised window has nothing to draw; skip the frame but keep pumping
    // messages so it can be restored.
    if (!window_.IsMinimised()) {
      renderer_.BeginFrame(kSkyColour);
      renderer_.EndFrame();

      titleElapsed += delta;
      ++titleFrames;

      if (titleElapsed >= 0.5) {
        const int fps = static_cast<int>(titleFrames / titleElapsed);
        title_ = Format(L"FieldBrik Player 0.1 - %d x %d - %d fps",
                        window_.Width(), window_.Height(), fps);
        window_.SetTitle(title_);
        titleElapsed = 0.0;
        titleFrames = 0;
      }
    }
  }

  renderer_.WaitForGpu();
  renderer_.Shutdown();
  window_.Destroy();
  return 0;
}

void App::UpdateTitle(double, int) {}

}  // namespace fieldbrik
