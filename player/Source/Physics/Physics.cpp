#include "Physics/Physics.h"

#include <algorithm>
#include <cfloat>
#include <cmath>

using namespace DirectX;

namespace fieldbrik {
namespace {

// A hair of separation left behind after a push, so the next frame starts from
// "touching" rather than from a fresh overlap and the player does not jitter.
constexpr float kSkin = 0.001f;

// Two passes settle the corners where a player is wedged between two bricks:
// pushing out of one can push it into the other.
constexpr int kPasses = 2;

// Pushes the player out of one brick, if they overlap it at all.
void ResolveOne(const Part& part, XMFLOAT3& feet, Contact& contact) {
  if (!part.collides) return;

  const XMMATRIX rotate = part.RotationMatrix();
  const XMMATRIX inverseRotate = XMMatrixTranspose(rotate);

  // World -> part space: undo the brick's translation, then its rotation.
  const XMVECTOR partCentre = XMLoadFloat3(&part.position);
  const XMVECTOR playerCentre =
      XMVectorSet(feet.x, feet.y + kPlayerHeight * 0.5f, feet.z, 0.0f);

  const float halfHeight = kPlayerHeight * 0.5f;

  XMVECTOR localMin = XMVectorReplicate(FLT_MAX);
  XMVECTOR localMax = XMVectorReplicate(-FLT_MAX);

  for (int corner = 0; corner < 8; ++corner) {
    const float offsetX = (corner & 1) ? kPlayerHalfWidth : -kPlayerHalfWidth;
    const float offsetY = (corner & 2) ? halfHeight : -halfHeight;
    const float offsetZ = (corner & 4) ? kPlayerHalfWidth : -kPlayerHalfWidth;

    const XMVECTOR world = XMVectorAdd(
        playerCentre, XMVectorSet(offsetX, offsetY, offsetZ, 0.0f));

    // Rotation only: the translation is already gone, and TransformCoord would
    // divide by a w that is zero here, turning every corner into infinity.
    const XMVECTOR local =
        XMVector3TransformNormal(XMVectorSubtract(world, partCentre), inverseRotate);

    localMin = XMVectorMin(localMin, local);
    localMax = XMVectorMax(localMax, local);
  }

  XMFLOAT3 minimum{};
  XMFLOAT3 maximum{};
  XMStoreFloat3(&minimum, localMin);
  XMStoreFloat3(&maximum, localMax);

  // Overlap on each of the brick's own axes. Any axis that does not overlap means
  // there is no collision at all.
  const float half[3] = {part.size.x * 0.5f, part.size.y * 0.5f,
                         part.size.z * 0.5f};
  float overlap[3];
  overlap[0] = std::min(maximum.x, half[0]) - std::max(minimum.x, -half[0]);
  overlap[1] = std::min(maximum.y, half[1]) - std::max(minimum.y, -half[1]);
  overlap[2] = std::min(maximum.z, half[2]) - std::max(minimum.z, -half[2]);

  if (overlap[0] <= 0.0f || overlap[1] <= 0.0f || overlap[2] <= 0.0f) return;

  // Leaving by the shallowest axis costs the least correction, which is what
  // reads as sliding along a wall rather than being thrown off it.
  int axis = 0;
  if (overlap[1] < overlap[axis]) axis = 1;
  if (overlap[2] < overlap[axis]) axis = 2;

  const float centre[3] = {(minimum.x + maximum.x) * 0.5f,
                           (minimum.y + maximum.y) * 0.5f,
                           (minimum.z + maximum.z) * 0.5f};
  const float sign = centre[axis] >= 0.0f ? 1.0f : -1.0f;

  float push[3] = {0.0f, 0.0f, 0.0f};
  push[axis] = (overlap[axis] + kSkin) * sign;

  const XMVECTOR worldPush =
      XMVector3TransformNormal(XMVectorSet(push[0], push[1], push[2], 0.0f), rotate);

  XMFLOAT3 correction{};
  XMStoreFloat3(&correction, worldPush);
  feet.x += correction.x;
  feet.y += correction.y;
  feet.z += correction.z;

  // Pushed up out of a brick means standing on it; pushed down means the head hit
  // the underside of something.
  if (axis == 1) {
    if (sign > 0.0f) {
      contact.grounded = true;
    } else {
      contact.hitCeiling = true;
    }
  }
}

}  // namespace

Contact ResolvePlayer(const std::vector<Part>& parts, XMFLOAT3& feet) {
  Contact contact;

  for (int pass = 0; pass < kPasses; ++pass) {
    for (const Part& part : parts) {
      ResolveOne(part, feet, contact);
    }
  }

  return contact;
}

bool IsBlocked(const std::vector<Part>& parts, const XMFLOAT3& feet) {
  XMFLOAT3 probe = feet;
  ResolvePlayer(parts, probe);

  const float dx = probe.x - feet.x;
  const float dy = probe.y - feet.y;
  const float dz = probe.z - feet.z;
  return dx * dx + dy * dy + dz * dz > 1e-6f;
}

float RayCastParts(const std::vector<Part>& parts, const XMFLOAT3& origin,
                   const XMFLOAT3& direction, float maxDistance) {
  float nearest = maxDistance;

  const XMVECTOR originVector = XMLoadFloat3(&origin);
  const XMVECTOR directionVector = XMLoadFloat3(&direction);

  for (const Part& part : parts) {
    if (!part.collides) continue;

    // The ray is taken into the brick's own space, where the brick is an
    // axis-aligned box and the test is three slabs.
    const XMMATRIX rotate = part.RotationMatrix();
    const XMMATRIX inverseRotate = XMMatrixTranspose(rotate);

    XMFLOAT3 localOrigin{};
    XMFLOAT3 localDirection{};
    XMStoreFloat3(&localOrigin,
                  XMVector3TransformNormal(
                      XMVectorSubtract(originVector, XMLoadFloat3(&part.position)),
                      inverseRotate));
    XMStoreFloat3(&localDirection,
                  XMVector3TransformNormal(directionVector, inverseRotate));

    const float half[3] = {part.size.x * 0.5f, part.size.y * 0.5f,
                           part.size.z * 0.5f};
    const float start[3] = {localOrigin.x, localOrigin.y, localOrigin.z};
    const float step[3] = {localDirection.x, localDirection.y, localDirection.z};

    float enter = 0.0f;
    float exit = nearest;
    bool hit = true;

    for (int axis = 0; axis < 3 && hit; ++axis) {
      if (std::fabs(step[axis]) < 1e-6f) {
        // Parallel to this pair of faces: either inside them for the whole ray or
        // never touching them.
        if (start[axis] < -half[axis] || start[axis] > half[axis]) hit = false;
        continue;
      }

      const float inverse = 1.0f / step[axis];
      float near = (-half[axis] - start[axis]) * inverse;
      float far = (half[axis] - start[axis]) * inverse;
      if (near > far) std::swap(near, far);

      enter = std::max(enter, near);
      exit = std::min(exit, far);
      if (enter > exit) hit = false;
    }

    if (hit && enter < nearest) nearest = enter;
  }

  return nearest;
}

}  // namespace fieldbrik
