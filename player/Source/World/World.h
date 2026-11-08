// The world: a list of parts, a spawn point, and nothing else yet.
//
// There is no terrain, no grid and no asset loading. A world is built out of
// individual parts because that is what the building system and Studio will edit
// in the later eras.

#pragma once

#include <vector>

#include "World/Part.h"

namespace fieldbrik {

class World {
 public:
  // The hand-built test world: a baseplate and a handful of bricks at different
  // sizes, colours and angles, which is what makes it useful for checking that
  // position, size, rotation and depth all behave.
  void BuildDefault();

  const std::vector<Part>& Parts() const { return parts_; }
  int PartCount() const { return static_cast<int>(parts_.size()); }

  DirectX::XMFLOAT3 SpawnPoint() const { return spawn_; }

 private:
  void Add(const char* name, DirectX::XMFLOAT3 position,
           DirectX::XMFLOAT3 size, DirectX::XMFLOAT3 colour,
           DirectX::XMFLOAT3 rotation = {0.0f, 0.0f, 0.0f},
           bool collides = true);

  std::vector<Part> parts_;
  DirectX::XMFLOAT3 spawn_{0.0f, 4.0f, 0.0f};
};

}  // namespace fieldbrik
