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

  const std::vector<Part>& Parts() const { return parts_; }
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
