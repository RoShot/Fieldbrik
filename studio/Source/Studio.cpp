#include "Studio.h"

#include <commctrl.h>
#include <commdlg.h>
#include <windowsx.h>

#include <algorithm>
#include <cfloat>
#include <cmath>
#include <cstdio>
#include <string>
#include <vector>

#include "Version.generated.h"
#include "World/Part.h"
#include "World/PlaceFile.h"

namespace fieldbrik {

// One button on either toolbar. A command of zero is a tool that does not exist
// yet and is therefore drawn disabled.
struct ToolButton {
  const wchar_t* icon;
  int command;
  bool separatorAfter;
  bool enabled;
};

namespace {

constexpr wchar_t kFrameClass[] = L"FieldBrikStudioFrame";
constexpr wchar_t kViewportClass[] = L"FieldBrikStudioViewport";

// 2008 Studio was compact: a menu Windows draws, two 30 pixel toolbars, a tab
// strip, a 270 pixel right-hand dock and a status line.
constexpr int kToolbarHeight = 30;
constexpr int kTabHeight = 26;
constexpr int kQuickBarHeight = 24;
constexpr int kPanelHeader = 22;
constexpr int kPropertiesTitleHeight = 20;
constexpr int kStatusHeight = 22;
constexpr int kDockWidth = 270;
constexpr int kOutputHeight = 110;
constexpr int kToolboxWidth = 172;
constexpr int kButtonSize = 26;
constexpr int kButtonGap = 2;

constexpr int kExplorerId = 2001;
constexpr int kPropertiesId = 2002;
constexpr int kOutputId = 2003;

enum : int {
  kFileNew = 1000,
  kFileOpen,
  kFileClose,
  kFileSave,
  kFileSaveAs,
  kFilePublish,
  kFileSaveSelection,
  kFilePublishSelection,
  kFilePrint,
  kFilePrintPreview,
  kFilePrintSetup,
  kFileExit,
  kEditUndo,
  kEditRedo,
  kEditCut,
  kEditCopy,
  kEditPaste,
  kEditClear,
  kEditSelectAll,
  kEditDuplicate,
  kEditFind,
  kEditFindNext,
  kEditReplace,
  kEditLineNumbers,
  kEditSelectionMargin,
  kEditFoldingMargin,
  kEditAddMarker,
  kEditDeleteMarker,
  kEditNextMarker,
  kEditPreviousMarker,
  kEditUnlockAll,
  kEditLockAll,
  kViewStartPage,
  kViewToolbox,
  kViewExplorer,
  kViewProperties,
  kViewOutput,
  kViewDiagnostics,
  kViewTaskScheduler,
  kViewGameLayout,
  kViewFullscreen,
  kViewToolbarMouse,
  kViewToolbarStandard,
  kViewToolbarTest,
  kViewToolbarCamera,
  kViewToolbarCommand,
  kViewToolbarCustomize,
  kFormatRotate,
  kFormatTilt,
  kFormatCameraPosition,
  kFormatGroup,
  kFormatUngroup,
  kFormatSelectChildren,
  kFormatSetFront,
  kFormatGlueToWelds,
  kFormatWeldsToSnaps,
  kInsertModel,
  kInsertLDraw,
  kInsertObject,
  kInsertService,
  kInsertTool,
  kInsertClearStarterPack,
  kInsertClearBackpack,
  kInsertBlock,
  kInsertSphere,
  kInsertCylinder,
  kInsertWedge,
  kToolsExecuteScript,
  kToolsGC,
  kToolsPlaySolo,
  kToolsStartPlayer,
  kToolsStartServer,
  kToolsJoinBricks,
  kToolsForceAssertion,
  kToolsEngineStats,
  kToolsThumbnailView,
  kToolsInsertModelRaw,
  kToolsReportAbuse,
  kToolsReportCrashes,
  kToolsUploadLogs,
  kToolsInstanceDump,
  kToolsCustomize,
  kToolsSettings,
  kHelpAbout,
  kHelpOnline,
  kHelpObjectBrowser,
  kRecentFirst = 1200,
};

const ToolButton kStandardButtons[] = {
    {L"new", kFileNew, false, false},
    {L"open", kFileOpen, false, true},
    {L"save", kFileSave, true, true},
    {L"undo", kEditUndo, false, false},
    {L"redo", kEditRedo, true, false},
    {L"play", kToolsPlaySolo, false, false},
};

const ToolButton kToolsButtons[] = {
    {L"select", 0, false, false},
    {L"move", 0, false, false},
    {L"rotate", 0, false, false},
    {L"scale", 0, true, false},
    {L"part", kInsertBlock, false, true},
    {L"sphere", kInsertSphere, false, true},
    {L"cylinder", kInsertCylinder, false, true},
    {L"wedge", kInsertWedge, false, true},
};

constexpr int kStandardCount =
    static_cast<int>(sizeof(kStandardButtons) / sizeof(kStandardButtons[0]));
constexpr int kToolsCount =
    static_cast<int>(sizeof(kToolsButtons) / sizeof(kToolsButtons[0]));

std::wstring ExecutableDirectory() {
  wchar_t path[MAX_PATH] = L"";
  const DWORD length = GetModuleFileNameW(nullptr, path, MAX_PATH);
  if (length == 0) return std::wstring();

  std::wstring full(path, length);
  const size_t slash = full.find_last_of(L"\\/");
  return slash == std::wstring::npos ? std::wstring()
                                     : full.substr(0, slash + 1);
}

std::string Narrow(const std::wstring& text) {
  if (text.empty()) return std::string();

  const int length = WideCharToMultiByte(CP_ACP, 0, text.c_str(),
                                         static_cast<int>(text.size()),
                                         nullptr, 0, nullptr, nullptr);
  if (length <= 0) return std::string();

  std::string result(static_cast<size_t>(length), '\0');
  WideCharToMultiByte(CP_ACP, 0, text.c_str(), static_cast<int>(text.size()),
                      result.data(), length, nullptr, nullptr);
  return result;
}

std::wstring Widen(const std::string& text) {
  if (text.empty()) return std::wstring();

  const int length = MultiByteToWideChar(CP_ACP, 0, text.c_str(),
                                         static_cast<int>(text.size()), nullptr,
                                         0);
  if (length <= 0) return std::wstring();

  std::wstring result(static_cast<size_t>(length), L'\0');
  MultiByteToWideChar(CP_ACP, 0, text.c_str(), static_cast<int>(text.size()),
                      result.data(), length);
  return result;
}

std::wstring FileNameOf(const std::wstring& path) {
  const size_t slash = path.find_last_of(L"\\/");
  return slash == std::wstring::npos ? path : path.substr(slash + 1);
}

std::wstring FormatFloat(float value) {
  wchar_t buffer[32] = L"";
  swprintf_s(buffer, L"%.2f", value);
  return buffer;
}

std::wstring FormatVector(const DirectX::XMFLOAT3& value) {
  return FormatFloat(value.x) + L", " + FormatFloat(value.y) + L", " +
         FormatFloat(value.z);
}

std::wstring ShapeName(PartShape shape) {
  switch (shape) {
    case PartShape::Sphere:
      return L"Sphere";
    case PartShape::Cylinder:
      return L"Cylinder";
    case PartShape::Wedge:
      return L"Wedge";
    case PartShape::RoundedHead:
      return L"Rounded head";
    case PartShape::Cube:
    default:
      return L"Block";
  }
}

std::wstring ColourHex(const DirectX::XMFLOAT3& colour) {
  const auto channel = [](float value) {
    return static_cast<int>(
        std::lround(std::clamp(value, 0.0f, 1.0f) * 255.0f));
  };

  wchar_t buffer[16] = L"";
  swprintf_s(buffer, L"#%02X%02X%02X", channel(colour.x), channel(colour.y),
             channel(colour.z));
  return buffer;
}

}  // namespace

Studio::~Studio() {
  if (font_) DeleteObject(font_);
  if (boldFont_) DeleteObject(boldFont_);
  if (accelerators_) DestroyAcceleratorTable(accelerators_);
  if (comInitialised_) CoUninitialize();
}

int Studio::Run(HINSTANCE instance, int showCommand,
                const std::wstring& placePath) {
  instance_ = instance;

  if (SUCCEEDED(CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED))) {
    comInitialised_ = true;
  }

  INITCOMMONCONTROLSEX controls{};
  controls.dwSize = sizeof(controls);
  controls.dwICC =
      ICC_TREEVIEW_CLASSES | ICC_LISTVIEW_CLASSES | ICC_STANDARD_CLASSES;
  InitCommonControlsEx(&controls);

  if (!CreateFrame(instance, showCommand)) return 1;

  if (!CreateChildren()) {
    MessageBoxW(frame_, L"Studio could not start its renderer.",
                L"FieldBrik Studio", MB_OK | MB_ICONERROR);
    return 1;
  }

  Layout();
  LoadStartingPlace(placePath);
  ResetCamera();
  SetPlaceTitle();
  InvalidateRect(frame_, nullptr, FALSE);
  SetFocus(viewport_);

  if (icons_.Empty()) {
    Log(L"Toolbar icons were not found in content\\icons; the buttons are blank.");
  }
  if (renderer_.AddTexturesFromDirectory(ExecutableDirectory() +
                                         L"content\\textures\\bricks")) {
    Log(L"Brick textures from content\\textures\\bricks were added.");
  }

  LARGE_INTEGER frequency{};
  LARGE_INTEGER previous{};
  QueryPerformanceFrequency(&frequency);
  QueryPerformanceCounter(&previous);

  MSG message{};
  while (running_) {
    while (PeekMessageW(&message, nullptr, 0, 0, PM_REMOVE)) {
      if (message.message == WM_QUIT) {
        running_ = false;
        break;
      }
      if (accelerators_ &&
          TranslateAcceleratorW(frame_, accelerators_, &message)) {
        continue;
      }
      TranslateMessage(&message);
      DispatchMessageW(&message);
    }
    if (!running_ || !frame_) break;

    LARGE_INTEGER now{};
    QueryPerformanceCounter(&now);
    const double elapsed =
        static_cast<double>(now.QuadPart - previous.QuadPart) /
        static_cast<double>(frequency.QuadPart);
    previous = now;

    // The Start Page has no 3D view to draw. Idle instead of spinning the
    // loop at thousands of frames a second and inflating the readout.
    if (startPage_) {
      Sleep(10);
      continue;
    }

    const float delta = static_cast<float>(elapsed > 0.1 ? 0.1 : elapsed);

    if (delta > 0.0001f) {
      const float instant = 1.0f / delta;
      fps_ = fps_ <= 0.0f ? instant : fps_ * 0.9f + instant * 0.1f;
    }

    UpdateCamera(delta);
    Render();
  }

  renderer_.WaitForGpu();
  renderer_.Shutdown();
  return 0;
}

bool Studio::CreateFrame(HINSTANCE instance, int showCommand) {
  WNDCLASSEXW frameClass{};
  frameClass.cbSize = sizeof(frameClass);
  frameClass.style = CS_HREDRAW | CS_VREDRAW;
  frameClass.lpfnWndProc = &Studio::FrameProc;
  frameClass.hInstance = instance;
  frameClass.hCursor = LoadCursorW(nullptr, IDC_ARROW);
  frameClass.hbrBackground = nullptr;  // DrawChrome paints every pixel.
  frameClass.lpszClassName = kFrameClass;
  frameClass.hIcon = LoadIconW(nullptr, IDI_APPLICATION);
  frameClass.hIconSm = frameClass.hIcon;

  if (!RegisterClassExW(&frameClass) &&
      GetLastError() != ERROR_CLASS_ALREADY_EXISTS) {
    return false;
  }

  RECT bounds{0, 0, 1280, 800};
  AdjustWindowRectEx(&bounds, WS_OVERLAPPEDWINDOW, TRUE, 0);

  frame_ = CreateWindowExW(0, kFrameClass, L"FieldBrik Studio",
                           WS_OVERLAPPEDWINDOW | WS_CLIPCHILDREN, CW_USEDEFAULT,
                           CW_USEDEFAULT, bounds.right - bounds.left,
                           bounds.bottom - bounds.top, nullptr, nullptr,
                           instance, this);
  if (!frame_) return false;

  font_ = CreateFontW(-12, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
                      DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
                      CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_SWISS, L"Tahoma");
  boldFont_ = CreateFontW(-12, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
                          DEFAULT_CHARSET, OUT_DEFAULT_PRECIS,
                          CLIP_DEFAULT_PRECIS, CLEARTYPE_QUALITY,
                          DEFAULT_PITCH | FF_SWISS, L"Tahoma");

  CreateMenuBar();
  if (menu_) SetMenu(frame_, menu_);

  ShowWindow(frame_, showCommand);
  UpdateWindow(frame_);
  return true;
}

