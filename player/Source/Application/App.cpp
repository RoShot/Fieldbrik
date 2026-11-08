#include "Application/App.h"

#include <windows.h>

#include <algorithm>
#include <cmath>
#include <string>
#include <vector>

#include "Physics/Physics.h"
#include "Version.generated.h"

namespace fieldbrik {
namespace {

constexpr int kStartWidth = 1024;
constexpr int kStartHeight = 768;

// The early-client sky: a flat, pale blue, a little greener than a modern one.
// The renderer draws its gradient over this, so it only shows if the sky pass
// cannot run at all.
constexpr float kSkyColour[4] = {0.56f, 0.78f, 0.94f, 1.0f};

// Where the camera may not go closer than, whatever is in the way: right up
// against the avatar would put the near plane inside it.
constexpr float kCameraPadding = 0.3f;

void ShowError(const wchar_t* message) {
  MessageBoxW(nullptr, message, L"FieldBrik Player", MB_OK | MB_ICONERROR);
}

std::string Narrow(const std::wstring& text) {
  if (text.empty()) return std::string();
  const int needed = WideCharToMultiByte(CP_UTF8, 0, text.c_str(), -1, nullptr, 0,
                                         nullptr, nullptr);
  if (needed <= 1) return std::string();
  std::string result(static_cast<size_t>(needed - 1), '\0');
  WideCharToMultiByte(CP_UTF8, 0, text.c_str(), -1, result.data(), needed, nullptr,
                      nullptr);
  return result;
}

std::wstring Widen(const std::string& text) {
  if (text.empty()) return std::wstring();
  const int needed = MultiByteToWideChar(CP_UTF8, 0, text.c_str(), -1, nullptr, 0);
  if (needed <= 1) return std::wstring();

  std::wstring result(static_cast<size_t>(needed - 1), L'\0');
  MultiByteToWideChar(CP_UTF8, 0, text.c_str(), -1, result.data(), needed);
  return result;
}

std::wstring ExecutableDirectory() {
  wchar_t path[MAX_PATH]{};
  const DWORD length = GetModuleFileNameW(nullptr, path, MAX_PATH);
  if (length == 0) return std::wstring();

  const std::wstring file(path, length);
  const size_t slash = file.find_last_of(L"\\/");
  return slash == std::wstring::npos ? std::wstring() : file.substr(0, slash + 1);
}

bool FileExists(const std::wstring& path) {
  const DWORD attributes = GetFileAttributesW(path.c_str());
  return attributes != INVALID_FILE_ATTRIBUTES &&
         (attributes & FILE_ATTRIBUTE_DIRECTORY) == 0;
}

}  // namespace

App::App(HINSTANCE instance, int showCommand, const std::wstring& placePath)
    : instance_(instance), showCommand_(showCommand), placePath_(placePath) {}

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
      hud_.Resize(width, height);
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

  // The head and its face are compiled into the exe. If they could not be read
  // the client still runs, but the avatar has no face, so say why instead of
  // leaving it a mystery.
  if (!renderer_.HeadAssetError().empty()) {
    const std::wstring message =
        L"The head and face could not be loaded:\n\n" + renderer_.HeadAssetError() +
        L"\n\nThe avatar will be drawn without them.";
    MessageBoxW(nullptr, message.c_str(), L"FieldBrik Player",
                MB_OK | MB_ICONWARNING);
  }

  LoadWorld();

  // A place that asks for a texture this exe does not carry is not run. A brick
  // in the wrong colour is the kind of bug that hides, and the fix is one file.
  const std::vector<std::string> missing = renderer_.MissingTextures(world_.Parts());
  if (!missing.empty()) {
    std::wstring list;
    for (const std::string& id : missing) {
      list += L"\n  ";
      list += Widen(id);
    }

    const std::wstring message =
        L"The place uses textures this client does not have:" + list +
        L"\n\nPut them in player/content/textures/bricks and rebuild.";
    MessageBoxW(nullptr, message.c_str(), L"FieldBrik Player",
                MB_OK | MB_ICONERROR);
    failureCode_ = 4;
    return false;
  }

  // Bricks wear the era's surface strip now, so there is no stud geometry to
  // build for the world: the studs are part of the picture on each face.

  camera_.SetViewport(window_.Width(), window_.Height());
  // The era's cursors, out of the exe's own resources. A file that cannot be read
  // falls back to the system arrow rather than stopping the client.
  cursors_.Load();
  window_.OnSetCursor([this](unsigned hitTest) {
    return cursors_.For(hitTest, input_.LeftButton());
  });
  window_.OnActivate([this]() { clockReset_ = true; });

  if (!hud_.Load(renderer_, window_.Handle())) {
    const std::wstring interfaceError =
        renderer_.LastError().empty()
            ? std::wstring(L"The interface could not be drawn.")
            : L"The interface could not be drawn:\n\n" +
                  renderer_.LastError();
    ShowError(interfaceError.c_str());
    failureCode_ = 5;
    return false;
  }
  RECT client{};
  GetClientRect(window_.Handle(), &client);
  hud_.Resize(client.right, client.bottom);

