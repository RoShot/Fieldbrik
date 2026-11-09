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
// The three other shapes are resolved rather than drawn around:
//
// - A wedge is five planes, and the player leaves by whichever plane is cheapest
//   to cross. Standing on the slope means the slope plane is cheapest, so the
//   push is along the slope's own normal and the slope - not the bounding box -
//   is what stops the player.
// - A sphere is an ellipsoid: the closest point on the player's box to its centre,
//   measured in the space where the ellipsoid is a unit sphere.
// - A cylinder is an elliptical barrel: the box is tested against its round side
//   and its two caps, and the cheapest of the three ways out is taken.
//
// All three still work from the player's bounding box in the part's own space, so
// a box against a wedge rotated on two axes can be a fraction of a stud out. That
// is the same approximation the box path has always made.
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

// A surface whose normal leans up by at least this much is one the player stands
// on and can walk up: 0.7 is forty-five degrees. Walls and ceilings fall below
// it, so this is also what decides whether a push along a slant is ground.
constexpr float kWalkableSlopeNormal = 0.7f;

struct Contact {
  bool grounded = false;
  bool hitCeiling = false;

  // Everything the bricks pushed the player by this frame, added up. The
  // horizontal part is the direction of whatever they were stood against, which
  // is what lets the player slide along a wall instead of stopping dead on it.
  DirectX::XMFLOAT3 push{0.0f, 0.0f, 0.0f};
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
