#pragma once

#include <string>
#include <vector>

namespace fieldbrik {

// The era's quick chat and the conversation shown under the top buttons.
//
// The phrase list is the 2008-2009 safe chat tree, kept whole: the size of that
// menu is part of what it felt like. Nothing here draws: the HUD owns the pixels.
class Chat {
 public:
  struct Phrase {
    const wchar_t* group;
    const wchar_t* text;
  };

  struct Line {
    std::wstring who;
    std::wstring text;
    float age = 0.0f;
  };

  static const std::vector<Phrase>& Phrases();

  // Ages the log; a line is dropped once it has faded out.
  void Tick(float seconds);

  void Add(const std::wstring& who, const std::wstring& text);

  bool Open() const { return open_; }
  void Toggle() { open_ = !open_; scroll_ = 0; }
  void Close() { open_ = false; scroll_ = 0; }

  // Scrolling is in rows, clamped to the list.
  void Scroll(int rows);
  int ScrollOffset() const { return scroll_; }

  bool Typing() const { return typing_; }
  void BeginTyping() {
    typing_ = true;
    buffer_.clear();
  }
  void CancelTyping() {
    typing_ = false;
    buffer_.clear();
  }
  bool Submit();

  void Type(const std::wstring& characters);
  void Backspace();
  const std::wstring& Buffer() const { return buffer_; }

  const std::vector<Line>& Lines() const { return lines_; }

  // 1 while fresh, 0 once faded; the log uses it for the whole panel.
  static float LineAlpha(const Line& line);

 private:
  bool open_ = false;
  bool typing_ = false;
  int scroll_ = 0;
  std::wstring buffer_;
  std::vector<Line> lines_;
};

}  // namespace fieldbrik
