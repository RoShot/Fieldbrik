#include "Application/App.h"

#include <windows.h>

#include <cstdio>

namespace fieldbrik {
namespace {

constexpr int kStartWidth = 1024;
constexpr int kStartHeight = 768;

// The early-client sky: a flat, pale blue, a little greener than a modern one.
constexpr float kSkyColour[4] = {0.56f, 0.78f, 0.94f, 1.0f};

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

  // The renderer and the camera follow the window: a resize is the window's
  // business, and it tells them afterwards.
  window_.OnResize([this](int width, int height) {
    if (initialised_) {
      renderer_.Resize(width, height);
      camera_.SetViewport(width, height);
    }
  });

  window_.OnClose([this]() { renderer_.WaitForGpu(); });

  if (!renderer_.Initialise(window_.Handle(), window_.Width(), window_.Height())) {
    ShowError(renderer_.LastError().empty()
                  ? L"Direct3D 11 could not be started on this machine."
                  : renderer_.LastError().c_str());
    failureCode_ = 3;
    return false;
  }

  camera_.SetViewport(window_.Width(), window_.Height());
  world_.BuildDefault();

  initialised_ = true;
  SetTitle(0);
  return true;
}

int App::Run() {
  LARGE_INTEGER frequency{};
  LARGE_INTEGER previous{};
  QueryPerformanceFrequency(&frequency);
  QueryPerformanceCounter(&previous);

  double titleElapsed = 0.0;
  int titleFrames = 0;

  // The loop: pump the window, sample input, move the camera, draw the world.
  while (window_.PumpMessages()) {
    input_.Update();

    if (input_.KeyDown(VK_ESCAPE)) break;

    LARGE_INTEGER now{};
    QueryPerformanceCounter(&now);
    const double elapsed =
        static_cast<double>(now.QuadPart - previous.QuadPart) /
        static_cast<double>(frequency.QuadPart);
    previous = now;

    // Clamped so that dragging the window, or a stalled frame, cannot fling the
    // camera easing across the world.
    const float delta = static_cast<float>(elapsed > 0.1 ? 0.1 : elapsed);
    UpdateCamera(delta);

    // A minimised window has nothing to draw; skip the frame but keep pumping
    // messages so it can be restored.
    if (!window_.IsMinimised()) {
      renderer_.BeginFrame(kSkyColour);
      renderer_.DrawWorld(world_, camera_);
      renderer_.EndFrame();

      titleElapsed += elapsed;
      ++titleFrames;

      if (titleElapsed >= 0.5) {
        SetTitle(static_cast<int>(titleFrames / titleElapsed));
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

void App::UpdateCamera(float deltaSeconds) {
  // Drag with the left button to swing around the world.
  if (input_.LeftButton()) {
    camera_.Orbit(input_.MouseDeltaX(), input_.MouseDeltaY());
  }

  if (input_.KeyDown(VK_LEFT)) camera_.Orbit(-8.0f, 0.0f);
  if (input_.KeyDown(VK_RIGHT)) camera_.Orbit(8.0f, 0.0f);
  if (input_.KeyDown(VK_UP)) camera_.Orbit(0.0f, -6.0f);
  if (input_.KeyDown(VK_DOWN)) camera_.Orbit(0.0f, 6.0f);

  if (input_.KeyDown('Q')) camera_.Zoom(1.0f);
  if (input_.KeyDown('E')) camera_.Zoom(-1.0f);

  if (input_.KeyPressed(VK_HOME)) camera_.Reset();

  camera_.Update(deltaSeconds);
}

void App::SetTitle(int framesPerSecond) {
  wchar_t buffer[256];
  swprintf_s(buffer, L"FieldBrik Player 0.2 - %d x %d - %d parts - %d fps",
             window_.Width(), window_.Height(), world_.PartCount(),
             framesPerSecond);
  window_.SetTitle(buffer);
}

}  // namespace fieldbrik