void Studio::CreateMenuBar() {
  menu_ = CreateMenu();
  if (!menu_) return;

  const auto item = [](HMENU menu, UINT id, const wchar_t* text,
                       bool enabled = false) {
    AppendMenuW(menu, MF_STRING | (enabled ? MF_ENABLED : MF_GRAYED), id, text);
  };
  const auto check = [](HMENU menu, UINT id, const wchar_t* text,
                        bool checked) {
    AppendMenuW(menu, MF_STRING | (checked ? MF_CHECKED : MF_UNCHECKED), id,
                text);
  };

  HMENU file = CreatePopupMenu();
  item(file, kFileNew, L"&New\tCtrl+N", true);
  item(file, kFileOpen, L"&Open...\tCtrl+O", true);
  item(file, kFileClose, L"&Close");
  AppendMenuW(file, MF_SEPARATOR, 0, nullptr);
  item(file, kFileSave, L"&Save\tCtrl+S", true);
  item(file, kFileSaveAs, L"Save &As...", true);
  item(file, kFilePublish, L"&Publish to FieldBrik...");
  item(file, kFileSaveSelection, L"Save Selection as &Model...");
  item(file, kFilePublishSelection, L"Publish Selection to FieldBrik...");
  AppendMenuW(file, MF_SEPARATOR, 0, nullptr);
  item(file, kFilePrint, L"&Print...\tCtrl+P");
  item(file, kFilePrintPreview, L"Print Pre&view");
  item(file, kFilePrintSetup, L"Print Set&up...");
  AppendMenuW(file, MF_SEPARATOR, 0, nullptr);

  if (recentPlaces_.empty()) {
    AppendMenuW(file, MF_STRING | MF_GRAYED, 0, L"1 (no recent places)");
  } else {
    for (int i = 0;
         i < static_cast<int>(recentPlaces_.size()) && i < 6; ++i) {
      const std::wstring label =
          std::to_wstring(i + 1) + L" " + FileNameOf(recentPlaces_[i]);
      AppendMenuW(file, MF_STRING, kRecentFirst + i, label.c_str());
    }
  }

  AppendMenuW(file, MF_SEPARATOR, 0, nullptr);
  item(file, kFileExit, L"E&xit", true);
  AppendMenuW(menu_, MF_POPUP, reinterpret_cast<UINT_PTR>(file), L"&File");

  HMENU edit = CreatePopupMenu();
  item(edit, kEditUndo, L"&Undo\tCtrl+Z", true);
  item(edit, kEditRedo, L"&Redo\tCtrl+Y", true);
  AppendMenuW(edit, MF_SEPARATOR, 0, nullptr);
  item(edit, kEditCut, L"Cu&t\tCtrl+X", true);
  item(edit, kEditCopy, L"&Copy\tCtrl+C", true);
  item(edit, kEditPaste, L"&Paste\tCtrl+V", true);
  item(edit, kEditClear, L"Clea&r\tDelete", true);
  item(edit, kEditSelectAll, L"Select &All\tCtrl+A");
  item(edit, kEditDuplicate, L"&Duplicate\tCtrl+D", true);
  AppendMenuW(edit, MF_SEPARATOR, 0, nullptr);

  HMENU find = CreatePopupMenu();
  item(find, kEditFind, L"&Find...\tCtrl+F");
  item(find, kEditFindNext, L"Find &Next\tF3");
  item(find, kEditReplace, L"&Replace...\tCtrl+H");
  AppendMenuW(edit, MF_POPUP, reinterpret_cast<UINT_PTR>(find),
              L"Find and &Replace");

  HMENU script = CreatePopupMenu();
  item(script, kEditLineNumbers, L"Display &Line Numbers");
  item(script, kEditSelectionMargin, L"Display &Selection/Bookmark Margin");
  item(script, kEditFoldingMargin, L"Display &Folding Margin");
  AppendMenuW(script, MF_SEPARATOR, 0, nullptr);
  item(script, kEditAddMarker, L"&Add a Marker");
  item(script, kEditDeleteMarker, L"&Delete Marker");
  item(script, kEditNextMarker, L"Find &Next Marker");
  item(script, kEditPreviousMarker, L"Find &Previous Marker");
  AppendMenuW(edit, MF_POPUP, reinterpret_cast<UINT_PTR>(script), L"&Script");
  AppendMenuW(edit, MF_SEPARATOR, 0, nullptr);
  item(edit, kEditUnlockAll, L"&Unlock All");
  item(edit, kEditLockAll, L"&Lock All");
  AppendMenuW(menu_, MF_POPUP, reinterpret_cast<UINT_PTR>(edit), L"&Edit");

  HMENU view = CreatePopupMenu();
  check(view, kViewStartPage, L"&Start Page", startPage_);
  check(view, kViewToolbox, L"&Toolbox", showToolbox_);
  AppendMenuW(view, MF_SEPARATOR, 0, nullptr);
  check(view, kViewExplorer, L"&Explorer", showExplorer_);
  check(view, kViewProperties, L"&Properties", showProperties_);
  check(view, kViewOutput, L"&Output", showOutput_);
  item(view, kViewDiagnostics, L"&Diagnostics");
  AppendMenuW(view, MF_SEPARATOR, 0, nullptr);
  item(view, kViewTaskScheduler, L"&Task Scheduler");
  item(view, kViewGameLayout, L"&Game Layout", true);
  item(view, kViewFullscreen, L"&Fullscreen\tF11", true);
  AppendMenuW(view, MF_SEPARATOR, 0, nullptr);

  HMENU toolbars = CreatePopupMenu();
  check(toolbars, kViewToolbarMouse, L"&Mouse", mouseToolbar_);
  check(toolbars, kViewToolbarStandard, L"&Standard", showStandardToolbar_);
  check(toolbars, kViewToolbarTest, L"&Test", testToolbar_);
  check(toolbars, kViewToolbarCamera, L"&Camera", showToolsToolbar_);
  check(toolbars, kViewToolbarCommand, L"&Command", commandToolbar_);
  AppendMenuW(toolbars, MF_SEPARATOR, 0, nullptr);
  item(toolbars, kViewToolbarCustomize, L"&Customize...", true);
  AppendMenuW(view, MF_POPUP, reinterpret_cast<UINT_PTR>(toolbars),
              L"&Toolbars");
  AppendMenuW(menu_, MF_POPUP, reinterpret_cast<UINT_PTR>(view), L"&View");

  HMENU insert = CreatePopupMenu();
  item(insert, kInsertModel, L"&Model...");
  item(insert, kInsertLDraw, L"&LDraw File...");
  AppendMenuW(insert, MF_SEPARATOR, 0, nullptr);
  HMENU object = CreatePopupMenu();
  item(object, kInsertBlock, L"&Block", true);
  item(object, kInsertSphere, L"&Sphere", true);
  item(object, kInsertCylinder, L"&Cylinder", true);
  item(object, kInsertWedge, L"&Wedge", true);
  AppendMenuW(insert, MF_POPUP, reinterpret_cast<UINT_PTR>(object),
              L"&Object");
  item(insert, kInsertService, L"&Service...");
  item(insert, kInsertTool, L"&Tool...");
  AppendMenuW(insert, MF_SEPARATOR, 0, nullptr);
  item(insert, kInsertClearStarterPack, L"Clear Tools in &StarterPack");
  item(insert, kInsertClearBackpack, L"Clear Tools in My &Backpack");
  AppendMenuW(menu_, MF_POPUP, reinterpret_cast<UINT_PTR>(insert),
              L"&Insert");

  HMENU format = CreatePopupMenu();
  item(format, kFormatRotate, L"&Rotate...");
  item(format, kFormatTilt, L"&Tilt...");
  item(format, kFormatCameraPosition, L"Camera &Positioning...");
  AppendMenuW(format, MF_SEPARATOR, 0, nullptr);
  item(format, kFormatGroup, L"&Group\tCtrl+G");
  item(format, kFormatUngroup, L"&Ungroup\tCtrl+U");
  item(format, kFormatSelectChildren, L"Select &Children");
  item(format, kFormatSetFront, L"Set &Model Front");
  AppendMenuW(format, MF_SEPARATOR, 0, nullptr);
  item(format, kFormatGlueToWelds, L"Replace &Glue with Welds");
  item(format, kFormatWeldsToSnaps, L"Replace &Welds with Snaps");
  AppendMenuW(menu_, MF_POPUP, reinterpret_cast<UINT_PTR>(format),
              L"F&ormat");

  HMENU tools = CreatePopupMenu();
  item(tools, kToolsExecuteScript, L"&Execute Script...");
  item(tools, kToolsGC, L"&GC");
  AppendMenuW(tools, MF_SEPARATOR, 0, nullptr);

  HMENU test = CreatePopupMenu();
  item(test, kToolsPlaySolo, L"&Play Solo");
  item(test, kToolsStartPlayer, L"Start &Player");
  item(test, kToolsStartServer, L"Start &Server");
  AppendMenuW(tools, MF_POPUP, reinterpret_cast<UINT_PTR>(test), L"&Test");
  AppendMenuW(tools, MF_SEPARATOR, 0, nullptr);
  item(tools, kToolsJoinBricks, L"&Join Selected Bricks");
  item(tools, kToolsForceAssertion, L"&Force Assertion");
  item(tools, kToolsEngineStats, L"&Engine Stats", true);
  item(tools, kToolsThumbnailView, L"T&humbnail View");
  item(tools, kToolsInsertModelRaw, L"Insert &Model Raw...");
  AppendMenuW(tools, MF_SEPARATOR, 0, nullptr);
  item(tools, kToolsReportAbuse, L"Report &Abuse...");
  item(tools, kToolsReportCrashes, L"Report &Crashes...");
  item(tools, kToolsUploadLogs, L"&Upload my Logfiles...");
  item(tools, kToolsInstanceDump, L"&Instance Dump");
  AppendMenuW(tools, MF_SEPARATOR, 0, nullptr);
  item(tools, kToolsCustomize, L"&Customize...");
  item(tools, kToolsSettings, L"&Settings...");
  AppendMenuW(menu_, MF_POPUP, reinterpret_cast<UINT_PTR>(tools), L"&Tools");

  HMENU window = CreatePopupMenu();
  check(window, kViewExplorer, L"&Explorer", showExplorer_);
  check(window, kViewProperties, L"&Properties", showProperties_);
  check(window, kViewOutput, L"&Output", showOutput_);
  AppendMenuW(menu_, MF_POPUP, reinterpret_cast<UINT_PTR>(window),
              L"&Window");

  HMENU help = CreatePopupMenu();
  item(help, kHelpAbout, L"&About FieldBrik", true);
  item(help, kHelpOnline, L"&Online Help");
  item(help, kHelpObjectBrowser, L"&Object Browser");
  AppendMenuW(menu_, MF_POPUP, reinterpret_cast<UINT_PTR>(help), L"&Help");

  ACCEL keys[12] = {};
  const auto control = [&](int index, int key, int command) {
    keys[index].fVirt = static_cast<BYTE>(FCONTROL | FVIRTKEY);
    keys[index].key = static_cast<WORD>(key);
    keys[index].cmd = static_cast<WORD>(command);
  };
  const auto plain = [&](int index, int key, int command) {
    keys[index].fVirt = FVIRTKEY;
    keys[index].key = static_cast<WORD>(key);
    keys[index].cmd = static_cast<WORD>(command);
  };

  control(0, 'N', kFileNew);
  control(1, 'O', kFileOpen);
  control(2, 'Z', kEditUndo);
  control(3, 'Y', kEditRedo);
  control(4, 'X', kEditCut);
  control(5, 'C', kEditCopy);
  control(6, 'V', kEditPaste);
  control(7, 'D', kEditDuplicate);
  plain(8, VK_DELETE, kEditClear);
  plain(9, VK_HOME, kViewGameLayout);
  plain(10, VK_F11, kViewFullscreen);
  control(11, 'S', kFileSave);

  if (!accelerators_) accelerators_ = CreateAcceleratorTableW(keys, 12);
  UpdateEditMenu();
}

void Studio::RebuildMenu() {
  if (!frame_) return;

  if (menu_) {
    SetMenu(frame_, nullptr);
    DestroyMenu(menu_);
    menu_ = nullptr;
  }

  CreateMenuBar();
  if (menu_ && !fullscreen_) {
    SetMenu(frame_, menu_);
    DrawMenuBar(frame_);
  }
}

void Studio::AddRecent(const std::wstring& path) {
  if (path.empty()) return;

  recentPlaces_.erase(
      std::remove(recentPlaces_.begin(), recentPlaces_.end(), path),
      recentPlaces_.end());
  recentPlaces_.insert(recentPlaces_.begin(), path);
  if (recentPlaces_.size() > 6) recentPlaces_.resize(6);

  RebuildMenu();
}

bool Studio::CreateChildren() {
  WNDCLASSEXW viewportClass{};
  viewportClass.cbSize = sizeof(viewportClass);
  viewportClass.style = CS_HREDRAW | CS_VREDRAW;
  viewportClass.lpfnWndProc = &Studio::ViewportProc;
  viewportClass.hInstance = instance_;
  viewportClass.hCursor = LoadCursorW(nullptr, IDC_ARROW);
  viewportClass.hbrBackground = CreateSolidBrush(RGB(32, 38, 48));
  viewportClass.lpszClassName = kViewportClass;

  if (!RegisterClassExW(&viewportClass) &&
      GetLastError() != ERROR_CLASS_ALREADY_EXISTS) {
    return false;
  }

  viewport_ = CreateWindowExW(
      WS_EX_CLIENTEDGE, kViewportClass, L"",
      WS_CHILD | WS_VISIBLE | WS_CLIPSIBLINGS | WS_CLIPCHILDREN, 0, 0, 16, 16,
      frame_, nullptr, instance_, this);
  if (!viewport_) return false;

  explorer_ = CreateWindowExW(
      WS_EX_CLIENTEDGE, WC_TREEVIEWW, L"",
      WS_CHILD | WS_VISIBLE | WS_TABSTOP | TVS_HASBUTTONS | TVS_HASLINES |
          TVS_LINESATROOT | TVS_SHOWSELALWAYS,
      0, 0, 16, 16, frame_,
      reinterpret_cast<HMENU>(static_cast<INT_PTR>(kExplorerId)), instance_,
      nullptr);

  properties_ = CreateWindowExW(
      WS_EX_CLIENTEDGE, WC_LISTVIEWW, L"",
      WS_CHILD | WS_VISIBLE | WS_TABSTOP | LVS_REPORT | LVS_SINGLESEL |
          LVS_SHOWSELALWAYS | LVS_NOCOLUMNHEADER,
      0, 0, 16, 16, frame_,
      reinterpret_cast<HMENU>(static_cast<INT_PTR>(kPropertiesId)), instance_,
      nullptr);

  output_ = CreateWindowExW(
      WS_EX_CLIENTEDGE, L"EDIT", L"",
      WS_CHILD | ES_MULTILINE | ES_READONLY | ES_AUTOVSCROLL | WS_VSCROLL,
      0, 0, 16, 16, frame_,
      reinterpret_cast<HMENU>(static_cast<INT_PTR>(kOutputId)), instance_,
      nullptr);

  if (!explorer_ || !properties_ || !output_) return false;

  for (HWND control : {explorer_, properties_, output_}) {
    SendMessageW(control, WM_SETFONT, reinterpret_cast<WPARAM>(font_), TRUE);
  }

  LVCOLUMNW column{};
  column.mask = LVCF_TEXT | LVCF_WIDTH | LVCF_SUBITEM;
  column.pszText = const_cast<wchar_t*>(L"Property");
  column.cx = 105;
  column.iSubItem = 0;
  ListView_InsertColumn(properties_, 0, &column);
  column.pszText = const_cast<wchar_t*>(L"Value");
  column.cx = 135;
  column.iSubItem = 1;
  ListView_InsertColumn(properties_, 1, &column);
  ListView_SetExtendedListViewStyle(properties_, LVS_EX_FULLROWSELECT);

  if (!renderer_.Initialise(viewport_, 16, 16)) return false;
  rendererReady_ = true;

  icons_.Load(ExecutableDirectory() + L"content\\icons");
  return true;
}

