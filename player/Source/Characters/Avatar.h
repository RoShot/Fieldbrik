// The player's body: six rigid boxes, no animation.
//
// This is the DynaBlocks-era figure (2004-2005, carried into the 2006 client):
// yellow head and arms, blue torso, green legs, five studs tall. The torso is a
// single part, the limbs are rigid blocks, and nothing bends or swings — the
// avatar slides and turns, it does not walk.
//
// The studs on the top faces are not here yet; they belong with the 2006 era,
// where the look gains its detail.
//
// Proportions in studs, feet at y = 0, facing +Z:
//
//            [head 2x1x1]        y 4.0 .. 5.0
//   [arm]    [torso 2x2x1]  [arm]  y 2.0 .. 4.0   arms 1x2x1 at x = -1.5, +1.5
//   [leg]       [leg]             y 0.0 .. 2.0   legs 1x2x1 at x = -0.5, +0.5
//
// That makes a figure 4 studs wide and 5 tall, which is what the early client
// used and what keeps the avatar from looking giant next to 1-stud bricks.

#pragma once

#include <DirectXMath.h>

#include <vector>

#include "World/Part.h"

namespace fieldbrik {

class Avatar {
 public:
  // Feet position in the world and a facing angle in degrees, where 0 faces +Z.
  void SetPose(const DirectX::XMFLOAT3& feetPosition, float facingDegrees);

  // Appends the body parts, already placed in the world, to the list.
  void CollectParts(std::vector<Part>& out) const;

 private:
  DirectX::XMFLOAT3 feet_{0.0f, 0.0f, 0.0f};
  float facing_ = 0.0f;
};

}  // namespace fieldbrik
