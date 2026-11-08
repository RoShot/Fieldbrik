// Collision between the player and the bricks.
//
// The player is collided as a box — 1.8 studs across and 5 tall, standing on its
// feet — rather than as the avatar's true silhouette. That is what the era did
// (everything was a box), and it keeps every test exact instead of approximate.
//
// Each part is resolved in its own space: the player's eight corners are taken
// into the brick's local frame, turned into a local bounding box, and pushed out
// along the axis it overlaps least. That handles a brick rotated on any axis, and
// for the common case — a brick turned only about Y — the push comes out exactly
// along a world axis.
//
// There is no stepping up: a 1-stud brick in front of you is something to jump
// onto, not to walk up. That is listed as a known issue.

#pragma once

#include <DirectXMath.h>

#include <vector>

#include "World/Part.h"

namespace fieldbrik {

constexpr float kPlayerHalfWidth = 0.9f;
constexpr float kPlayerHeight = 5.0f;

struct Contact {
  bool grounded = false;
  bool hitCeiling = false;
};

// Pushes the player's feet out of anything they overlap and reports what they
// ended up touching.
Contact ResolvePlayer(const std::vector<Part>& parts, DirectX::XMFLOAT3& feet);

}  // namespace fieldbrik