void Studio::Layout() {
  if (!frame_) return;

  const RECT viewportRect = ViewportRect();
  if (viewport_) {
    ShowWindow(viewport_, startPage_ ? SW_HIDE : SW_SHOW);
    MoveWindow(viewport_, viewportRect.left, viewportRect.top,
               std::max(1, static_cast<int>(viewportRect.right -
                                            viewportRect.left)),
               std::max(1, static_cast<int>(viewportRect.bottom -
                                            viewportRect.top)),
               TRUE);
  }

  if (explorer_) {
    if (showExplorer_) {
      const RECT panel = ExplorerRect();
      ShowWindow(explorer_, SW_SHOW);
      MoveWindow(explorer_, panel.left + 1, panel.top + kPanelHeader,
                 std::max(1, static_cast<int>(panel.right - panel.left) - 2),
                 std::max(1, static_cast<int>(panel.bottom - panel.top) -
                                 kPanelHeader - 1),
                 TRUE);
    } else {
      ShowWindow(explorer_, SW_HIDE);
    }
  }

  if (properties_) {
    if (showProperties_) {
      const RECT panel = PropertiesRect();
      ShowWindow(properties_, SW_SHOW);
      const int top = panel.top + kPanelHeader + kPropertiesTitleHeight;
      MoveWindow(properties_, panel.left + 1, top,
                 std::max(1, static_cast<int>(panel.right - panel.left) - 2),
                 std::max(1, static_cast<int>(panel.bottom - top) - 1), TRUE);
    } else {
      ShowWindow(properties_, SW_HIDE);
    }
  }

  if (output_) {
    if (showOutput_) {
      const RECT panel = OutputRect();
      ShowWindow(output_, SW_SHOW);
      MoveWindow(output_, panel.left + 1, panel.top + kPanelHeader,
                 std::max(1, static_cast<int>(panel.right - panel.left) - 2),
                 std::max(1, static_cast<int>(panel.bottom - panel.top) -
                                 kPanelHeader - 1),
                 TRUE);
    } else {
      ShowWindow(output_, SW_HIDE);
    }
  }

  RECT viewClient{};
  if (viewport_) GetClientRect(viewport_, &viewClient);
  camera_.SetViewport(viewClient.right, viewClient.bottom);
  if (rendererReady_) renderer_.Resize(viewClient.right, viewClient.bottom);

  InvalidateRect(frame_, nullptr, FALSE);
}

int Studio::ToolbarTop() const { return 0; }

int Studio::TabTop() const {
  return (showStandardToolbar_ ? kToolbarHeight : 0) +
         (showToolsToolbar_ ? kToolbarHeight : 0);
}

int Studio::ContentTop() const {
  return TabTop() + kTabHeight + kQuickBarHeight;
}

RECT Studio::QuickBarRect() const {
  RECT client{};
  GetClientRect(frame_, &client);
  const int top = TabTop() + kTabHeight;
  return RECT{0, top, client.right, top + kQuickBarHeight};
}

int Studio::QuickBarAt(int x, int y) const {
  const RECT bar = QuickBarRect();
  if (y < bar.top || y >= bar.bottom) return -1;

  // The era's text strip: Tools, Insert, Fullscreen, Help..., Exit.
  const int widths[5] = {62, 64, 128, 66, 62};
  int left = 0;
  for (int i = 0; i < 5; ++i) {
    if (x >= left && x < left + widths[i]) return i;
    left += widths[i];
  }
  return -1;
}

RECT Studio::ToolbarRowRect(int row) const {
  int top = 0;
  if (showStandardToolbar_) {
    if (row == 0) {
      RECT client{};
      GetClientRect(frame_, &client);
      return RECT{0, top, client.right, top + kToolbarHeight};
    }
    top += kToolbarHeight;
  }
  if (showToolsToolbar_ && row == 1) {
    RECT client{};
    GetClientRect(frame_, &client);
    return RECT{0, top, client.right, top + kToolbarHeight};
  }
  return RECT{0, 0, 0, 0};
}

RECT Studio::TabStripRect() const {
  RECT client{};
  GetClientRect(frame_, &client);
  return RECT{0, TabTop(), client.right, TabTop() + kTabHeight};
}

RECT Studio::StatusRect() const {
  RECT client{};
  GetClientRect(frame_, &client);
  return RECT{0, client.bottom - kStatusHeight, client.right, client.bottom};
}

RECT Studio::ExplorerRect() const {
  if (!showExplorer_) return RECT{0, 0, 0, 0};

  RECT client{};
  GetClientRect(frame_, &client);
  const int top = ContentTop();
  const int height = client.bottom - kStatusHeight - top;
  return RECT{client.right - kDockWidth, top, client.right,
              top + static_cast<int>(height * 0.52f)};
}

RECT Studio::PropertiesRect() const {
  if (!showProperties_) return RECT{0, 0, 0, 0};

  RECT client{};
  GetClientRect(frame_, &client);
  const int top = showExplorer_ ? ExplorerRect().bottom : ContentTop();
  return RECT{client.right - kDockWidth, top, client.right,
              client.bottom - kStatusHeight};
}

RECT Studio::OutputRect() const {
  if (!showOutput_) return RECT{0, 0, 0, 0};

  RECT client{};
  GetClientRect(frame_, &client);
  const int bottom = client.bottom - kStatusHeight;
  const int left = showToolbox_ ? kToolboxWidth : 0;
  return RECT{left, bottom - kOutputHeight, client.right - kDockWidth, bottom};
}

RECT Studio::ViewportRect() const {
  RECT client{};
  GetClientRect(frame_, &client);
  const int bottom =
      client.bottom - kStatusHeight - (showOutput_ ? kOutputHeight : 0);
  const int left = showToolbox_ ? kToolboxWidth : 0;
  return RECT{left, ContentTop(), client.right - kDockWidth, bottom};
}

RECT Studio::ToolboxRect() const {
  if (!showToolbox_ || startPage_) return RECT{0, 0, 0, 0};

  RECT client{};
  GetClientRect(frame_, &client);
  return RECT{0, ContentTop(), kToolboxWidth, client.bottom - kStatusHeight};
}

RECT Studio::StartPageRect() const {
  RECT client{};
  GetClientRect(frame_, &client);
  const int bottom =
      client.bottom - kStatusHeight - (showOutput_ ? kOutputHeight : 0);
  const int left = (showToolbox_ && !startPage_) ? kToolboxWidth : 0;
  return RECT{left, ContentTop(), client.right - kDockWidth, bottom};
}

RECT Studio::StartPageCardRect(int index) const {
  const RECT area = StartPageRect();
  const int margin = 24;
  const int gap = 16;
  const int cardWidth = std::max(
      120, static_cast<int>(area.right - area.left - margin * 2 - gap * 2) /
               3);
  const int available =
      static_cast<int>(area.bottom - (area.top + 150) - 12);
  const int cardHeight = std::clamp(available, 150, 220);
  const int left = area.left + margin + index * (cardWidth + gap);
  return RECT{left, area.top + 150, left + cardWidth,
              area.top + 150 + cardHeight};
}

int Studio::ToolboxRowAt(int x, int y) const {
  if (!showToolbox_ || startPage_) return -1;

  const RECT panel = ToolboxRect();
  const POINT point{x, y};
  if (!PtInRect(&panel, point)) return -1;

  const int first = panel.top + kPanelHeader + 10;
  for (int i = 0; i < 4; ++i) {
    const RECT row{panel.left + 6, first + i * 36, panel.right - 6,
                   first + i * 36 + 32};
    if (PtInRect(&row, point)) return i;
  }
  return -1;
}

int Studio::StartPageCardAt(int x, int y) const {
  if (!startPage_) return -1;

  const POINT point{x, y};
  for (int i = 0; i < 3; ++i) {
    const RECT card = StartPageCardRect(i);
    if (PtInRect(&card, point)) return i;
  }
  return -1;
}

void Studio::InsertPart(PartShape shape) {
  if (startPage_) ShowStartPage(false);

  Part part;
  part.shape = shape;
  part.collides = true;

  std::wstring label;
  switch (shape) {
    case PartShape::Sphere:
      label = L"Sphere";
      part.size = {4.0f, 4.0f, 4.0f};
      break;
    case PartShape::Cylinder:
      label = L"Cylinder";
      part.size = {2.0f, 4.0f, 2.0f};
      break;
    case PartShape::Wedge:
      label = L"Wedge";
      part.size = {4.0f, 2.0f, 4.0f};
      break;
    case PartShape::Cube:
    default:
      label = L"Part";
      part.size = {4.0f, 1.0f, 2.0f};
      break;
  }
  part.colour = {0.64f, 0.64f, 0.64f};

  // Where the camera is looking, dropped onto the build plane. The clamp keeps
  // the new brick over the baseplate rather than out in the sky.
  DirectX::XMFLOAT3 forward{};
  CameraForward(&forward);

  float distance = 24.0f;
  if (forward.y < -0.05f) distance = -eye_.y / forward.y;
  if (distance < 2.0f || distance > 120.0f) distance = 24.0f;

  part.position.x =
      std::clamp(eye_.x + forward.x * distance, -18.0f, 18.0f);
  part.position.z =
      std::clamp(eye_.z + forward.z * distance, -18.0f, 18.0f);
  part.position.y = part.size.y * 0.5f;
  part.name = UniquePartName(label);

  PushUndo();
  world_.AddPart(part);
  selected_ = world_.PartCount() - 1;
  RefreshAfterEdit();

  Log(L"Inserted " + label + L" at " + FormatVector(part.position) + L".");
}

std::string Studio::UniquePartName(const std::wstring& base) const {
  const std::string root = Narrow(base);
  std::string candidate = root;
  int suffix = 2;

  for (;;) {
    bool taken = false;
    for (const Part& part : world_.Parts()) {
      if (part.name == candidate) {
        taken = true;
        break;
      }
    }
    if (!taken) return candidate;

    candidate = root + " " + std::to_string(suffix++);
  }
}

void Studio::ShowStartPage(bool show) {
  if (startPage_ == show) return;

  startPage_ = show;
  hotCard_ = -1;

  if (menu_) {
    CheckMenuItem(menu_, kViewStartPage,
                  MF_BYCOMMAND | (show ? MF_CHECKED : MF_UNCHECKED));
  }

  if (show) {
    statusText_ = L"Start Page";
    Layout();
    UpdateStatus();
    return;
  }

  Layout();
  ShowProperties(selected_);
  if (viewport_) SetFocus(viewport_);
}

void Studio::ApplyTemplate(int index) {
  undoStack_.clear();
  redoStack_.clear();
  switch (index) {
    case 1:
      world_.BuildBaseplate({0.36f, 0.56f, 0.24f});
      break;
    case 2:
      world_.Clear();
      break;
    case 0:
    default:
      world_.BuildBaseplate();
      break;
  }

  placePath_.clear();
  placeName_ = L"Place" + std::to_wstring(++placeCounter_);
  selected_ = -1;
  startPage_ = false;
  hotCard_ = -1;

  PopulateExplorer();
  ShowProperties(-1);
  ResetCamera();
  SetPlaceTitle();
  Layout();
  InvalidateRect(frame_, nullptr, FALSE);

  if (menu_) {
    CheckMenuItem(menu_, kViewStartPage, MF_BYCOMMAND | MF_UNCHECKED);
  }

  if (viewport_) SetFocus(viewport_);

  const wchar_t* names[3] = {L"Baseplate", L"Grass Baseplate",
                             L"Empty Place"};
  Log(std::wstring(L"Started ") + names[std::clamp(index, 0, 2)] + L" as " +
      placeName_ + L".");
}

void Studio::PushUndo() {
  undoStack_.push_back({world_.Parts(), selected_});
  if (undoStack_.size() > 64) undoStack_.erase(undoStack_.begin());
  redoStack_.clear();
  UpdateEditMenu();
}

void Studio::Undo() {
  if (undoStack_.empty()) return;

  redoStack_.push_back({world_.Parts(), selected_});
  const Snapshot snapshot = undoStack_.back();
  undoStack_.pop_back();

  world_.ReplaceParts(snapshot.parts);
  selected_ = snapshot.selected;
  RefreshAfterEdit();
  Log(L"Undo.");
}

void Studio::Redo() {
  if (redoStack_.empty()) return;

  undoStack_.push_back({world_.Parts(), selected_});
  const Snapshot snapshot = redoStack_.back();
  redoStack_.pop_back();

  world_.ReplaceParts(snapshot.parts);
  selected_ = snapshot.selected;
  RefreshAfterEdit();
  Log(L"Redo.");
}

void Studio::RefreshAfterEdit() {
  if (selected_ >= world_.PartCount()) selected_ = world_.PartCount() - 1;

  PopulateExplorer();
  ShowProperties(selected_);
  SelectTreeItem(selected_);
  InvalidateRect(frame_, nullptr, FALSE);
  UpdateEditMenu();
}

