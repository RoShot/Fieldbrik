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
// Stepping up is a player matter (see Player.cpp): the resolver only answers
// "where am I pushed to" and "is this spot free", which is all a step up needs
// to test whether there is room at the top.

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

// True when the player would be pushed out of something standing here. Used to
// test whether a step up has room before taking it.
bool IsBlocked(const std::vector<Part>& parts, const DirectX::XMFLOAT3& feet);

// Distance along `direction` (which must be normalised) to the nearest collidable
// brick, or `maxDistance` when nothing is in the way. If the ray starts inside a
// brick it reports zero, which is what keeps the camera from sitting in one.
float RayCastParts(const std::vector<Part>& parts, const DirectX::XMFLOAT3& origin,
                   const DirectX::XMFLOAT3& direction, float maxDistance);

}  // namespace fieldbrik
