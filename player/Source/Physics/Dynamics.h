// The unanchored bricks, and what moves them.
//
// Until now every brick was scenery: the player was resolved out of all of them
// and none of them ever moved. This is the other half of the era's physics, the
// part that made Steer the Spheres a game rather than a walk around a model — a
// Part with Anchored = false falls, lands, is shoved, and can be stood on.
//
// It is deliberately approximate. A brick is collided as the axis-aligned box
// its rotation produces, not as its true shape, and unanchored bricks do not
// turn over: a tall gate that is knocked will slide or fall straight down, not
// topple. Shapes are still drawn exactly as the place asks. That is the "janky
// but works" line this pass draws; a full solver with angular motion is its own
// milestone.
//
// The ball is the exception. A Part whose Shape is Ball is collided as a sphere,
// so it rolls away from a shove and bounces off a wall instead of sliding like a
// crate.

#pragma once

#include <DirectXMath.h>

#include <vector>

#include "World/Part.h"

namespace fieldbrik {

// Advances every unanchored part by one frame: gravity, collision with anchored
// bricks and with the other unanchored ones, friction on the ground, and a reset
// for anything that falls out of the world.
void StepParts(std::vector<Part>& parts, float deltaSeconds);

// The player shoulders unanchored bricks aside. Called before the player moves,
// so the space is already clearing by the time they get there. `playerVelocity`
// is the player's own velocity, which decides how hard a brick is shoved and in
// which direction when the player is standing over its centre.
void PushParts(std::vector<Part>& parts,
               const DirectX::XMFLOAT3& playerFeet,
               const DirectX::XMFLOAT3& playerVelocity);

// How far a part the player is standing on carries them this frame. Zero when
// nothing is under their feet. A cart or a moving platform is just an unanchored
// brick whose velocity is not zero.
DirectX::XMFLOAT3 CarryBy(const std::vector<Part>& parts,
                          const DirectX::XMFLOAT3& playerFeet,
                          float deltaSeconds);

}  // namespace fieldbrik