  player_.Spawn(world_.SpawnPoint(), world_.Parts());
  renderedFeet_ = player_.Position();

  // Start already looking at the player instead of flying in from the origin.
  camera_.SetTarget(FocusPoint());
  camera_.SnapToTarget();

  avatarParts_.reserve(8);

  initialised_ = true;
  SetTitle(0);
  return true;
}

void App::LoadWorld() {
  std::wstring path = placePath_;

  if (path.empty()) {
    // Double-clicked: look for a place beside the exe. .fbrx comes second because
    // it is the format Studio will write, once it exists.
    const std::wstring directory = ExecutableDirectory();
    for (const wchar_t* candidate : {L"place.rbxl", L"place.fbrx"}) {
      const std::wstring full = directory + candidate;
      if (FileExists(full)) {
        path = full;
        break;
      }
    }
  }

  if (!path.empty()) {
    std::string error;
    if (world_.Load(Narrow(path), error)) return;

    const std::wstring message = L"The place could not be loaded:\n\n" +
                                 Widen(error) +
                                 L"\n\nThe built-in place is being used instead.";
    MessageBoxW(nullptr, message.c_str(), L"FieldBrik Player",
                MB_OK | MB_ICONWARNING);
  }

  world_.BuildDefault();
}

DirectX::XMFLOAT3 App::FocusPoint() const {
  const DirectX::XMFLOAT3 feet = player_.Position();
  return {feet.x, feet.y + 3.0f, feet.z};
}