void Studio::UpdateEditMenu() {
  if (!menu_) return;

  const bool hasSelection = selected_ >= 0 && selected_ < world_.PartCount();
  const auto set = [&](UINT id, bool enabled) {
    EnableMenuItem(menu_, id,
                   MF_BYCOMMAND | (enabled ? MF_ENABLED : MF_GRAYED));
  };

  set(kEditUndo, !undoStack_.empty());
  set(kEditRedo, !redoStack_.empty());
  set(kEditCut, hasSelection);
  set(kEditCopy, hasSelection);
  set(kEditPaste, hasClipboard_);
  set(kEditClear, hasSelection);
  set(kEditDuplicate, hasSelection);
}

void Studio::CopySelected() {
  if (selected_ < 0 || selected_ >= world_.PartCount()) return;

  clipboard_ = world_.Parts()[selected_];
  hasClipboard_ = true;
  UpdateEditMenu();

  std::wstring name = Widen(clipboard_.name);
  if (name.empty()) name = L"part";
  Log(L"Copied " + name + L".");
}

void Studio::CutSelected() {
  if (selected_ < 0 || selected_ >= world_.PartCount()) return;

  CopySelected();
  DeleteSelected();
}

void Studio::DeleteSelected() {
  if (selected_ < 0 || selected_ >= world_.PartCount()) return;

  std::wstring name = Widen(world_.Parts()[selected_].name);
  if (name.empty()) name = L"the selected part";

  PushUndo();
  world_.RemovePart(selected_);
  selected_ = -1;
  RefreshAfterEdit();

  Log(L"Deleted " + name + L".");
}

void Studio::PasteClipboard() {
  if (!hasClipboard_) return;

  Part part = clipboard_;
  part.position.x += 2.0f;
  part.position.z += 2.0f;
  part.name = UniquePartName(Widen(part.name));

  PushUndo();
  world_.AddPart(part);
  selected_ = world_.PartCount() - 1;
  RefreshAfterEdit();

  Log(L"Pasted " + Widen(part.name) + L".");
}

void Studio::DuplicateSelected() {
  if (selected_ < 0 || selected_ >= world_.PartCount()) return;

  Part copy = world_.Parts()[selected_];
  copy.position.x += 2.0f;
  copy.position.z += 2.0f;
  copy.name = UniquePartName(Widen(copy.name));

  PushUndo();
  world_.AddPart(copy);
  selected_ = world_.PartCount() - 1;
  RefreshAfterEdit();

  Log(L"Duplicated " + Widen(copy.name) + L".");
}

bool Studio::ProjectToScreen(const DirectX::XMFLOAT3& point, int* x,
                             int* y) const {
  if (!viewport_) return false;

  RECT client{};
  GetClientRect(viewport_, &client);
  if (client.right <= 0 || client.bottom <= 0) return false;

  const DirectX::XMVECTOR clip = DirectX::XMVector4Transform(
      DirectX::XMVectorSet(point.x, point.y, point.z, 1.0f),
      camera_.ViewProjection());
  const float w = DirectX::XMVectorGetW(clip);
  if (w <= 0.0001f) return false;

  const float ndcX = DirectX::XMVectorGetX(clip) / w;
  const float ndcY = DirectX::XMVectorGetY(clip) / w;

  *x = static_cast<int>((ndcX * 0.5f + 0.5f) * client.right);
  *y = static_cast<int>((1.0f - (ndcY * 0.5f + 0.5f)) * client.bottom);
  return true;
}

bool Studio::ScreenToGround(int x, int y, float planeY,
                            DirectX::XMFLOAT3* result) const {
  if (!viewport_) return false;

  RECT client{};
  GetClientRect(viewport_, &client);
  if (client.right <= 0 || client.bottom <= 0) return false;

  const float ndcX = (2.0f * static_cast<float>(x) /
                      static_cast<float>(client.right)) -
                     1.0f;
  const float ndcY = 1.0f - (2.0f * static_cast<float>(y) /
                             static_cast<float>(client.bottom));

  const DirectX::XMMATRIX inverse =
      DirectX::XMMatrixInverse(nullptr, camera_.ViewProjection());
  const DirectX::XMVECTOR nearPoint = DirectX::XMVector3TransformCoord(
      DirectX::XMVectorSet(ndcX, ndcY, 0.0f, 1.0f), inverse);
  const DirectX::XMVECTOR farPoint = DirectX::XMVector3TransformCoord(
      DirectX::XMVectorSet(ndcX, ndcY, 1.0f, 1.0f), inverse);
  const DirectX::XMVECTOR direction = DirectX::XMVector3Normalize(
      DirectX::XMVectorSubtract(farPoint, nearPoint));

  const float step = DirectX::XMVectorGetY(direction);
  if (std::fabs(step) < 1.0e-5f) return false;

  const float t = (planeY - DirectX::XMVectorGetY(nearPoint)) / step;
  if (t < 0.0f) return false;

  DirectX::XMStoreFloat3(
      result, DirectX::XMVectorAdd(
                  nearPoint, DirectX::XMVectorScale(direction, t)));
  return true;
}

int Studio::HandleAt(int x, int y) const {
  if (selected_ < 0 || selected_ >= world_.PartCount()) return -1;
  if (!viewport_) return -1;

  RECT client{};
  GetClientRect(viewport_, &client);
  if (client.right <= 0 || client.bottom <= 0) return -1;

  const float ndcX =
      (2.0f * static_cast<float>(x) / static_cast<float>(client.right)) - 1.0f;
  const float ndcY =
      1.0f - (2.0f * static_cast<float>(y) / static_cast<float>(client.bottom));

  const DirectX::XMMATRIX inverse =
      DirectX::XMMatrixInverse(nullptr, camera_.ViewProjection());
  const DirectX::XMVECTOR nearPoint = DirectX::XMVector3TransformCoord(
      DirectX::XMVectorSet(ndcX, ndcY, 0.0f, 1.0f), inverse);
  const DirectX::XMVECTOR farPoint = DirectX::XMVector3TransformCoord(
      DirectX::XMVectorSet(ndcX, ndcY, 1.0f, 1.0f), inverse);
  const DirectX::XMVECTOR ray = DirectX::XMVector3Normalize(
      DirectX::XMVectorSubtract(farPoint, nearPoint));

  const Part& part = world_.Parts()[selected_];
  const DirectX::XMMATRIX rotation = part.RotationMatrix();
  const float hx = part.size.x * 0.5f;
  const float hy = part.size.y * 0.5f;
  const float hz = part.size.z * 0.5f;

  int bestCorner = -1;
  float bestDistance = 0.0f;

  for (int corner = 0; corner < 8; ++corner) {
    const DirectX::XMFLOAT3 offset{(corner & 1) ? hx : -hx,
                                   (corner & 2) ? hy : -hy,
                                   (corner & 4) ? hz : -hz};
    const DirectX::XMVECTOR turned = DirectX::XMVector3TransformCoord(
        DirectX::XMLoadFloat3(&offset), rotation);
    const DirectX::XMVECTOR world = DirectX::XMVectorAdd(
        turned, DirectX::XMLoadFloat3(&part.position));

    const DirectX::XMVECTOR toCorner =
        DirectX::XMVectorSubtract(world, nearPoint);
    const float along = DirectX::XMVectorGetX(
        DirectX::XMVector3Dot(toCorner, ray));
    if (along <= 0.0f) continue;

    const DirectX::XMVECTOR closest = DirectX::XMVectorAdd(
        nearPoint, DirectX::XMVectorScale(ray, along));
    const float distance = DirectX::XMVectorGetX(DirectX::XMVector3Length(
        DirectX::XMVectorSubtract(world, closest)));

    if (bestCorner < 0 || distance < bestDistance) {
      bestCorner = corner;
      bestDistance = distance;
    }
  }

  // Two studs is roughly the generous grab radius the era's handles had.
  return bestDistance <= 2.0f ? bestCorner : -1;
}

void Studio::ApplyMove(int mouseX, int mouseY) {
  Part* part = world_.MutablePart(selected_);
  if (!part) return;

  if ((GetKeyState(VK_SHIFT) & 0x8000) != 0) {
    const float delta =
        static_cast<float>(mouseY - dragStartMouse_.y) * 0.15f;
    part->position.y = dragStartPosition_.y - delta;
    const float minimum = part->size.y * 0.5f;
    if (part->position.y < minimum) part->position.y = minimum;
  } else {
    DirectX::XMFLOAT3 ground{};
    if (!ScreenToGround(mouseX, mouseY, dragStartPosition_.y, &ground)) return;

    part->position.x =
        dragStartPosition_.x + (ground.x - dragGroundStart_.x);
    part->position.z =
        dragStartPosition_.z + (ground.z - dragGroundStart_.z);
  }

  UpdateSelectionOutline();
  InvalidateRect(viewport_, nullptr, FALSE);
}

void Studio::ApplyResize(int mouseX, int mouseY) {
  Part* part = world_.MutablePart(selected_);
  if (!part) return;

  const bool positiveX = (dragHandle_ & 1) != 0;
  const bool positiveZ = (dragHandle_ & 4) != 0;

  const float fixedX =
      dragStartPosition_.x + (positiveX ? -0.5f : 0.5f) * dragStartSize_.x;
  const float fixedZ =
      dragStartPosition_.z + (positiveZ ? -0.5f : 0.5f) * dragStartSize_.z;

  DirectX::XMFLOAT3 ground{};
  if (!ScreenToGround(mouseX, mouseY, dragStartPosition_.y, &ground)) return;

  const float sizeX = std::max(1.0f, std::fabs(ground.x - fixedX));
  const float sizeZ = std::max(1.0f, std::fabs(ground.z - fixedZ));

  part->size.x = sizeX;
  part->size.z = sizeZ;
  part->position.x = (ground.x + fixedX) * 0.5f;
  part->position.z = (ground.z + fixedZ) * 0.5f;

  UpdateSelectionOutline();
  InvalidateRect(viewport_, nullptr, FALSE);
}

void Studio::DrawToolbox(HDC dc, const RECT& panel) {
  FillRect(dc, &panel, GetSysColorBrush(COLOR_3DFACE));
  DrawPanelHeader(dc, panel, L"Toolbox");

  SetBkMode(dc, TRANSPARENT);
  HGDIOBJ previousFont = SelectObject(dc, font_);

  const wchar_t* labels[4] = {L"Block", L"Sphere", L"Cylinder", L"Wedge"};
  const wchar_t* iconNames[4] = {L"part", L"sphere", L"cylinder", L"wedge"};

  HDC iconDc = CreateCompatibleDC(dc);
  const int first = panel.top + kPanelHeader + 10;

  for (int i = 0; i < 4; ++i) {
    RECT row{panel.left + 6, first + i * 36, panel.right - 6,
             first + i * 36 + 32};

    if (i == hotToolboxRow_) {
      FillRect(dc, &row, GetSysColorBrush(COLOR_HIGHLIGHT));
    }

    const Icon* icon = icons_.Find(iconNames[i]);
    if (icon && icon->bitmap) {
      HGDIOBJ previous = SelectObject(iconDc, icon->bitmap);
      BLENDFUNCTION blend{};
      blend.BlendOp = AC_SRC_OVER;
      blend.SourceConstantAlpha = 255;
      blend.AlphaFormat = AC_SRC_ALPHA;
      AlphaBlend(dc, row.left + 5, row.top + 4, icon->width, icon->height,
                 iconDc, 0, 0, icon->width, icon->height, blend);
      SelectObject(iconDc, previous);
    }

    SetTextColor(dc, i == hotToolboxRow_ ? GetSysColor(COLOR_HIGHLIGHTTEXT)
                                         : GetSysColor(COLOR_BTNTEXT));
    RECT text{row.left + 38, row.top, row.right - 4, row.bottom};
    DrawTextW(dc, labels[i], -1, &text, DT_SINGLELINE | DT_VCENTER | DT_LEFT);
  }

  DeleteDC(iconDc);

  SetTextColor(dc, GetSysColor(COLOR_GRAYTEXT));
  RECT note{panel.left + 10, first + 4 * 36 + 14, panel.right - 10,
            panel.bottom - 8};
  DrawTextW(dc, L"Click an object to add it to the place.", -1, &note,
            DT_WORDBREAK);

  SelectObject(dc, previousFont);
}

