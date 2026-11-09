// The world: a list of parts, a spawn point, and where they came from.
//
// The parts are not compiled in any more. Either they are read from a place file
// (see PlaceFile.h) or, when there is no file to read, they are built by hand as
// the fallback place so the client always has something to open.
//
// A world is a flat list of parts because that is what the building system and
// Studio will edit in the later eras. The hierarchy a place file carries — a Part
// inside Workspace inside the DataModel — is walked by the reader and flattened.

#pragma once

#include <string>
#include <vector>

#include "World/Part.h"

namespace fieldbrik {

class World {
 public:
  // Replaces everything with the contents of `path`. On failure the world is left
  // as it was, and `error` says what went wrong.
  bool Load(const std::string& path, std::string& error);

  // The hand-built fallback place: a baseplate and a handful of bricks at
  // different sizes, colours and angles.
  void BuildDefault();

  // A fresh place: one small grey baseplate and nothing else, which is what
  // Studio's New Place and its first launch both show. The player's built-in
  // place stays the busier one above; this is the editor's empty canvas. The
  // colour overload is what the Start Page's grass template asks for.
  void BuildBaseplate();
  void BuildBaseplate(DirectX::XMFLOAT3 colour);

  // Studio's editing surface: a part appended as given, and everything gone.
  // Naming and placement belong to the caller; the world only holds the list.
  void AddPart(const Part& part) { parts_.push_back(part); }
  void RemovePart(int index) {
    if (index >= 0 && index < PartCount()) parts_.erase(parts_.begin() + index);
  }
  void ReplaceParts(const std::vector<Part>& parts) { parts_ = parts; }
  Part* MutablePart(int index) {
    return index >= 0 && index < PartCount() ? &parts_[index] : nullptr;
  }
  void Clear();

  const std::vector<Part>& Parts() const { return parts_; }

  // The physics step moves unanchored bricks in place, so it needs a writable
  // list. Everything else reads Parts().
  std::vector<Part>& MutableParts() { return parts_; }
  int PartCount() const { return static_cast<int>(parts_.size()); }

  DirectX::XMFLOAT3 SpawnPoint() const { return spawn_; }

  // The place file's name, or "built-in place".
  const std::string& Name() const { return name_; }

 private:
  void Add(const char* name, DirectX::XMFLOAT3 position,
           DirectX::XMFLOAT3 size, DirectX::XMFLOAT3 colour,
           DirectX::XMFLOAT3 rotation = {0.0f, 0.0f, 0.0f},
           bool collides = true);

  std::vector<Part> parts_;

  // Clear of the bricks, with the build area in front of the player rather than
  // behind him. A place with a SpawnLocation overrides it.
  DirectX::XMFLOAT3 spawn_{0.0f, 0.0f, 14.0f};

  std::string name_ = "built-in place";
};

}  // namespace fieldbrik