int App::Run() {
  LARGE_INTEGER frequency{};
  LARGE_INTEGER previous{};
  QueryPerformanceFrequency(&frequency);
  QueryPerformanceCounter(&previous);

  double titleElapsed = 0.0;
  int titleFrames = 0;

  // The loop: pump the window, sample input, move the player, follow with the
  // camera, draw the world and the avatar.
  while (window_.PumpMessages()) {
    input_.Update(GetForegroundWindow() == window_.Handle());

    // Characters the window collected go to the chat bar, and while it is
    // open its letters stop being movement.
    std::wstring typed;
    window_.TakeTyped(typed);
    hud_.TypeText(typed);
    input_.SetTextMode(hud_.ChatTyping());

    // The era's slash key: it opens the bar without reaching for the mouse.
    if (!hud_.ChatTyping() && input_.KeyPressed(VK_OEM_2)) hud_.BeginChat();

    // Escape closes the help screen first; only then does it leave the client.
    if (input_.KeyPressed(VK_ESCAPE) && !hud_.HandleEscape()) break;

    LARGE_INTEGER now{};
    QueryPerformanceCounter(&now);

    // Back from the background: the clock would otherwise count the time away and
    // simulate it as a fall, which lands with the jump pose still up. Start the
    // clock here and drop any pose that was being held when the window went away.
    if (clockReset_) {
      clockReset_ = false;
      previous = now;
      player_.CancelLanding();
    }

    const double elapsed =
        static_cast<double>(now.QuadPart - previous.QuadPart) /
        static_cast<double>(frequency.QuadPart);
    previous = now;

    // Clamped so that dragging the window, or a stalled frame, cannot fling the
    // player across the baseplate or the camera across the world.
    const float delta = static_cast<float>(elapsed > 0.1 ? 0.1 : elapsed);

    hud_.Tick(delta);

    // The wheel belongs to the quick chat menu while it is open, and to the
    // camera otherwise.
    const int notches = window_.TakeWheel();
    if (notches != 0) {
      if (hud_.QuickChatOpen()) {
        hud_.ScrollQuickChat(notches * 3);
      } else if (!hud_.PointerOverInterface() && !hud_.HelpOpen()) {
        camera_.Zoom(-static_cast<float>(notches));
      }
    }

    player_.Update(input_, world_.Parts(), camera_.Yaw(), delta);
    camera_.SetTarget(FocusPoint());
    // The animation is driven by what the player is doing, not by a timer: the
    // same pose the old Animate script picks from the Humanoid's events.
    Avatar::Pose pose = Avatar::Pose::Standing;
    if (!player_.Grounded()) {
      pose = player_.VerticalSpeed() > 0.0f ? Avatar::Pose::Jumping
                                            : Avatar::Pose::FreeFall;
    } else if (player_.Landing()) {
      // On the ground again, but the jump pose is still being held: the arms stay
      // up for half a second before the idle starts lowering them.
      pose = Avatar::Pose::Jumping;
    } else if (player_.HorizontalSpeed() > 0.5f) {
      pose = Avatar::Pose::Running;
    }

    // The player can be moved a whole stud by a step up in a single frame. Where
    // the avatar is drawn eases towards the real position instead, which is what
    // stops the climb reading as a teleport.
    const float ease = 1.0f - std::exp(-18.0f * delta);
    renderedFeet_.x += (player_.Position().x - renderedFeet_.x) * ease;
    renderedFeet_.y += (player_.Position().y - renderedFeet_.y) * ease;
    renderedFeet_.z += (player_.Position().z - renderedFeet_.z) * ease;

    switch (hud_.Update(input_)) {
      case Hud::Action::Fullscreen:
        window_.ToggleFullscreen();
        break;
      case Hud::Action::Exit:
        exitRequested_ = true;
        break;
      case Hud::Action::ZoomIn:
        camera_.Zoom(1.0f);
        break;
      case Hud::Action::ZoomOut:
        camera_.Zoom(-1.0f);
        break;
      case Hud::Action::TiltUp:
        camera_.Orbit(0.0f, -6.0f);
        break;
      case Hud::Action::None:
        break;
    }

    UpdateCamera(delta);

    avatar_.Animate(pose, delta);
    avatar_.SetPose(renderedFeet_, player_.Facing());
    avatarParts_.clear();
    avatar_.CollectParts(avatarParts_);

    // A minimised window has nothing to draw; skip the frame but keep pumping
    // messages so it can be restored.
    if (!window_.IsMinimised()) {
      renderer_.BeginFrame(kSkyColour);
      renderer_.DrawSky(camera_);
      renderer_.DrawSkyObjects(camera_);
      renderer_.DrawParts(world_.Parts(), camera_, true);
      renderer_.DrawParts(avatarParts_, camera_, false);
      renderer_.DrawAvatarStuds(avatarParts_, camera_);

      hud_.Collect(hudSprites_);
      renderer_.DrawHud(hudSprites_);
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
  // Hold the left button and drag to look around. The camera is the only thing
  // that reacts to the mouse; the avatar turns by itself, towards where it walks.
  // The interface owns the mouse: pressing one of its buttons must not also
  // drag the view, and nothing behind the help screen moves either.
  const bool overInterface = hud_.PointerOverInterface();
  const bool modal = hud_.HelpOpen() || hud_.SwallowingDrag();

  if (!overInterface && !modal && input_.LeftButton()) {
    camera_.Orbit(input_.MouseDeltaX(), input_.MouseDeltaY());
  }

  if (!modal) {
    if (input_.KeyDown(VK_LEFT)) camera_.Orbit(-8.0f, 0.0f);
    if (input_.KeyDown(VK_RIGHT)) camera_.Orbit(8.0f, 0.0f);
    if (input_.KeyDown(VK_UP)) camera_.Orbit(0.0f, -6.0f);
    if (input_.KeyDown(VK_DOWN)) camera_.Orbit(0.0f, 6.0f);
  }

  // The wheel zooms, one notch per step, the way the era's camera did. Q and E
  // stay for keyboards without one; the notches themselves are read in the
  // frame loop, so the quick chat menu can take them first.
  if (!modal) {
    if (input_.KeyDown('Q')) camera_.Zoom(1.0f);
    if (input_.KeyDown('E')) camera_.Zoom(-1.0f);
    if (input_.KeyPressed(VK_HOME)) camera_.Reset();
  }

  camera_.Update(deltaSeconds);

  // Keep the camera out of the bricks: cast from what it looks at towards where it
  // wants to sit, and stop short of anything in between.
  //
  // The ray starts from the un-obstructed eye position, not from where the camera
  // sat last frame. Otherwise a wall would shrink the ray, which shrinks the
  // distance, which shrinks the ray again — the camera would crawl into the player
  // and stay there.
  camera_.SetMaximumDistance(1.0e9f);

  const DirectX::XMFLOAT3 focus = camera_.Focus();
  const DirectX::XMFLOAT3 eye = camera_.Position();

  const float dx = eye.x - focus.x;
  const float dy = eye.y - focus.y;
  const float dz = eye.z - focus.z;
  const float distance = std::sqrt(dx * dx + dy * dy + dz * dz);

  if (distance > 0.01f) {
    const DirectX::XMFLOAT3 direction{dx / distance, dy / distance, dz / distance};
    const float wall =
        RayCastParts(world_.Parts(), focus, direction, distance);
    camera_.SetMaximumDistance(std::max(1.0f, wall - kCameraPadding));
  } else {
    camera_.SetMaximumDistance(1.0e9f);
  }
}

void App::SetTitle(int framesPerSecond) {
  wchar_t buffer[512];
  swprintf_s(buffer,
             L"FieldBrik Player %s - %d x %d - %d parts - %d fps - %s",
             kClientVersion, window_.Width(), window_.Height(),
             world_.PartCount() + static_cast<int>(avatarParts_.size()),
             framesPerSecond, Widen(world_.Name()).c_str());
  window_.SetTitle(buffer);
}

}  // namespace fieldbrik
