#pragma once

#include <windows.h>

#include <string>
#include <vector>

#include "Camera/Camera.h"
#include "Icons.h"
#include "Rendering/Renderer.h"
#include "World/World.h"

namespace fieldbrik {

struct ToolButton;

class Studio {
 public:
  Studio() = default;
  ~Studio();

  Studio(const Studio&) = delete;
  Studio& operator=(const Studio&) = delete;

  int Run(HINSTANCE instance, int showCommand, const std::wstring& placePath);

 private:
  bool CreateFrame(HINSTANCE instance, int showCommand);
  bool CreateChildren();
  void CreateMenuBar();
  void RebuildMenu();
  void AddRecent(const std::wstring& path);
  void Layout();
  void LoadStartingPlace(const std::wstring& path);
  void NewPlace();
  void OpenPlace();
  void LoadPlace(const std::wstring& path);
  bool SavePlace();
  bool SavePlaceAs();
  bool SaveTo(const std::wstring& path);
  bool ConfirmDiscard();
  bool RequestClose();
  void MarkDirty();
  bool PlaySolo();
  std::wstring FindPlayerExecutable() const;
  void RotateSelected(int axis);
  void ChooseColour();
  void InsertPart(PartShape shape);
  void ShowStartPage(bool show);
  void ApplyTemplate(int index);
  std::string UniquePartName(const std::wstring& base) const;
  void PopulateExplorer();
  void SelectTreeItem(int index);
  void ShowProperties(int index);
  void AddPropertyRow(const wchar_t* name, const std::wstring& value,
                      bool header = false);
  void Log(const std::wstring& line);
  void ResetCamera();
  void Render();
  void UpdateCamera(float deltaSeconds);
  void DrawChrome(HDC dc, const RECT& client);
  void DrawTabs(HDC dc, const RECT& area);
  void DrawQuickBar(HDC dc, const RECT& area);
  void ShowMenuPopup(int index);
  void DrawToolbarRow(HDC dc, int top, const ToolButton* buttons, int count,
                      int hot);
  void DrawPanelHeader(HDC dc, const RECT& panel, const wchar_t* title);
  void DrawPropertiesTitle(HDC dc, const RECT& panel);
  void DrawToolbox(HDC dc, const RECT& panel);
  void DrawStartPage(HDC dc, const RECT& area);
  void DrawStatusBar(HDC dc, const RECT& area);
  void ToggleFullscreen();
  void OnCommand(int command);
  void SetPlaceTitle();
  void UpdateStatus();
  void CameraForward(DirectX::XMFLOAT3* forward) const;
  int PickPart(int x, int y) const;
  void UpdateSelectionOutline();
  void PushUndo();
  void Undo();
  void Redo();
  void RefreshAfterEdit();
  void UpdateEditMenu();
  void CopySelected();
  void CutSelected();
  void PasteClipboard();
  void DeleteSelected();
  void DuplicateSelected();
  bool ProjectToScreen(const DirectX::XMFLOAT3& point, int* x, int* y) const;
  bool ScreenToGround(int x, int y, float planeY,
                      DirectX::XMFLOAT3* result) const;
  int HandleAt(int x, int y) const;
  void ApplyMove(int mouseX, int mouseY);
  void ApplyResize(int mouseX, int mouseY);

  int ToolbarTop() const;
  int TabTop() const;
  int ContentTop() const;
  RECT ToolbarRowRect(int row) const;
  RECT TabStripRect() const;
  RECT StatusRect() const;
  RECT ExplorerRect() const;
  RECT PropertiesRect() const;
  RECT OutputRect() const;
  RECT ViewportRect() const;
  RECT ToolboxRect() const;
  RECT StartPageRect() const;
  RECT StartPageCardRect(int index) const;
  int ToolboxRowAt(int x, int y) const;
  int StartPageCardAt(int x, int y) const;
  int ToolbarButtonAt(int x, int y, int* row) const;
  int TabAt(int x, int y) const;
  RECT QuickBarRect() const;
  int QuickBarAt(int x, int y) const;

  static LRESULT CALLBACK FrameProc(HWND handle, UINT message, WPARAM wparam,
                                    LPARAM lparam);
  static LRESULT CALLBACK ViewportProc(HWND handle, UINT message, WPARAM wparam,
                                       LPARAM lparam);
  LRESULT HandleMessage(HWND handle, UINT message, WPARAM wparam, LPARAM lparam);
  LRESULT HandleViewport(HWND handle, UINT message, WPARAM wparam,
                         LPARAM lparam);

  HINSTANCE instance_ = nullptr;
  HWND frame_ = nullptr;
  HWND viewport_ = nullptr;
  HWND explorer_ = nullptr;
  HWND properties_ = nullptr;
  HWND output_ = nullptr;
  HFONT font_ = nullptr;
  HFONT boldFont_ = nullptr;
  HMENU menu_ = nullptr;
  HACCEL accelerators_ = nullptr;

  Renderer renderer_;
  Camera camera_;
  World world_;
  Icons icons_;

  std::wstring placePath_;
  std::wstring placeName_ = L"Place1";
  std::wstring statusText_ = L"Ready";
  std::wstring propertiesTitle_;
  std::vector<std::wstring> recentPlaces_;

  bool running_ = true;
  bool rendererReady_ = false;
  bool comInitialised_ = false;
  bool showExplorer_ = true;
  bool showProperties_ = true;
  bool showOutput_ = false;
  bool showToolbox_ = false;
  bool startPage_ = false;
  bool showStandardToolbar_ = true;
  bool showToolsToolbar_ = true;
  bool mouseToolbar_ = true;
  bool testToolbar_ = false;
  bool commandToolbar_ = false;
  bool engineStats_ = true;
  bool fullscreen_ = false;
  bool populating_ = false;
  bool syncing_ = false;
  bool looking_ = false;
  int placeCounter_ = 1;

  bool dirty_ = false;
  int selected_ = -1;
  int hotRow_ = -1;
  int hotButton_ = -1;
  int hotToolboxRow_ = -1;
  int hotCard_ = -1;
  POINT lastMouse_{0, 0};
  RECT windowedRect_{0, 0, 0, 0};
  LONG_PTR windowedStyle_ = 0;
  std::vector<bool> propertyHeaders_;
  COLORREF customColours_[16]{};

  // The blue box and white corner handles, rebuilt whenever the selection
  // changes and drawn after the world.
  std::vector<Part> selectionOutline_;

  // Each entry is the whole world before an action, which is cheap enough for a
  // place this size and makes undo of every operation behave the same way.
  struct Snapshot {
    std::vector<Part> parts;
    int selected = -1;
  };
  std::vector<Snapshot> undoStack_;
  std::vector<Snapshot> redoStack_;
  Part clipboard_;
  bool hasClipboard_ = false;

  bool draggingMove_ = false;
  bool draggingResize_ = false;
  bool dragChanged_ = false;
  int dragHandle_ = -1;
  DirectX::XMFLOAT3 dragStartPosition_{};
  DirectX::XMFLOAT3 dragStartSize_{};
  DirectX::XMFLOAT3 dragGroundStart_{};
  POINT dragStartMouse_{0, 0};

  float yaw_ = 135.0f;
  float pitch_ = 18.0f;
  float fps_ = 0.0f;
  DirectX::XMFLOAT3 eye_{28.0f, 20.0f, 28.0f};
};

}  // namespace fieldbrik
