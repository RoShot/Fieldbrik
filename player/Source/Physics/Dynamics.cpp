#include "Physics/Dynamics.h"

#include <algorithm>
#include <cmath>

#include "Physics/Physics.h"

using namespace DirectX;

namespace fieldbrik {
namespace {

// The same gravity the player falls under. A brick that lets go of a ledge should
// take exactly as long to reach the floor as the player does.
constexpr float kGravity = -196.2f;
constexpr float kMaxFallSpeed = 250.0f;

// A hair of separation after a push, so two settled bricks are touching rather
// than overlapping and being pushed again every frame.
constexpr float kSkin = 0.002f;

// A brick dropped from height should thud, not bounce like a ball. The era's
// default Elasticity is 0.5, but that number assumes a real solver; this one
// reads better with a small bounce and a quick stop.
constexpr float kRestitution = 0.2f;
constexpr float kFriction = 1.8f;

// Below this the brick has stopped, and its velocity is zeroed so a stack does
// not creep across the floor for the rest of the visit.
constexpr float kRestSpeed = 0.2f;
constexpr float kGroundNormal = 0.7f;

// A brick that falls out of the world goes back to where the place put it.
constexpr float kResetBelow = -250.0f;

// Nothing may move more than this in one collision slice, or it can pass through
// a baseplate between frames. Slices are cheap: the world is a few dozen bricks.
constexpr float kMaxSubstepTravel = 0.3f;
constexpr int kMaxSubsteps = 16;

struct Bounds {
  XMFLOAT3 minimum{};
  XMFLOAT3 maximum{};
};

float Speed(const Part& part) {
  return std::sqrt(part.velocity.x * part.velocity.x +
                   part.velocity.y * part.velocity.y +
                   part.velocity.z * part.velocity.z);
}

float Component(const XMFLOAT3& value, int axis) {
  if (axis == 0) return value.x;
  if (axis == 1) return value.y;
  return value.z;
}

void AddComponent(XMFLOAT3& value, int axis, float amount) {
  if (axis == 0) {
    value.x += amount;
  } else if (axis == 1) {
    value.y += amount;
  } else {
    value.z += amount;
  }
}

void SetComponent(XMFLOAT3& value, int axis, float amount) {
  if (axis == 0) {
    value.x = amount;
  } else if (axis == 1) {
    value.y = amount;
  } else {
    value.z = amount;
  }
}

// The world-axis box a part occupies. A rotated brick is collided as the box its
// rotation sweeps out, which is what makes this pass approximate: the drawn
// brick keeps its true angle, the collision does not.
Bounds BoundsOf(const Part& part) {
  const float halfX = part.size.x * 0.5f;
  const float halfY = part.size.y * 0.5f;
  const float halfZ = part.size.z * 0.5f;

  Bounds bounds{};

  if (part.shape == PartShape::Sphere) {
    const float radius = std::max({halfX, halfY, halfZ});
    bounds.minimum = {part.position.x - radius, part.position.y - radius,
                      part.position.z - radius};
    bounds.maximum = {part.position.x + radius, part.position.y + radius,
                      part.position.z + radius};
    return bounds;
  }

  XMFLOAT3X3 matrix{};
  XMStoreFloat3x3(&matrix, part.RotationMatrix());

  const float extentX = std::fabs(matrix.m[0][0]) * halfX +
                        std::fabs(matrix.m[0][1]) * halfY +
                        std::fabs(matrix.m[0][2]) * halfZ;
  const float extentY = std::fabs(matrix.m[1][0]) * halfX +
                        std::fabs(matrix.m[1][1]) * halfY +
                        std::fabs(matrix.m[1][2]) * halfZ;
  const float extentZ = std::fabs(matrix.m[2][0]) * halfX +
                        std::fabs(matrix.m[2][1]) * halfY +
                        std::fabs(matrix.m[2][2]) * halfZ;

  bounds.minimum = {part.position.x - extentX, part.position.y - extentY,
                    part.position.z - extentZ};
  bounds.maximum = {part.position.x + extentX, part.position.y + extentY,
                    part.position.z + extentZ};
  return bounds;
}

float VolumeOf(const Part& part) {
  return std::max(0.05f, part.size.x * part.size.y * part.size.z);
}

float RadiusOf(const Part& part) {
  return std::max({part.size.x, part.size.y, part.size.z}) * 0.5f;
}

// A falling box against a fixed box. The shallowest overlap is the way out, which
// is what reads as landing on top of a brick rather than being thrown off it.
bool ResolveBoxAgainstBounds(Part& moving, const Bounds& other) {
  const Bounds bounds = BoundsOf(moving);

  float overlaps[3];
  overlaps[0] = std::min(bounds.maximum.x, other.maximum.x) -
                std::max(bounds.minimum.x, other.minimum.x);
  overlaps[1] = std::min(bounds.maximum.y, other.maximum.y) -
                std::max(bounds.minimum.y, other.minimum.y);
  overlaps[2] = std::min(bounds.maximum.z, other.maximum.z) -
                std::max(bounds.minimum.z, other.minimum.z);

  if (overlaps[0] <= 0.0f || overlaps[1] <= 0.0f || overlaps[2] <= 0.0f) {
    return false;
  }

  int axis = 0;
  if (overlaps[1] < overlaps[axis]) axis = 1;
  if (overlaps[2] < overlaps[axis]) axis = 2;

  const float otherCentre =
      (Component(other.minimum, axis) + Component(other.maximum, axis)) * 0.5f;
  const float direction =
      Component(moving.position, axis) >= otherCentre ? 1.0f : -1.0f;

  AddComponent(moving.position, axis, direction * (overlaps[axis] + kSkin));

  const float velocity = Component(moving.velocity, axis);

  if (axis == 1) {
    if (direction > 0.0f) {
      // Landed on top. A slow drop stops dead; a fast one keeps a little bounce.
      if (velocity < 0.0f) {
        const float bounce = -velocity * kRestitution;
        SetComponent(moving.velocity, 1, bounce < 1.0f ? 0.0f : bounce);
      }
      return true;
    }

    // Hit an underside.
    if (velocity > 0.0f) SetComponent(moving.velocity, 1, 0.0f);
    return false;
  }

  // A wall. Only the part heading into it is removed, so a brick sliding along a
  // wall keeps sliding.
  if (velocity * direction < 0.0f) SetComponent(moving.velocity, axis, 0.0f);
  return false;
}

// A ball against a fixed box, as a sphere. This is the one shape that is not
// treated as a box, because a ball that slides like a crate is not a ball.
bool ResolveSphereAgainstBounds(Part& ball, const Bounds& box) {
  const float radius = RadiusOf(ball);

  const float closestX = std::clamp(ball.position.x, box.minimum.x, box.maximum.x);
  const float closestY = std::clamp(ball.position.y, box.minimum.y, box.maximum.y);
  const float closestZ = std::clamp(ball.position.z, box.minimum.z, box.maximum.z);

  const float dx = ball.position.x - closestX;
  const float dy = ball.position.y - closestY;
  const float dz = ball.position.z - closestZ;

  const float distanceSquared = dx * dx + dy * dy + dz * dz;
  if (distanceSquared > radius * radius) return false;

  XMFLOAT3 normal{0.0f, 1.0f, 0.0f};
  float penetration = radius;

  if (distanceSquared > 1e-8f) {
    const float distance = std::sqrt(distanceSquared);
    normal = {dx / distance, dy / distance, dz / distance};
    penetration = radius - distance;
  } else {
    // The centre is inside the box: leave by the nearest face, far enough that
    // the whole ball is clear.
    const float faces[6] = {
        ball.position.x - box.minimum.x, box.maximum.x - ball.position.x,
        ball.position.y - box.minimum.y, box.maximum.y - ball.position.y,
        ball.position.z - box.minimum.z, box.maximum.z - ball.position.z,
    };

    int nearest = 0;
    for (int face = 1; face < 6; ++face) {
      if (faces[face] < faces[nearest]) nearest = face;
    }

    const int axis = nearest / 2;
    const float direction = (nearest % 2 == 0) ? -1.0f : 1.0f;

    normal = {0.0f, 0.0f, 0.0f};
    SetComponent(normal, axis, direction);
    penetration = faces[nearest] + radius;
  }

  ball.position.x += normal.x * (penetration + kSkin);
  ball.position.y += normal.y * (penetration + kSkin);
  ball.position.z += normal.z * (penetration + kSkin);

  const float into = ball.velocity.x * normal.x + ball.velocity.y * normal.y +
                     ball.velocity.z * normal.z;

  if (into < 0.0f) {
    const float bounce = into * (1.0f + kRestitution);
    ball.velocity.x -= normal.x * bounce;
    ball.velocity.y -= normal.y * bounce;
    ball.velocity.z -= normal.z * bounce;

    // A ball settling on the floor should stop bouncing, not shiver forever.
    if (normal.y >= kGroundNormal && std::fabs(ball.velocity.y) < 2.0f) {
      ball.velocity.y = 0.0f;
    }
  }

  return normal.y >= kGroundNormal;
}

// Two unanchored bricks. They share the separation in inverse proportion to their
// volumes, so a ball does not shove a wall the way a wall shoves a ball.
void ResolvePair(Part& first, Part& second) {
  const Bounds a = BoundsOf(first);
  const Bounds b = BoundsOf(second);

  float overlaps[3];
  overlaps[0] = std::min(a.maximum.x, b.maximum.x) -
                std::max(a.minimum.x, b.minimum.x);
  overlaps[1] = std::min(a.maximum.y, b.maximum.y) -
                std::max(a.minimum.y, b.minimum.y);
  overlaps[2] = std::min(a.maximum.z, b.maximum.z) -
                std::max(a.minimum.z, b.minimum.z);

  if (overlaps[0] <= 0.0f || overlaps[1] <= 0.0f || overlaps[2] <= 0.0f) return;

  int axis = 0;
  if (overlaps[1] < overlaps[axis]) axis = 1;
  if (overlaps[2] < overlaps[axis]) axis = 2;

  const float secondCentre =
      (Component(b.minimum, axis) + Component(b.maximum, axis)) * 0.5f;
  const float direction =
      Component(first.position, axis) >= secondCentre ? 1.0f : -1.0f;

  const float massA = VolumeOf(first);
  const float massB = VolumeOf(second);
  const float total = massA + massB;
  const float distance = overlaps[axis] + kSkin;

  AddComponent(first.position, axis, direction * distance * (massB / total));
  AddComponent(second.position, axis, -direction * distance * (massA / total));

  XMFLOAT3 normal{0.0f, 0.0f, 0.0f};
  SetComponent(normal, axis, direction);

  const float relative = (first.velocity.x - second.velocity.x) * normal.x +
                         (first.velocity.y - second.velocity.y) * normal.y +
                         (first.velocity.z - second.velocity.z) * normal.z;

  if (relative < 0.0f) {
    const float impulse =
        -1.1f * relative / (1.0f / massA + 1.0f / massB);
    first.velocity.x += normal.x * impulse / massA;
    first.velocity.y += normal.y * impulse / massA;
    first.velocity.z += normal.z * impulse / massA;
    second.velocity.x -= normal.x * impulse / massB;
    second.velocity.y -= normal.y * impulse / massB;
    second.velocity.z -= normal.z * impulse / massB;
  }
}

}  // namespace

void StepParts(std::vector<Part>& parts, float deltaSeconds) {
  const float frame = std::min(deltaSeconds, 0.1f);
  if (frame <= 0.0f) return;

  float fastest = 0.0f;
  for (const Part& part : parts) {
    if (part.anchored) continue;
    fastest = std::max(fastest, Speed(part));
  }

  const int substeps = std::clamp(
      static_cast<int>(std::ceil(fastest * frame / kMaxSubstepTravel)), 1,
      kMaxSubsteps);
  const float step = frame / static_cast<float>(substeps);

  for (int slice = 0; slice < substeps; ++slice) {
    for (size_t index = 0; index < parts.size(); ++index) {
      Part& part = parts[index];
      if (part.anchored || !part.collides) continue;

      part.velocity.y =
          std::max(part.velocity.y + kGravity * step, -kMaxFallSpeed);

      part.position.x += part.velocity.x * step;
      part.position.y += part.velocity.y * step;
      part.position.z += part.velocity.z * step;

      bool grounded = false;

      for (size_t other = 0; other < parts.size(); ++other) {
        if (other == index) continue;

        const Part& brick = parts[other];
        if (!brick.collides || !brick.anchored) continue;

        if (part.shape == PartShape::Sphere) {
          if (ResolveSphereAgainstBounds(part, BoundsOf(brick))) {
            grounded = true;
          }
        } else if (ResolveBoxAgainstBounds(part, BoundsOf(brick))) {
          grounded = true;
        }
      }

      if (grounded) {
        const float damp = std::exp(-kFriction * step);
        part.velocity.x *= damp;
        part.velocity.z *= damp;

        if (Speed(part) < kRestSpeed) {
          part.velocity = {0.0f, 0.0f, 0.0f};
        }
      }

      if (part.position.y < kResetBelow) {
        part.position = part.homePosition;
        part.velocity = {0.0f, 0.0f, 0.0f};
      }
    }

    // Then the unanchored bricks against each other. Doing this after every one
    // has met the world keeps a stack from being pushed through the floor by the
    // brick it is standing on.
    for (size_t first = 0; first < parts.size(); ++first) {
      if (parts[first].anchored || !parts[first].collides) continue;

      for (size_t second = first + 1; second < parts.size(); ++second) {
        if (parts[second].anchored || !parts[second].collides) continue;
        ResolvePair(parts[first], parts[second]);
      }
    }
  }
}

void PushParts(std::vector<Part>& parts, const XMFLOAT3& playerFeet,
               const XMFLOAT3& playerVelocity) {
  const Bounds player{
      {playerFeet.x - kPlayerHalfWidth, playerFeet.y,
       playerFeet.z - kPlayerHalfWidth},
      {playerFeet.x + kPlayerHalfWidth, playerFeet.y + kPlayerHeight,
       playerFeet.z + kPlayerHalfWidth},
  };

  const float playerSpeed = std::sqrt(playerVelocity.x * playerVelocity.x +
                                      playerVelocity.z * playerVelocity.z);

  for (Part& part : parts) {
    if (part.anchored || !part.collides) continue;

    const Bounds bounds = BoundsOf(part);

    const bool overlaps =
        std::min(bounds.maximum.x, player.maximum.x) >
            std::max(bounds.minimum.x, player.minimum.x) &&
        std::min(bounds.maximum.y, player.maximum.y) >
            std::max(bounds.minimum.y, player.minimum.y) &&
        std::min(bounds.maximum.z, player.maximum.z) >
            std::max(bounds.minimum.z, player.minimum.z);
    if (!overlaps) continue;

    float dx = part.position.x - playerFeet.x;
    float dz = part.position.z - playerFeet.z;
    float length = std::sqrt(dx * dx + dz * dz);

    // Standing right on the centre, the shove comes from the player's own
    // direction; standing still, it picks +Z rather than dividing by zero.
    if (length < 0.15f) {
      if (playerSpeed > 0.1f) {
        dx = playerVelocity.x;
        dz = playerVelocity.z;
        length = playerSpeed;
      } else {
        dx = 0.0f;
        dz = 1.0f;
        length = 1.0f;
      }
    }

    const float nx = dx / length;
    const float nz = dz / length;

    // A gate is heavy to shove, a ball is not. Footprint is a stand-in for mass,
    // so a wide wall barely moves while a 5-stud ball rolls away.
    const float footprint = std::max(1.0f, part.size.x * part.size.z);
    const float grip =
        part.shape == PartShape::Sphere ? 1.0f : std::min(1.0f, 8.0f / footprint);
    const float speed = std::max(4.0f, playerSpeed) * grip;

    part.velocity.x = nx * speed;
    part.velocity.z = nz * speed;

    // A hair of separation, so the brick is not still inside the player when the
    // player's own step is resolved.
    part.position.x += nx * 0.02f;
    part.position.z += nz * 0.02f;
  }
}

XMFLOAT3 CarryBy(const std::vector<Part>& parts, const XMFLOAT3& playerFeet,
                 float deltaSeconds) {
  for (const Part& part : parts) {
    if (part.anchored || !part.collides) continue;

    const Bounds bounds = BoundsOf(part);

    if (playerFeet.x < bounds.minimum.x - 0.2f ||
        playerFeet.x > bounds.maximum.x + 0.2f) {
      continue;
    }
    if (playerFeet.z < bounds.minimum.z - 0.2f ||
        playerFeet.z > bounds.maximum.z + 0.2f) {
      continue;
    }
    if (bounds.maximum.y > playerFeet.y + 0.35f ||
        bounds.maximum.y < playerFeet.y - 0.6f) {
      continue;
    }

    return {part.velocity.x * deltaSeconds, 0.0f,
            part.velocity.z * deltaSeconds};
  }

  return {0.0f, 0.0f, 0.0f};
}

}  // namespace fieldbrik