void Studio::DrawStartPage(HDC dc, const RECT& area) {
  FillRect(dc, &area, GetSysColorBrush(COLOR_WINDOW));

  RECT banner{area.left, area.top, area.right, area.top + 48};
  FillRect(dc, &banner, GetSysColorBrush(COLOR_3DFACE));
  RECT bannerLine{area.left, banner.bottom - 1, area.right, banner.bottom};
  FillRect(dc, &bannerLine, GetSysColorBrush(COLOR_3DSHADOW));

  SetBkMode(dc, TRANSPARENT);
  SetTextColor(dc, GetSysColor(COLOR_BTNTEXT));

  HGDIOBJ previous = SelectObject(dc, boldFont_);
  RECT bannerTitle{area.left + 18, banner.top, area.left + 220, banner.bottom};
  DrawTextW(dc, L"Start Page", -1, &bannerTitle,
            DT_SINGLELINE | DT_VCENTER | DT_LEFT);
  SelectObject(dc, font_);

  const std::wstring version =
      std::wstring(L"FieldBrik Studio ") + kClientVersion;
  RECT bannerVersion{area.right - 230, banner.top, area.right - 18,
                     banner.bottom};
  DrawTextW(dc, version.c_str(), -1, &bannerVersion,
            DT_SINGLELINE | DT_VCENTER | DT_RIGHT);

  SelectObject(dc, boldFont_);
  RECT title{area.left + 24, area.top + 64, area.right - 24, area.top + 92};
  DrawTextW(dc, L"Welcome to FieldBrik Studio", -1, &title,
            DT_SINGLELINE | DT_LEFT);
  SelectObject(dc, font_);

  SetTextColor(dc, GetSysColor(COLOR_GRAYTEXT));
  RECT subtitle{area.left + 24, area.top + 92, area.right - 24,
                area.top + 116};
  DrawTextW(dc,
            L"Choose a place to start. Every template is built on this machine.",
            -1, &subtitle, DT_SINGLELINE | DT_LEFT | DT_END_ELLIPSIS);

  const wchar_t* names[3] = {L"Baseplate", L"Grass Baseplate", L"Empty Place"};
  const wchar_t* descriptions[3] = {
      L"A small grey baseplate, forty studs across. The usual place to start.",
      L"The same baseplate in grass green, for outdoor places.",
      L"No parts at all. Start from nothing."};

  for (int i = 0; i < 3; ++i) {
    const RECT card = StartPageCardRect(i);
    const bool hot = i == hotCard_;

    FillRect(dc, &card, GetSysColorBrush(COLOR_WINDOW));
    HBRUSH border = CreateSolidBrush(
        hot ? GetSysColor(COLOR_HIGHLIGHT) : GetSysColor(COLOR_3DSHADOW));
    FrameRect(dc, &card, border);
    DeleteObject(border);

    RECT preview{card.left + 1, card.top + 1, card.right - 1, card.top + 118};
    HBRUSH sky = CreateSolidBrush(RGB(205, 224, 240));
    FillRect(dc, &preview, sky);
    DeleteObject(sky);

    if (i == 2) {
      HPEN pen = CreatePen(PS_DOT, 1, RGB(120, 120, 120));
      HGDIOBJ oldPen = SelectObject(dc, pen);
      HGDIOBJ oldBrush = SelectObject(dc, GetStockObject(NULL_BRUSH));
      POINT box[4] = {{preview.left + 24, preview.top + 62},
                      {preview.right - 40, preview.top + 44},
                      {preview.right - 30, preview.top + 72},
                      {preview.left + 34, preview.top + 90}};
      Polygon(dc, box, 4);
      SelectObject(dc, oldBrush);
      SelectObject(dc, oldPen);
      DeleteObject(pen);
    } else {
      const COLORREF top = i == 1 ? RGB(108, 154, 74) : RGB(184, 184, 184);
      const COLORREF side = i == 1 ? RGB(76, 116, 50) : RGB(136, 136, 136);
      POINT slab[4] = {{preview.left + 24, preview.top + 62},
                       {preview.right - 40, preview.top + 44},
                       {preview.right - 30, preview.top + 66},
                       {preview.left + 34, preview.top + 84}};
      HBRUSH brush = CreateSolidBrush(top);
      HPEN pen = CreatePen(PS_SOLID, 1, side);
      HGDIOBJ oldBrush = SelectObject(dc, brush);
      HGDIOBJ oldPen = SelectObject(dc, pen);
      Polygon(dc, slab, 4);
      MoveToEx(dc, slab[3].x, slab[3].y, nullptr);
      LineTo(dc, slab[2].x, slab[2].y);
      SelectObject(dc, oldBrush);
      SelectObject(dc, oldPen);
      DeleteObject(brush);
      DeleteObject(pen);
    }

    SetTextColor(dc, GetSysColor(COLOR_BTNTEXT));
    HGDIOBJ oldFont = SelectObject(dc, boldFont_);
    RECT name{card.left + 10, card.top + 126, card.right - 10, card.top + 148};
    DrawTextW(dc, names[i], -1, &name,
              DT_SINGLELINE | DT_LEFT | DT_END_ELLIPSIS);
    SelectObject(dc, oldFont);

    SetTextColor(dc, GetSysColor(COLOR_GRAYTEXT));
    RECT description{card.left + 10, card.top + 150, card.right - 10,
                     card.bottom - 8};
    DrawTextW(dc, descriptions[i], -1, &description, DT_WORDBREAK | DT_LEFT);
  }

  SetTextColor(dc, GetSysColor(COLOR_GRAYTEXT));
  RECT footer{area.left + 24, area.bottom - 26, area.right - 24,
              area.bottom - 8};
  DrawTextW(dc,
            L"Starting a template replaces the open place; nothing can be "
            L"saved yet.",
            -1, &footer, DT_SINGLELINE | DT_LEFT | DT_END_ELLIPSIS);

  SelectObject(dc, previous);
}


int Studio::ToolbarButtonAt(int x, int y, int* row) const {
  const auto hit = [&](int top, const ToolButton* buttons, int count) {
    int left = 4;
    for (int i = 0; i < count; ++i) {
      const RECT button{left, top + 2, left + kButtonSize, top + 2 + kButtonSize};
      const POINT point{x, y};
      if (buttons[i].enabled && PtInRect(&button, point)) return i;
      left = button.right + kButtonGap;
      if (buttons[i].separatorAfter) left += 8;
    }
    return -1;
  };

  int top = 0;
  if (showStandardToolbar_) {
    const int found = hit(top, kStandardButtons, kStandardCount);
    if (found >= 0) {
      *row = 0;
      return found;
    }
    top += kToolbarHeight;
  }
  if (showToolsToolbar_) {
    const int found = hit(top, kToolsButtons, kToolsCount);
    if (found >= 0) {
      *row = 1;
      return found;
    }
  }
  return -1;
}

int Studio::TabAt(int x, int y) const {
  const RECT strip = TabStripRect();
  if (y < strip.top + 3 || y >= strip.bottom) return -1;
  if (x >= 6 && x < 100) return 0;
  if (x >= 102 && x < 242) return 1;
  return -1;
}

void Studio::LoadStartingPlace(const std::wstring& path) {
  Log(std::wstring(L"FieldBrik Studio ") + kClientVersion + L" started.");

  if (!path.empty()) {
    LoadPlace(path);
    if (!placePath_.empty()) return;
  }

  world_.BuildBaseplate();
  placePath_.clear();
  placeName_ = L"Place1";
  placeCounter_ = 1;
  selected_ = -1;
  PopulateExplorer();
  ShowProperties(-1);

  Log(L"New place Place1 with a baseplate.");
}

void Studio::NewPlace() {
  undoStack_.clear();
  redoStack_.clear();
  world_.BuildBaseplate();
  placePath_.clear();
  placeName_ = L"Place" + std::to_wstring(++placeCounter_);
  selected_ = -1;
  startPage_ = false;
  if (menu_) {
    CheckMenuItem(menu_, kViewStartPage, MF_BYCOMMAND | MF_UNCHECKED);
  }
  PopulateExplorer();
  ShowProperties(-1);
  ResetCamera();
  SetPlaceTitle();
  Layout();
  InvalidateRect(frame_, nullptr, FALSE);
  if (viewport_) SetFocus(viewport_);
  Log(L"New place " + placeName_ + L" with a baseplate.");
}

void Studio::OpenPlace() {
  wchar_t path[MAX_PATH] = L"";
  OPENFILENAMEW dialog{};
  dialog.lStructSize = sizeof(dialog);
  dialog.hwndOwner = frame_;
  dialog.lpstrFilter =
      L"FieldBrik and Roblox places (*.fbrx;*.rbxl;*.rbxlx)\0"
      L"*.fbrx;*.rbxl;*.rbxlx\0All files\0*.*\0\0";
  dialog.lpstrFile = path;
  dialog.nMaxFile = MAX_PATH;
  dialog.lpstrTitle = L"Open Place";
  dialog.Flags = OFN_FILEMUSTEXIST | OFN_PATHMUSTEXIST | OFN_HIDEREADONLY;

  if (GetOpenFileNameW(&dialog)) LoadPlace(path);
}

void Studio::SavePlace() {
  if (placePath_.empty()) {
    SavePlaceAs();
    return;
  }

  SaveTo(placePath_);
}

void Studio::SavePlaceAs() {
  std::wstring stem = placeName_;
  const size_t dot = stem.find_last_of(L'.');
  if (dot != std::wstring::npos && dot > 0) stem = stem.substr(0, dot);
  if (stem.empty()) stem = L"Place1";

  const std::wstring suggested = stem + L".fbrx";
  wchar_t path[MAX_PATH] = L"";
  wcsncpy_s(path, suggested.c_str(), _TRUNCATE);

  OPENFILENAMEW dialog{};
  dialog.lStructSize = sizeof(dialog);
  dialog.hwndOwner = frame_;
  dialog.lpstrFilter =
      L"FieldBrik place (*.fbrx)\0*.fbrx\0Roblox XML place (*.rbxl;*.rbxlx)\0"
      L"*.rbxl;*.rbxlx\0All files\0*.*\0\0";
  dialog.lpstrFile = path;
  dialog.nMaxFile = MAX_PATH;
  dialog.lpstrTitle = L"Save Place As";
  dialog.lpstrDefExt = L"fbrx";
  dialog.Flags = OFN_OVERWRITEPROMPT | OFN_PATHMUSTEXIST | OFN_HIDEREADONLY;

  if (GetSaveFileNameW(&dialog)) SaveTo(path);
}

bool Studio::SaveTo(const std::wstring& path) {
  std::string error;
  if (!SavePlaceFile(Narrow(path), world_.Parts(), error)) {
    const std::wstring message =
        L"The place could not be saved:\n\n" + Widen(error);
    MessageBoxW(frame_, message.c_str(), L"FieldBrik Studio",
                MB_OK | MB_ICONWARNING);
    Log(L"Could not save " + FileNameOf(path) + L": " + Widen(error));
    return false;
  }

  placePath_ = path;
  placeName_ = FileNameOf(path);
  SetPlaceTitle();
  AddRecent(path);
  InvalidateRect(frame_, nullptr, FALSE);
  Log(L"Saved " + placeName_ + L" (" +
      std::to_wstring(world_.PartCount()) + L" parts).");
  return true;
}

void Studio::LoadPlace(const std::wstring& path) {
  std::string error;
  if (!world_.Load(Narrow(path), error)) {
    const std::wstring message =
        L"The place could not be opened:\n\n" + Widen(error);
    MessageBoxW(frame_, message.c_str(), L"FieldBrik Studio",
                MB_OK | MB_ICONWARNING);
    Log(L"Could not open " + FileNameOf(path) + L": " + Widen(error));
    return;
  }

  undoStack_.clear();
  redoStack_.clear();
  placePath_ = path;
  placeName_ = FileNameOf(path);
  selected_ = -1;
  PopulateExplorer();
  ShowProperties(-1);
  ResetCamera();
  SetPlaceTitle();
  InvalidateRect(frame_, nullptr, FALSE);
  AddRecent(path);
  startPage_ = false;
  if (menu_) {
    CheckMenuItem(menu_, kViewStartPage, MF_BYCOMMAND | MF_UNCHECKED);
  }
  Layout();
  if (viewport_) SetFocus(viewport_);

  Log(L"Opened " + placeName_ + L" (" + std::to_wstring(world_.PartCount()) +
      L" parts).");
}

void Studio::PopulateExplorer() {
  if (!explorer_) return;

  populating_ = true;
  SendMessageW(explorer_, WM_SETREDRAW, FALSE, 0);
  TreeView_DeleteAllItems(explorer_);

  TVINSERTSTRUCTW insert{};
  insert.hParent = TVI_ROOT;
  insert.hInsertAfter = TVI_LAST;
  insert.item.mask = TVIF_TEXT | TVIF_PARAM;

  wchar_t workspace[] = L"Workspace";
  insert.item.pszText = workspace;
  insert.item.lParam = 0;
  HTREEITEM root = TreeView_InsertItem(explorer_, &insert);

  const std::vector<Part>& parts = world_.Parts();
  for (int i = 0; i < static_cast<int>(parts.size()); ++i) {
    std::wstring label = Widen(parts[i].name);
    if (label.empty()) label = L"Part";

    insert.hParent = root;
    insert.item.pszText = label.data();
    insert.item.lParam = i + 1;
    TreeView_InsertItem(explorer_, &insert);
  }

  // The services the 2008 Explorer always showed, whether or not this build has
  // anything behind them yet.
  for (const wchar_t* service : {L"Players", L"Lighting", L"StarterPack",
                                 L"Soundscape"}) {
    insert.hParent = TVI_ROOT;
    insert.item.pszText = const_cast<wchar_t*>(service);
    insert.item.lParam = 0;
    TreeView_InsertItem(explorer_, &insert);
  }

  TreeView_Expand(explorer_, root, TVE_EXPAND);
  SendMessageW(explorer_, WM_SETREDRAW, TRUE, 0);
  InvalidateRect(explorer_, nullptr, TRUE);
  populating_ = false;
}

void Studio::SelectTreeItem(int index) {
  if (!explorer_) return;

  const HTREEITEM root = TreeView_GetRoot(explorer_);
  if (!root) return;

  syncing_ = true;
  if (index < 0) {
    TreeView_SelectItem(explorer_, root);
    syncing_ = false;
    return;
  }

  HTREEITEM child = TreeView_GetChild(explorer_, root);
  int current = 0;
  while (child) {
    if (current == index) {
      TreeView_SelectItem(explorer_, child);
      TreeView_EnsureVisible(explorer_, child);
      break;
    }
    child = TreeView_GetNextSibling(explorer_, child);
    ++current;
  }
  syncing_ = false;
}

void Studio::ShowProperties(int index) {
  selected_ = index;
  if (properties_) ListView_DeleteAllItems(properties_);
  propertyHeaders_.clear();

  const std::vector<Part>& parts = world_.Parts();
  if (index < 0 || index >= static_cast<int>(parts.size())) {
    propertiesTitle_.clear();
    statusText_ = L"Ready";
    if (frame_) InvalidateRect(frame_, nullptr, FALSE);
    UpdateSelectionOutline();
    UpdateStatus();
    UpdateEditMenu();
    return;
  }

  const Part& part = parts[index];
  std::wstring name = Widen(part.name);
  if (name.empty()) name = L"Part";

  propertiesTitle_ = L"Part \"" + name + L"\"";

  AddPropertyRow(L"Appearance", L"", true);
  AddPropertyRow(L"Colour", ColourHex(part.colour));
  AddPropertyRow(L"Shape", ShapeName(part.shape));

  AddPropertyRow(L"Data", L"", true);
  AddPropertyRow(L"Name", name);
  AddPropertyRow(L"Parent", L"Workspace");
  AddPropertyRow(L"Position", FormatVector(part.position));
  AddPropertyRow(L"Size", FormatVector(part.size));
  AddPropertyRow(L"Rotation", part.hasRotationMatrix
                                  ? L"set by the place file"
                                  : FormatVector(part.rotationDegrees));
  AddPropertyRow(L"CanCollide", part.collides ? L"true" : L"false");

  if (!part.textureId.empty()) {
    AddPropertyRow(L"TextureID", Widen(part.textureId));
  }

  int decals = 0;
  for (const std::string& decal : part.faceTextures) {
    if (!decal.empty()) ++decals;
  }
  if (decals > 0) AddPropertyRow(L"Face decals", std::to_wstring(decals));

  statusText_ = L"Selected " + name;
  if (frame_) InvalidateRect(frame_, nullptr, FALSE);
  UpdateSelectionOutline();
  UpdateStatus();
  UpdateEditMenu();
}

