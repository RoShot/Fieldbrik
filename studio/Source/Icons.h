#pragma once

#include <windows.h>

#include <map>
#include <string>

namespace fieldbrik {

struct Icon {
  HBITMAP bitmap = nullptr;
  int width = 0;
  int height = 0;
};

// Studio's toolbar art is not compiled into the exe. It is a folder of PNGs next
// to the executable, so a replacement icon is a drag and drop rather than a
// rebuild, and artists can work on the chrome without touching C++.
class Icons {
 public:
  Icons() = default;
  ~Icons();

  Icons(const Icons&) = delete;
  Icons& operator=(const Icons&) = delete;

  // Loads the icons the toolbar knows by name. Missing files are skipped: a
  // half-filled folder still opens the editor, just with gaps.
  bool Load(const std::wstring& directory);

  const Icon* Find(const std::wstring& name) const;
  bool Empty() const { return icons_.empty(); }

  void Release();

 private:
  std::map<std::wstring, Icon> icons_;
};

}  // namespace fieldbrik