void Studio::AddPropertyRow(const wchar_t* name, const std::wstring& value,
                            bool header) {
  if (!properties_) return;

  LVITEMW item{};
  item.mask = LVIF_TEXT;
  item.iItem = ListView_GetItemCount(properties_);
  item.iSubItem = 0;
  item.pszText = const_cast<wchar_t*>(name);

  const int row = ListView_InsertItem(properties_, &item);
  if (!header) {
    ListView_SetItemText(properties_, row, 1,
                         const_cast<wchar_t*>(value.c_str()));
  }
  propertyHeaders_.push_back(header);
}

void Studio::Log(const std::wstring& line) {
  if (!output_) return;

  const std::wstring text = line + L"\r\n";
  const LRESULT length = SendMessageW(output_, WM_GETTEXTLENGTH, 0, 0);
  SendMessageW(output_, EM_SETSEL, static_cast<WPARAM>(length),
               static_cast<LPARAM>(length));
  SendMessageW(output_, EM_REPLACESEL, FALSE,
               reinterpret_cast<LPARAM>(text.c_str()));
}

void Studio::UpdateSelectionOutline() {
  selectionOutline_.clear();

  const std::vector<Part>& parts = world_.Parts();
  if (selected_ < 0 || selected_ >= static_cast<int>(parts.size())) return;

  const Part& part = parts[selected_];
  const DirectX::XMMATRIX rotation = part.RotationMatrix();
  DirectX::XMFLOAT3X3 matrix;
  DirectX::XMStoreFloat3x3(&matrix, rotation);

  const float thickness = 0.10f;
  const float x = part.size.x * 0.5f;
  const float y = part.size.y * 0.5f;
  const float z = part.size.z * 0.5f;

  const auto edge = [&](DirectX::XMFLOAT3 offset, DirectX::XMFLOAT3 size) {
    Part line;
    line.name = "Selection";
    line.size = size;
    line.colour = {0.22f, 0.46f, 1.0f};
    line.collides = false;
    line.hasRotationMatrix = true;
    line.rotationMatrix = matrix;

    const DirectX::XMVECTOR turned = DirectX::XMVector3TransformCoord(
        DirectX::XMLoadFloat3(&offset), rotation);
    DirectX::XMStoreFloat3(&line.position,
                           DirectX::XMVectorAdd(
                               turned, DirectX::XMLoadFloat3(&part.position)));
    selectionOutline_.push_back(line);
  };

  edge({0.0f, y, z}, {part.size.x + thickness, thickness, thickness});
  edge({0.0f, y, -z}, {part.size.x + thickness, thickness, thickness});
  edge({0.0f, -y, z}, {part.size.x + thickness, thickness, thickness});
  edge({0.0f, -y, -z}, {part.size.x + thickness, thickness, thickness});

  edge({x, 0.0f, z}, {thickness, part.size.y + thickness, thickness});
  edge({-x, 0.0f, z}, {thickness, part.size.y + thickness, thickness});
  edge({x, 0.0f, -z}, {thickness, part.size.y + thickness, thickness});
  edge({-x, 0.0f, -z}, {thickness, part.size.y + thickness, thickness});

  edge({x, y, 0.0f}, {thickness, thickness, part.size.z + thickness});
  edge({-x, y, 0.0f}, {thickness, thickness, part.size.z + thickness});
  edge({x, -y, 0.0f}, {thickness, thickness, part.size.z + thickness});
  edge({-x, -y, 0.0f}, {thickness, thickness, part.size.z + thickness});

  // The white handles on the eight corners. The era's selection had them
  // floating unlit; a small sphere from the same mesh pass reads the same way.
  for (int corner = 0; corner < 8; ++corner) {
    const DirectX::XMFLOAT3 offset{
        (corner & 1) ? x : -x, (corner & 2) ? y : -y,
        (corner & 4) ? z : -z};

    Part handle;
    handle.name = "Selection handle";
    handle.shape = PartShape::Sphere;
    handle.size = {0.7f, 0.7f, 0.7f};
    handle.colour = {1.0f, 1.0f, 1.0f};
    handle.collides = false;

    const DirectX::XMVECTOR turned = DirectX::XMVector3TransformCoord(
        DirectX::XMLoadFloat3(&offset), rotation);
    DirectX::XMStoreFloat3(&handle.position,
                           DirectX::XMVectorAdd(
                               turned, DirectX::XMLoadFloat3(&part.position)));
    selectionOutline_.push_back(handle);
  }
}

int Studio::PickPart(int x, int y) const {
  if (!viewport_) return -1;

  RECT client{};
  GetClientRect(viewport_, &client);
  if (client.right <= 0 || client.bottom <= 0) return -1;

  const float ndcX = (2.0f * static_cast<float>(x) /
                      static_cast<float>(client.right)) -
                     1.0f;
  const float ndcY = 1.0f - (2.0f * static_cast<float>(y) /
                             static_cast<float>(client.bottom));

  const DirectX::XMMATRIX inverse =
      DirectX::XMMatrixInverse(nullptr, camera_.ViewProjection());
  const DirectX::XMVECTOR nearPoint = DirectX::XMVector3TransformCoord(
      DirectX::XMVectorSet(ndcX, ndcY, 0.0f, 1.0f), inverse);
  const DirectX::XMVECTOR farPoint = DirectX::XMVector3TransformCoord(
      DirectX::XMVectorSet(ndcX, ndcY, 1.0f, 1.0f), inverse);
  const DirectX::XMVECTOR direction = DirectX::XMVector3Normalize(
      DirectX::XMVectorSubtract(farPoint, nearPoint));

  int best = -1;
  float bestDistance = FLT_MAX;

  const std::vector<Part>& parts = world_.Parts();
  for (int i = 0; i < static_cast<int>(parts.size()); ++i) {
    if (!parts[i].collides) continue;

    const DirectX::XMFLOAT4X4 modelValues = parts[i].ModelMatrix();
    const DirectX::XMMATRIX model = DirectX::XMLoadFloat4x4(&modelValues);
    const DirectX::XMMATRIX inverseModel =
        DirectX::XMMatrixInverse(nullptr, model);

    const DirectX::XMVECTOR localOrigin =
        DirectX::XMVector3TransformCoord(nearPoint, inverseModel);
    const DirectX::XMVECTOR localDirection =
        DirectX::XMVector3TransformNormal(direction, inverseModel);

    // The model matrix folds the size in, so every part is tested against the
    // unit cube. The distance stays in studs because the ray still advances one
    // stud per unit of t in world space.
    float tMin = 0.0f;
    float tMax = bestDistance;
    bool hit = true;

    for (int axis = 0; axis < 3 && hit; ++axis) {
      const float origin =
          DirectX::XMVectorGetByIndex(localOrigin, axis);
      const float step =
          DirectX::XMVectorGetByIndex(localDirection, axis);

      if (std::fabs(step) < 1.0e-6f) {
        if (origin < -0.5f || origin > 0.5f) hit = false;
        continue;
      }

      float tNear = (-0.5f - origin) / step;
      float tFar = (0.5f - origin) / step;
      if (tNear > tFar) std::swap(tNear, tFar);

      tMin = std::max(tMin, tNear);
      tMax = std::min(tMax, tFar);
      if (tMin > tMax) hit = false;
    }

    if (hit && tMin > 0.0f && tMin < bestDistance) {
      best = i;
      bestDistance = tMin;
    }
  }

  return best;
}

void Studio::ResetCamera() {
  const std::vector<Part>& parts = world_.Parts();
  if (parts.empty()) {
    eye_ = {24.0f, 18.0f, 24.0f};
    yaw_ = 135.0f;
    pitch_ = 18.0f;
    camera_.SetFreePose(eye_, yaw_, pitch_);
    return;
  }

  DirectX::XMFLOAT3 low{FLT_MAX, FLT_MAX, FLT_MAX};
  DirectX::XMFLOAT3 high{-FLT_MAX, -FLT_MAX, -FLT_MAX};

  for (const Part& part : parts) {
    low.x = std::min(low.x, part.position.x - part.size.x * 0.5f);
    low.y = std::min(low.y, part.position.y - part.size.y * 0.5f);
    low.z = std::min(low.z, part.position.z - part.size.z * 0.5f);
    high.x = std::max(high.x, part.position.x + part.size.x * 0.5f);
    high.y = std::max(high.y, part.position.y + part.size.y * 0.5f);
    high.z = std::max(high.z, part.position.z + part.size.z * 0.5f);
  }

  const DirectX::XMFLOAT3 centre{(low.x + high.x) * 0.5f,
                                 (low.y + high.y) * 0.5f,
                                 (low.z + high.z) * 0.5f};
  const float extent =
      std::max({high.x - low.x, high.y - low.y, high.z - low.z});
  const float distance = std::max(extent * 1.6f, 10.0f);

  eye_ = {centre.x + distance * 0.72f, centre.y + distance * 0.55f,
          centre.z + distance * 0.72f};
  yaw_ = 135.0f;

  // Point the camera at the middle of the place. The pitch has to be derived
  // from the eye, or the view skims over the baseplate and a new part lands at
  // the clamp instead of where the camera is looking.
  const float horizontal = distance * 0.72f * 1.41421356f;
  pitch_ = DirectX::XMConvertToDegrees(
      std::atan2(distance * 0.55f, horizontal));
  camera_.SetFreePose(eye_, yaw_, pitch_);
}

void Studio::CameraForward(DirectX::XMFLOAT3* forward) const {
  const float yaw = DirectX::XMConvertToRadians(yaw_);
  const float pitch = DirectX::XMConvertToRadians(pitch_);
  const float flat = std::cos(pitch);

  forward->x = -std::sin(yaw) * flat;
  forward->y = -std::sin(pitch);
  forward->z = std::cos(yaw) * flat;
}

void Studio::UpdateCamera(float deltaSeconds) {
  if (!frame_ || GetForegroundWindow() != frame_) return;

  const HWND focus = GetFocus();
  if (focus != viewport_ && focus != frame_) return;

  const auto down = [](int key) {
    return (GetAsyncKeyState(key) & 0x8000) != 0;
  };

  DirectX::XMFLOAT3 forward{};
  CameraForward(&forward);

  const float yaw = DirectX::XMConvertToRadians(yaw_);
  const DirectX::XMFLOAT3 right{-std::cos(yaw), 0.0f, -std::sin(yaw)};

  DirectX::XMFLOAT3 move{0.0f, 0.0f, 0.0f};
  if (down('W')) {
    move.x += forward.x;
    move.y += forward.y;
    move.z += forward.z;
  }
  if (down('S')) {
    move.x -= forward.x;
    move.y -= forward.y;
    move.z -= forward.z;
  }
  if (down('D')) {
    move.x += right.x;
    move.z += right.z;
  }
  if (down('A')) {
    move.x -= right.x;
    move.z -= right.z;
  }
  if (down('Q')) move.y -= 1.0f;
  if (down('E')) move.y += 1.0f;

  const float length =
      std::sqrt(move.x * move.x + move.y * move.y + move.z * move.z);
  if (length > 0.0f) {
    const float speed = down(VK_SHIFT) ? 55.0f : 18.0f;
    const float step = speed * deltaSeconds / length;
    eye_.x += move.x * step;
    eye_.y += move.y * step;
    eye_.z += move.z * step;
  }

  camera_.SetFreePose(eye_, yaw_, pitch_);
}

void Studio::Render() {
  if (startPage_) return;
  if (!rendererReady_ || !viewport_ || !frame_ || IsIconic(frame_)) return;

  RECT client{};
  GetClientRect(viewport_, &client);
  if (client.right <= 0 || client.bottom <= 0) return;

  camera_.SetViewport(client.right, client.bottom);

  const float clear[4] = {0.42f, 0.55f, 0.72f, 1.0f};
  renderer_.BeginFrame(clear);
  renderer_.DrawSky(camera_);
  renderer_.DrawParts(world_.Parts(), camera_, true);
  if (!selectionOutline_.empty()) {
    renderer_.DrawParts(selectionOutline_, camera_, false);
  }
  renderer_.EndFrame();
}

void Studio::DrawChrome(HDC dc, const RECT& client) {
  FillRect(dc, &client, GetSysColorBrush(COLOR_3DFACE));

  int top = 0;
  if (showStandardToolbar_) {
    DrawToolbarRow(dc, top, kStandardButtons, kStandardCount,
                   hotRow_ == 0 ? hotButton_ : -1);
    top += kToolbarHeight;
  }
  if (showToolsToolbar_) {
    DrawToolbarRow(dc, top, kToolsButtons, kToolsCount,
                   hotRow_ == 1 ? hotButton_ : -1);
  }

  DrawTabs(dc, TabStripRect());
  DrawQuickBar(dc, QuickBarRect());

  if (showToolbox_ && !startPage_) DrawToolbox(dc, ToolboxRect());
  if (startPage_) DrawStartPage(dc, StartPageRect());

  if (showExplorer_) DrawPanelHeader(dc, ExplorerRect(), L"Explorer");
  if (showProperties_) {
    const RECT panel = PropertiesRect();
    DrawPanelHeader(dc, panel, L"Properties");
    DrawPropertiesTitle(dc, panel);
  }
  if (showOutput_) DrawPanelHeader(dc, OutputRect(), L"Output");

  DrawStatusBar(dc, StatusRect());
}

void Studio::DrawTabs(HDC dc, const RECT& area) {
  FillRect(dc, &area, GetSysColorBrush(COLOR_3DFACE));

  SetBkMode(dc, TRANSPARENT);
  SetTextColor(dc, GetSysColor(COLOR_BTNTEXT));
  HGDIOBJ previous = SelectObject(dc, font_);

  RECT home{6, area.top + 3, 100, area.bottom};
  FillRect(dc, &home,
           GetSysColorBrush(startPage_ ? COLOR_WINDOW : COLOR_3DFACE));
  DrawEdge(dc, &home, startPage_ ? BDR_SUNKENOUTER : BDR_RAISEDINNER, BF_RECT);
  RECT homeText = home;
  DrawTextW(dc, L"FieldBrik", -1, &homeText,
            DT_SINGLELINE | DT_VCENTER | DT_CENTER);

  RECT place{102, area.top + 3, 242, area.bottom};
  FillRect(dc, &place,
           GetSysColorBrush(startPage_ ? COLOR_3DFACE : COLOR_WINDOW));
  HBRUSH border = CreateSolidBrush(GetSysColor(COLOR_3DSHADOW));
  FrameRect(dc, &place, border);
  DeleteObject(border);

  RECT placeText = place;
  placeText.left += 8;
  DrawTextW(dc, placeName_.c_str(), -1, &placeText,
            DT_SINGLELINE | DT_VCENTER | DT_LEFT);

  // The tab strip sits on the top edge of the viewport, so a line under it
  // separates the chrome from the world.
  RECT edge{area.left, area.bottom - 1, area.right, area.bottom};
  FillRect(dc, &edge, GetSysColorBrush(COLOR_3DSHADOW));

  SelectObject(dc, previous);
}

void Studio::DrawQuickBar(HDC dc, const RECT& area) {
  FillRect(dc, &area, GetSysColorBrush(COLOR_3DFACE));

  SetBkMode(dc, TRANSPARENT);
  SetTextColor(dc, GetSysColor(COLOR_BTNTEXT));
  HGDIOBJ previous = SelectObject(dc, font_);

  const wchar_t* labels[5] = {L"Tools", L"Insert", L"Fullscreen", L"Help...",
                              L"Exit"};
  const int widths[5] = {62, 64, 128, 66, 62};

  int left = 0;
  for (int i = 0; i < 5; ++i) {
    RECT button{left, area.top, left + widths[i], area.bottom - 1};
    FillRect(dc, &button, GetSysColorBrush(COLOR_3DFACE));
    DrawEdge(dc, &button, BDR_RAISEDINNER, BF_RECT);

    RECT text = button;
    text.left += 4;
    text.right -= 4;
    DrawTextW(dc, labels[i], -1, &text,
              DT_SINGLELINE | DT_VCENTER | DT_CENTER | DT_END_ELLIPSIS);

    left += widths[i];
  }

  RECT edge{area.left, area.bottom - 1, area.right, area.bottom};
  FillRect(dc, &edge, GetSysColorBrush(COLOR_3DSHADOW));

  SelectObject(dc, previous);
}

void Studio::ShowMenuPopup(int index) {
  if (!menu_) return;

  HMENU submenu = GetSubMenu(menu_, index);
  if (!submenu) return;

  POINT point{};
  GetCursorPos(&point);

  const int command =
      TrackPopupMenu(submenu, TPM_RETURNCMD | TPM_LEFTALIGN | TPM_TOPALIGN,
                     point.x, point.y, 0, frame_, nullptr);
  if (command) OnCommand(command);
}

void Studio::DrawToolbarRow(HDC dc, int top, const ToolButton* buttons,
                            int count, int hot) {
  RECT area{0, top, 0, top + kToolbarHeight};
  RECT client{};
  GetClientRect(frame_, &client);
  area.right = client.right;
  FillRect(dc, &area, GetSysColorBrush(COLOR_3DFACE));

  HDC icons = CreateCompatibleDC(dc);
  int left = 4;

  for (int i = 0; i < count; ++i) {
    RECT button{left, top + 2, left + kButtonSize, top + 2 + kButtonSize};

    if (i == hot && buttons[i].enabled) {
      DrawEdge(dc, &button, BDR_RAISEDINNER, BF_RECT);
    }

    const Icon* icon = icons_.Find(buttons[i].icon);
    if (icon && icon->bitmap) {
      HGDIOBJ previous = SelectObject(icons, icon->bitmap);

      BLENDFUNCTION blend{};
      blend.BlendOp = AC_SRC_OVER;
      blend.SourceConstantAlpha = buttons[i].enabled ? 255 : 90;
      blend.AlphaFormat = AC_SRC_ALPHA;

      AlphaBlend(dc, button.left + (kButtonSize - icon->width) / 2,
                 button.top + (kButtonSize - icon->height) / 2, icon->width,
                 icon->height, icons, 0, 0, icon->width, icon->height, blend);

      SelectObject(icons, previous);
    }

    left = button.right + kButtonGap;
    if (buttons[i].separatorAfter) {
      HPEN shadow = CreatePen(PS_SOLID, 1, GetSysColor(COLOR_3DSHADOW));
      HPEN light = CreatePen(PS_SOLID, 1, GetSysColor(COLOR_3DHILIGHT));
      HGDIOBJ previous = SelectObject(dc, shadow);
      MoveToEx(dc, left + 2, top + 5, nullptr);
      LineTo(dc, left + 2, top + 25);
      SelectObject(dc, light);
      MoveToEx(dc, left + 3, top + 5, nullptr);
      LineTo(dc, left + 3, top + 25);
      SelectObject(dc, previous);
      DeleteObject(shadow);
      DeleteObject(light);
      left += 8;
    }
  }

  DeleteDC(icons);

  RECT edge{area.left, area.bottom - 1, area.right, area.bottom};
  FillRect(dc, &edge, GetSysColorBrush(COLOR_3DSHADOW));
}

void Studio::DrawPanelHeader(HDC dc, const RECT& panel,
                             const wchar_t* title) {
  RECT header{panel.left, panel.top, panel.right, panel.top + kPanelHeader};
  FillRect(dc, &header, GetSysColorBrush(COLOR_3DFACE));

  RECT top{header.left, header.top, header.right, header.top + 1};
  FillRect(dc, &top, GetSysColorBrush(COLOR_3DHILIGHT));

  RECT bottom{header.left, header.bottom - 1, header.right, header.bottom};
  FillRect(dc, &bottom, GetSysColorBrush(COLOR_3DSHADOW));

  SetBkMode(dc, TRANSPARENT);
  SetTextColor(dc, GetSysColor(COLOR_BTNTEXT));
  HGDIOBJ previous = SelectObject(dc, font_);

  RECT text{header.left + 6, header.top + 1, header.right - 4,
            header.bottom - 1};
  DrawTextW(dc, title, -1, &text, DT_SINGLELINE | DT_VCENTER | DT_LEFT);

  SelectObject(dc, previous);
}

void Studio::DrawPropertiesTitle(HDC dc, const RECT& panel) {
  RECT strip{panel.left, panel.top + kPanelHeader, panel.right,
             panel.top + kPanelHeader + kPropertiesTitleHeight};
  FillRect(dc, &strip, GetSysColorBrush(COLOR_3DFACE));

  RECT bottom{strip.left, strip.bottom - 1, strip.right, strip.bottom};
  FillRect(dc, &bottom, GetSysColorBrush(COLOR_3DSHADOW));

  if (propertiesTitle_.empty()) return;

  SetBkMode(dc, TRANSPARENT);
  SetTextColor(dc, GetSysColor(COLOR_BTNTEXT));
  HGDIOBJ previous = SelectObject(dc, boldFont_);

  RECT text{strip.left + 6, strip.top, strip.right - 4, strip.bottom};
  DrawTextW(dc, propertiesTitle_.c_str(), -1, &text,
            DT_SINGLELINE | DT_VCENTER | DT_LEFT | DT_END_ELLIPSIS);

  SelectObject(dc, previous);
}

void Studio::DrawStatusBar(HDC dc, const RECT& area) {
  FillRect(dc, &area, GetSysColorBrush(COLOR_3DFACE));

  RECT top{area.left, area.top, area.right, area.top + 1};
  FillRect(dc, &top, GetSysColorBrush(COLOR_3DSHADOW));

  SetBkMode(dc, TRANSPARENT);
  SetTextColor(dc, GetSysColor(COLOR_BTNTEXT));
  HGDIOBJ previous = SelectObject(dc, font_);

  RECT left{area.left + 8, area.top + 2, area.left + area.right / 2,
            area.bottom};
  DrawTextW(dc, statusText_.c_str(), -1, &left,
            DT_SINGLELINE | DT_VCENTER | DT_LEFT);

  const int partCount = world_.PartCount();
  std::wstring rightText = std::to_wstring(partCount) +
                           (partCount == 1 ? L" part" : L" parts");
  if (engineStats_) {
    wchar_t fps[32] = L"";
    swprintf_s(fps, L"%.0f fps", fps_);
    rightText += L"  |  ";
    rightText += fps;
  }
  rightText += L"  |  ";
  rightText += placeName_;

  RECT right{area.left + area.right / 2, area.top + 2, area.right - 8,
             area.bottom};
  DrawTextW(dc, rightText.c_str(), -1, &right,
            DT_SINGLELINE | DT_VCENTER | DT_RIGHT);

  SelectObject(dc, previous);
}

void Studio::UpdateStatus() {
  if (!frame_) return;
  const RECT status = StatusRect();
  InvalidateRect(frame_, &status, FALSE);
}

void Studio::SetPlaceTitle() {
  if (!frame_) return;
  const std::wstring title =
      L"FieldBrik - [" + placeName_ + L"]";
  SetWindowTextW(frame_, title.c_str());
}

void Studio::ToggleFullscreen() {
  if (!frame_) return;

  if (!fullscreen_) {
    if (!GetWindowRect(frame_, &windowedRect_)) return;
    windowedStyle_ = GetWindowLongPtrW(frame_, GWL_STYLE);

    MONITORINFO monitor{};
    monitor.cbSize = sizeof(monitor);
    if (!GetMonitorInfoW(MonitorFromWindow(frame_, MONITOR_DEFAULTTOPRIMARY),
                         &monitor)) {
      return;
    }

    SetMenu(frame_, nullptr);
    SetWindowLongPtrW(frame_, GWL_STYLE, WS_POPUP | WS_VISIBLE);
    SetWindowPos(frame_, HWND_TOP, monitor.rcMonitor.left,
                 monitor.rcMonitor.top,
                 monitor.rcMonitor.right - monitor.rcMonitor.left,
                 monitor.rcMonitor.bottom - monitor.rcMonitor.top,
                 SWP_FRAMECHANGED | SWP_NOOWNERZORDER);
    fullscreen_ = true;
    return;
  }

  SetWindowLongPtrW(frame_, GWL_STYLE, windowedStyle_);
  SetWindowPos(frame_, nullptr, windowedRect_.left, windowedRect_.top,
               windowedRect_.right - windowedRect_.left,
               windowedRect_.bottom - windowedRect_.top,
               SWP_FRAMECHANGED | SWP_NOZORDER);
  fullscreen_ = false;
  if (menu_) {
    SetMenu(frame_, menu_);
    DrawMenuBar(frame_);
  }
}

void Studio::OnCommand(int command) {
  if (command >= kRecentFirst && command < kRecentFirst + 6) {
    const int index = command - kRecentFirst;
    if (index >= 0 && index < static_cast<int>(recentPlaces_.size())) {
      LoadPlace(recentPlaces_[index]);
    }
    return;
  }

  switch (command) {
    case kFileNew:
      NewPlace();
      break;

    case kFileOpen:
      OpenPlace();
      break;

    case kFileSave:
      SavePlace();
      break;

    case kFileSaveAs:
      SavePlaceAs();
      break;

    case kFileExit:
      running_ = false;
      if (frame_) DestroyWindow(frame_);
      break;

    case kEditUndo:
      Undo();
      break;

    case kEditRedo:
      Redo();
      break;

    case kEditCut:
      CutSelected();
      break;

    case kEditCopy:
      CopySelected();
      break;

    case kEditPaste:
      PasteClipboard();
      break;

    case kEditClear:
      DeleteSelected();
      break;

    case kEditDuplicate:
      DuplicateSelected();
      break;

    case kEditSelectAll:
      Log(L"Select All needs multi-selection, which is not in this pass.");
      break;

    case kViewStartPage:
      ShowStartPage(!startPage_);
      break;

    case kViewToolbox:
      showToolbox_ = !showToolbox_;
      CheckMenuItem(menu_, kViewToolbox,
                    MF_BYCOMMAND |
                        (showToolbox_ ? MF_CHECKED : MF_UNCHECKED));
      Layout();
      break;

    case kInsertBlock:
      InsertPart(PartShape::Cube);
      break;

    case kInsertSphere:
      InsertPart(PartShape::Sphere);
      break;

    case kInsertCylinder:
      InsertPart(PartShape::Cylinder);
      break;

    case kInsertWedge:
      InsertPart(PartShape::Wedge);
      break;

    case kInsertClearStarterPack:
      Log(L"There are no tools in StarterPack to clear.");
      break;

    case kInsertClearBackpack:
      Log(L"My Backpack is empty; there is nothing to clear.");
      break;

    case kViewExplorer:
      showExplorer_ = !showExplorer_;
      CheckMenuItem(menu_, kViewExplorer,
                    MF_BYCOMMAND |
                        (showExplorer_ ? MF_CHECKED : MF_UNCHECKED));
      Layout();
      break;

    case kViewProperties:
      showProperties_ = !showProperties_;
      CheckMenuItem(menu_, kViewProperties,
                    MF_BYCOMMAND |
                        (showProperties_ ? MF_CHECKED : MF_UNCHECKED));
      Layout();
      break;

    case kViewOutput:
      showOutput_ = !showOutput_;
      CheckMenuItem(menu_, kViewOutput,
                    MF_BYCOMMAND | (showOutput_ ? MF_CHECKED : MF_UNCHECKED));
      Layout();
      break;

    case kViewDiagnostics:
    case kToolsEngineStats:
      engineStats_ = !engineStats_;
      UpdateStatus();
      break;

    case kViewGameLayout:
      showExplorer_ = true;
      showProperties_ = true;
      showOutput_ = false;
      showToolbox_ = false;
      startPage_ = false;
      showStandardToolbar_ = true;
      showToolsToolbar_ = true;
      RebuildMenu();
      Layout();
      break;

    case kViewFullscreen:
      ToggleFullscreen();
      break;

    case kViewToolbarMouse:
      mouseToolbar_ = !mouseToolbar_;
      CheckMenuItem(menu_, kViewToolbarMouse,
                    MF_BYCOMMAND |
                        (mouseToolbar_ ? MF_CHECKED : MF_UNCHECKED));
      break;

    case kViewToolbarStandard:
      showStandardToolbar_ = !showStandardToolbar_;
      CheckMenuItem(menu_, kViewToolbarStandard,
                    MF_BYCOMMAND |
                        (showStandardToolbar_ ? MF_CHECKED : MF_UNCHECKED));
      Layout();
      break;

    case kViewToolbarTest:
      testToolbar_ = !testToolbar_;
      CheckMenuItem(menu_, kViewToolbarTest,
                    MF_BYCOMMAND |
                        (testToolbar_ ? MF_CHECKED : MF_UNCHECKED));
      break;

    case kViewToolbarCamera:
      showToolsToolbar_ = !showToolsToolbar_;
      CheckMenuItem(menu_, kViewToolbarCamera,
                    MF_BYCOMMAND |
                        (showToolsToolbar_ ? MF_CHECKED : MF_UNCHECKED));
      Layout();
      break;

    case kViewToolbarCommand:
      commandToolbar_ = !commandToolbar_;
      CheckMenuItem(menu_, kViewToolbarCommand,
                    MF_BYCOMMAND |
                        (commandToolbar_ ? MF_CHECKED : MF_UNCHECKED));
      break;

    case kViewToolbarCustomize:
      Log(L"Toolbar customisation is not built yet.");
      break;

    case kHelpAbout:
      MessageBoxW(frame_,
                  L"FieldBrik Studio 0.4\n\n"
                  L"A 2008-style place editor: Explorer, Properties, a tabbed\n"
                  L"viewport and the era's menus. Pick a template on the Start\n"
                  L"Page, add blocks from the Toolbox or Insert menu, then drag\n"
                  L"a part to move it or drag a corner handle to resize it.\n"
                  L"Delete, cut, copy, paste, duplicate and undo all work.\n\n"
                  L"Saving, Play Solo and the brick art are the next pass.",
                  L"About FieldBrik", MB_OK | MB_ICONINFORMATION);
      break;

    default:
      break;
  }
}

LRESULT CALLBACK Studio::FrameProc(HWND handle, UINT message, WPARAM wparam,
                                   LPARAM lparam) {
  if (message == WM_NCCREATE) {
    auto* create = reinterpret_cast<CREATESTRUCTW*>(lparam);
    auto* self = static_cast<Studio*>(create->lpCreateParams);
    SetWindowLongPtrW(handle, GWLP_USERDATA,
                      reinterpret_cast<LONG_PTR>(self));
    self->frame_ = handle;
  }

  auto* self = reinterpret_cast<Studio*>(
      GetWindowLongPtrW(handle, GWLP_USERDATA));
  if (self) return self->HandleMessage(handle, message, wparam, lparam);

  return DefWindowProcW(handle, message, wparam, lparam);
}

LRESULT CALLBACK Studio::ViewportProc(HWND handle, UINT message, WPARAM wparam,
                                      LPARAM lparam) {
  if (message == WM_NCCREATE) {
    auto* create = reinterpret_cast<CREATESTRUCTW*>(lparam);
    auto* self = static_cast<Studio*>(create->lpCreateParams);
    SetWindowLongPtrW(handle, GWLP_USERDATA,
                      reinterpret_cast<LONG_PTR>(self));
    return TRUE;
  }

  auto* self = reinterpret_cast<Studio*>(
      GetWindowLongPtrW(handle, GWLP_USERDATA));
  if (self) return self->HandleViewport(handle, message, wparam, lparam);

  return DefWindowProcW(handle, message, wparam, lparam);
}

LRESULT Studio::HandleMessage(HWND handle, UINT message, WPARAM wparam,
                              LPARAM lparam) {
  switch (message) {
    case WM_SIZE:
      if (wparam != SIZE_MINIMIZED) Layout();
      return 0;

    case WM_GETMINMAXINFO: {
      auto* info = reinterpret_cast<MINMAXINFO*>(lparam);
      info->ptMinTrackSize.x = 960;
      info->ptMinTrackSize.y = 640;
      return 0;
    }

    case WM_ERASEBKGND:
      return 1;

    case WM_PAINT: {
      PAINTSTRUCT paint{};
      HDC dc = BeginPaint(handle, &paint);

      RECT client{};
      GetClientRect(handle, &client);
      if (client.right > 0 && client.bottom > 0) {
        HDC memory = CreateCompatibleDC(dc);
        HBITMAP buffer =
            CreateCompatibleBitmap(dc, client.right, client.bottom);
        HGDIOBJ previous = SelectObject(memory, buffer);

        DrawChrome(memory, client);
        BitBlt(dc, 0, 0, client.right, client.bottom, memory, 0, 0, SRCCOPY);

        SelectObject(memory, previous);
        DeleteObject(buffer);
        DeleteDC(memory);
      }

      EndPaint(handle, &paint);
      return 0;
    }

    case WM_MOUSEMOVE: {
      const int mouseX = GET_X_LPARAM(lparam);
      const int mouseY = GET_Y_LPARAM(lparam);

      if (startPage_) {
        const int card = StartPageCardAt(mouseX, mouseY);
        if (card != hotCard_) {
          hotCard_ = card;
          InvalidateRect(handle, nullptr, FALSE);
        }
        return 0;
      }

      const int toolboxRow = ToolboxRowAt(mouseX, mouseY);
      if (toolboxRow != hotToolboxRow_) {
        hotToolboxRow_ = toolboxRow;
        const RECT panel = ToolboxRect();
        if (panel.right > panel.left) InvalidateRect(handle, &panel, FALSE);
      }

      int row = -1;
      const int hot = ToolbarButtonAt(mouseX, mouseY, &row);
      if (hot != hotButton_ || row != hotRow_) {
        const RECT old = ToolbarRowRect(hotRow_);
        hotButton_ = hot;
        hotRow_ = hot >= 0 ? row : -1;
        if (old.right > old.left) InvalidateRect(handle, &old, FALSE);
        const RECT now = ToolbarRowRect(hotRow_);
        if (now.right > now.left) InvalidateRect(handle, &now, FALSE);
      }
      return 0;
    }

    case WM_LBUTTONDOWN: {
      const int x = GET_X_LPARAM(lparam);
      const int y = GET_Y_LPARAM(lparam);

      if (startPage_) {
        const int card = StartPageCardAt(x, y);
        if (card >= 0) ApplyTemplate(card);
        return 0;
      }

      const int toolbox = ToolboxRowAt(x, y);
      if (toolbox >= 0) {
        static const PartShape shapes[4] = {PartShape::Cube, PartShape::Sphere,
                                            PartShape::Cylinder,
                                            PartShape::Wedge};
        InsertPart(shapes[toolbox]);
        return 0;
      }

      const int quick = QuickBarAt(x, y);
      if (quick == 0) ShowMenuPopup(5);
      if (quick == 1) ShowMenuPopup(3);
      if (quick == 2) ToggleFullscreen();
      if (quick == 3) ShowMenuPopup(7);
      if (quick == 4) OnCommand(kFileExit);
      if (quick >= 0) return 0;

      const int tab = TabAt(x, y);
      if (tab == 0) ShowStartPage(true);
      if (tab == 1) ShowStartPage(false);
      return 0;
    }

    case WM_LBUTTONUP: {
      int row = -1;
      const int hot = ToolbarButtonAt(GET_X_LPARAM(lparam),
                                      GET_Y_LPARAM(lparam), &row);
      if (hot >= 0) {
        OnCommand(row == 0 ? kStandardButtons[hot].command
                           : kToolsButtons[hot].command);
      }
      return 0;
    }

    case WM_COMMAND:
      OnCommand(LOWORD(wparam));
      return 0;

    case WM_NOTIFY: {
      auto* header = reinterpret_cast<NMHDR*>(lparam);

      if (header->idFrom == kExplorerId && header->code == TVN_SELCHANGED &&
          !populating_ && !syncing_) {
        auto* change = reinterpret_cast<NMTREEVIEWW*>(lparam);
        ShowProperties(static_cast<int>(change->itemNew.lParam) - 1);
        return 0;
      }

      if (header->idFrom == kPropertiesId && header->code == NM_CUSTOMDRAW) {
        auto* draw = reinterpret_cast<NMLVCUSTOMDRAW*>(lparam);
        if (draw->nmcd.dwDrawStage == CDDS_PREPAINT) {
          return CDRF_NOTIFYITEMDRAW;
        }
        if (draw->nmcd.dwDrawStage == CDDS_ITEMPREPAINT) {
          const int row = static_cast<int>(draw->nmcd.dwItemSpec);
          if (row >= 0 && row < static_cast<int>(propertyHeaders_.size()) &&
              propertyHeaders_[row]) {
            draw->clrTextBk = GetSysColor(COLOR_BTNFACE);
            draw->clrText = GetSysColor(COLOR_BTNTEXT);
            SelectObject(draw->nmcd.hdc, boldFont_);
            return CDRF_NEWFONT;
          }
        }
        return CDRF_DODEFAULT;
      }

      return 0;
    }

    case WM_SETFOCUS:
      if (viewport_) SetFocus(viewport_);
      return 0;

    case WM_CLOSE:
      running_ = false;
      DestroyWindow(handle);
      frame_ = nullptr;
      return 0;

    case WM_DESTROY:
      PostQuitMessage(0);
      return 0;

    default:
      break;
  }

  return DefWindowProcW(handle, message, wparam, lparam);
}

LRESULT Studio::HandleViewport(HWND handle, UINT message, WPARAM wparam,
                               LPARAM lparam) {
  switch (message) {
    case WM_ERASEBKGND:
      return 1;

    case WM_LBUTTONDOWN: {
      SetFocus(handle);
      const int x = GET_X_LPARAM(lparam);
      const int y = GET_Y_LPARAM(lparam);

      if (selected_ >= 0 && selected_ < world_.PartCount()) {
        const Part& part = world_.Parts()[selected_];
        const bool axisAligned =
            !part.hasRotationMatrix && part.rotationDegrees.x == 0.0f &&
            part.rotationDegrees.y == 0.0f && part.rotationDegrees.z == 0.0f;
        const int corner = axisAligned ? HandleAt(x, y) : -1;

        if (corner >= 0) {
          draggingResize_ = true;
          dragChanged_ = false;
          dragHandle_ = corner;
          dragStartPosition_ = part.position;
          dragStartSize_ = part.size;
          dragStartMouse_ = {x, y};
          ScreenToGround(x, y, part.position.y, &dragGroundStart_);
          SetCapture(handle);
          return 0;
        }
      }

      const int picked = PickPart(x, y);
      ShowProperties(picked);
      SelectTreeItem(picked);

      if (picked >= 0) {
        draggingMove_ = true;
        dragChanged_ = false;
        dragStartPosition_ = world_.Parts()[picked].position;
        dragStartMouse_ = {x, y};
        ScreenToGround(x, y, dragStartPosition_.y, &dragGroundStart_);
        SetCapture(handle);
      }
      return 0;
    }

    case WM_RBUTTONDOWN:
      SetFocus(handle);
      SetCapture(handle);
      looking_ = true;
      lastMouse_.x = GET_X_LPARAM(lparam);
      lastMouse_.y = GET_Y_LPARAM(lparam);
      return 0;

    case WM_MOUSEMOVE: {
      const int x = GET_X_LPARAM(lparam);
      const int y = GET_Y_LPARAM(lparam);

      if (draggingMove_ || draggingResize_) {
        const int dx = x - dragStartMouse_.x;
        const int dy = y - dragStartMouse_.y;

        if (!dragChanged_ &&
            (dx > 2 || dx < -2 || dy > 2 || dy < -2)) {
          PushUndo();
          dragChanged_ = true;
        }

        if (dragChanged_) {
          if (draggingResize_) {
            ApplyResize(x, y);
          } else {
            ApplyMove(x, y);
          }
        }
        return 0;
      }

      if (looking_) {
        yaw_ -= static_cast<float>(x - lastMouse_.x) * 0.30f;
        pitch_ += static_cast<float>(y - lastMouse_.y) * 0.30f;
        lastMouse_.x = x;
        lastMouse_.y = y;
        camera_.SetFreePose(eye_, yaw_, pitch_);
      }
      return 0;
    }

    case WM_LBUTTONUP:
      if (draggingMove_ || draggingResize_) {
        const bool changed = dragChanged_;
        draggingMove_ = false;
        draggingResize_ = false;
        dragChanged_ = false;
        dragHandle_ = -1;
        ReleaseCapture();

        if (changed) {
          ShowProperties(selected_);
          Log(L"Moved or resized the selected part.");
        }
      }
      return 0;

    case WM_RBUTTONUP:
      if (looking_) {
        looking_ = false;
        ReleaseCapture();
      }
      return 0;

    case WM_MOUSEWHEEL: {
      const int notches = GET_WHEEL_DELTA_WPARAM(wparam) / WHEEL_DELTA;
      if (notches != 0) {
        DirectX::XMFLOAT3 forward{};
        CameraForward(&forward);
        const float step = static_cast<float>(notches) * 2.0f;
        eye_.x += forward.x * step;
        eye_.y += forward.y * step;
        eye_.z += forward.z * step;
        camera_.SetFreePose(eye_, yaw_, pitch_);
      }
      return 0;
    }

    default:
      break;
  }

  return DefWindowProcW(handle, message, wparam, lparam);
}

}  // namespace fieldbrik
