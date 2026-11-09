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

// The player's box, in the part's own space.
struct LocalBox {
  XMFLOAT3 minimum;
  XMFLOAT3 maximum;
};

float Length(const XMFLOAT3& value) {
  return std::sqrt(value.x * value.x + value.y * value.y + value.z * value.z);
}

// Moves the player by a push given in the part's own space and says what kind of
// contact it reads as. A push that is mostly upwards is standing on something;
// mostly downwards is the head hitting an underside. A slanted push - the face of
// a wedge - counts as ground, because a slope is walked on rather than slid off.
void ApplyPush(const XMMATRIX& rotate, const XMFLOAT3& push, XMFLOAT3& feet,
               Contact& contact) {
  const XMVECTOR worldPush =
      XMVector3TransformNormal(XMVectorSet(push.x, push.y, push.z, 0.0f), rotate);

  XMFLOAT3 correction{};
  XMStoreFloat3(&correction, worldPush);

  feet.x += correction.x;
  feet.y += correction.y;
  feet.z += correction.z;

  contact.push.x += correction.x;
  contact.push.y += correction.y;
  contact.push.z += correction.z;

  const float length = Length(correction);
  if (length < 1e-6f) return;

  const float upward = correction.y / length;
  if (upward >= kWalkableSlopeNormal) contact.grounded = true;
  if (upward <= -kWalkableSlopeNormal) contact.hitCeiling = true;
}

// The lowest value a plane's own function takes over the player's box, which is
// always at one of the box's corners.
float LowestPlaneValue(const XMFLOAT3& normal, float offset,
                       const LocalBox& box) {
  const float dot =
      normal.x * (normal.x >= 0.0f ? box.minimum.x : box.maximum.x) +
      normal.y * (normal.y >= 0.0f ? box.minimum.y : box.maximum.y) +
      normal.z * (normal.z >= 0.0f ? box.minimum.z : box.maximum.z);
  return dot - offset;
}

// A wedge is the space inside five faces: the bottom, the full-height back, the
// two sides, and the slope from the top back edge to the bottom front edge.
// Whichever face the player is closest to being through is the one they leave by,
// so a player standing on the slope is pushed along the slope, not sideways.
bool ResolveWedge(const Part& part, const LocalBox& box, const XMMATRIX& rotate,
                  XMFLOAT3& feet, Contact& contact) {
  const float hx = part.size.x * 0.5f;
  const float hy = part.size.y * 0.5f;
  const float hz = part.size.z * 0.5f;

  if (hx <= 0.0f || hy <= 0.0f || hz <= 0.0f) return false;

  const float slopeLength = std::sqrt(hy * hy + hz * hz);
  if (slopeLength < 1e-5f) return false;

  struct Plane {
    XMFLOAT3 normal;
    float offset;
  };

  // Inside the wedge, normal . p <= offset holds for every one of these.
  const Plane planes[5] = {
      {{0.0f, -1.0f, 0.0f}, hy},          // bottom
      {{0.0f, 0.0f, -1.0f}, hz},          // back, the full-height face
      {{-1.0f, 0.0f, 0.0f}, hx},          // left
      {{1.0f, 0.0f, 0.0f}, hx},           // right
      {{0.0f, hz / slopeLength, hy / slopeLength}, 0.0f},  // the slope
  };

  float cheapest = FLT_MAX;
  XMFLOAT3 direction{0.0f, 1.0f, 0.0f};

  for (const Plane& plane : planes) {
    const float lowest = LowestPlaneValue(plane.normal, plane.offset, box);

    // The whole box is on the far side of one face, so it never met the wedge.
    if (lowest >= 0.0f) return false;

    const float push = -lowest;
    if (push < cheapest) {
      cheapest = push;
      direction = plane.normal;
    }
  }

  const float distance = cheapest + kSkin;
  ApplyPush(rotate,
            {direction.x * distance, direction.y * distance,
             direction.z * distance},
            feet, contact);
  return true;
}

// A sphere is an ellipsoid in the part's own space, so the test happens in the
// space where it is a unit sphere: the closest point on the player's box there is
// three clamps, and its length says whether the box reaches the surface.
bool ResolveSphere(const Part& part, const LocalBox& box, const XMMATRIX& rotate,
                   XMFLOAT3& feet, Contact& contact) {
  const float rx = part.size.x * 0.5f;
  const float ry = part.size.y * 0.5f;
  const float rz = part.size.z * 0.5f;

  if (rx <= 0.0f || ry <= 0.0f || rz <= 0.0f) return false;

  const float minX = box.minimum.x / rx;
  const float maxX = box.maximum.x / rx;
  const float minY = box.minimum.y / ry;
  const float maxY = box.maximum.y / ry;
  const float minZ = box.minimum.z / rz;
  const float maxZ = box.maximum.z / rz;

  const float qx = std::clamp(0.0f, minX, maxX);
  const float qy = std::clamp(0.0f, minY, maxY);
  const float qz = std::clamp(0.0f, minZ, maxZ);

  XMFLOAT3 push{0.0f, 0.0f, 0.0f};

  const bool centreInside = minX <= 0.0f && maxX >= 0.0f && minY <= 0.0f &&
                            maxY >= 0.0f && minZ <= 0.0f && maxZ >= 0.0f;

  if (centreInside) {
    // The ball's centre is inside the player: leave by the nearest face, far
    // enough that the whole ball is clear of it.
    float best = -minX;
    int axis = 0;
    float sign = -1.0f;

    if (maxX < best) {
      best = maxX;
      axis = 0;
      sign = 1.0f;
    }
    if (-minY < best) {
      best = -minY;
      axis = 1;
      sign = -1.0f;
    }
    if (maxY < best) {
      best = maxY;
      axis = 1;
      sign = 1.0f;
    }
    if (-minZ < best) {
      best = -minZ;
      axis = 2;
      sign = -1.0f;
    }
    if (maxZ < best) {
      best = maxZ;
      axis = 2;
      sign = 1.0f;
    }

    const float room = best + 1.0f + kSkin;
    if (axis == 0) push.x = sign * room * rx;
    if (axis == 1) push.y = sign * room * ry;
    if (axis == 2) push.z = sign * room * rz;
  } else {
    const float distance = std::sqrt(qx * qx + qy * qy + qz * qz);

    // Beyond the surface, or exactly on the centre: nothing to push.
    if (distance >= 1.0f || distance < 1e-5f) return false;

    // From the closest point out to the surface along the same direction.
    const float reach = 1.0f / distance - 1.0f;
    push = {qx * reach * rx, qy * reach * ry, qz * reach * rz};

    const float length = Length(push);
    if (length > 1e-5f) {
      push.x += push.x / length * kSkin;
      push.y += push.y / length * kSkin;
      push.z += push.z / length * kSkin;
    }
  }

  if (Length(push) < 1e-6f) return false;

  ApplyPush(rotate, push, feet, contact);
  return true;
}

// A cylinder is an elliptical barrel: a round side between two flat caps. The
// player can leave over the top, under the bottom, or out of the side, and the
// cheapest of the three is the one that happened.
bool ResolveCylinder(const Part& part, const LocalBox& box,
                     const XMMATRIX& rotate, XMFLOAT3& feet, Contact& contact) {
  const float rx = part.size.x * 0.5f;
  const float ry = part.size.y * 0.5f;
  const float rz = part.size.z * 0.5f;

  if (rx <= 0.0f || ry <= 0.0f || rz <= 0.0f) return false;

  // Above the top cap or below the bottom one: the barrel is not in reach.
  if (box.maximum.y <= -ry || box.minimum.y >= ry) return false;

  // The cross-section is an ellipse, so the round test happens in the space where
  // the ellipse is a circle of radius one.
  const float scaledMinX = box.minimum.x / rx;
  const float scaledMaxX = box.maximum.x / rx;
  const float scaledMinZ = box.minimum.z / rz;
  const float scaledMaxZ = box.maximum.z / rz;

  const float cx = std::clamp(0.0f, scaledMinX, scaledMaxX);
  const float cz = std::clamp(0.0f, scaledMinZ, scaledMaxZ);
  const float radial = std::sqrt(cx * cx + cz * cz);

  if (radial >= 1.0f) return false;

  const float up = ry - box.minimum.y;
  const float down = box.maximum.y + ry;

  float pushX = 0.0f;
  float pushZ = 0.0f;
  float side = 0.0f;

  if (radial > 1e-4f) {
    // From the closest point out to the surface, then a skin further.
    pushX = (cx / radial - cx) * rx;
    pushZ = (cz / radial - cz) * rz;
    side = std::sqrt(pushX * pushX + pushZ * pushZ);

    pushX += cx / radial * kSkin;
    pushZ += cz / radial * kSkin;
    side += kSkin;
  } else {
    // The player is over the axis: any way out is as short as another, so use the
    // player's own displacement from the axis and fall back to +X.
    const float centreX = (box.minimum.x + box.maximum.x) * 0.5f;
    const float centreZ = (box.minimum.z + box.maximum.z) * 0.5f;
    const float length = std::sqrt(centreX * centreX + centreZ * centreZ);

    const float dirX = length > 1e-4f ? centreX / length : 1.0f;
    const float dirZ = length > 1e-4f ? centreZ / length : 0.0f;

    side = std::max(rx, rz) + kSkin;
    pushX = dirX * side;
    pushZ = dirZ * side;
  }

  if (up <= down && up <= side) {
    ApplyPush(rotate, {0.0f, up + kSkin, 0.0f}, feet, contact);
  } else if (down <= side) {
    ApplyPush(rotate, {0.0f, -(down + kSkin), 0.0f}, feet, contact);
  } else {
    ApplyPush(rotate, {pushX, 0.0f, pushZ}, feet, contact);
  }

  return true;
}

// Pushes the player out of one part, if they overlap it at all.
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

  LocalBox box{};
  XMStoreFloat3(&box.minimum, localMin);
  XMStoreFloat3(&box.maximum, localMax);

  if (part.shape == PartShape::Wedge) {
    ResolveWedge(part, box, rotate, feet, contact);
    return;
  }
  if (part.shape == PartShape::Sphere) {
    ResolveSphere(part, box, rotate, feet, contact);
    return;
  }
  if (part.shape == PartShape::Cylinder) {
    ResolveCylinder(part, box, rotate, feet, contact);
    return;
  }

  // Overlap on each of the brick's own axes. Any axis that does not overlap means
  // there is no collision at all.
  const float half[3] = {part.size.x * 0.5f, part.size.y * 0.5f,
                         part.size.z * 0.5f};
  float overlap[3];
  overlap[0] = std::min(box.maximum.x, half[0]) - std::max(box.minimum.x, -half[0]);
  overlap[1] = std::min(box.maximum.y, half[1]) - std::max(box.minimum.y, -half[1]);
  overlap[2] = std::min(box.maximum.z, half[2]) - std::max(box.minimum.z, -half[2]);

  if (overlap[0] <= 0.0f || overlap[1] <= 0.0f || overlap[2] <= 0.0f) return;

  // Leaving by the shallowest axis costs the least correction, which is what
  // reads as sliding along a wall rather than being thrown off it.
  int axis = 0;
  if (overlap[1] < overlap[axis]) axis = 1;
  if (overlap[2] < overlap[axis]) axis = 2;

  const float centre[3] = {(box.minimum.x + box.maximum.x) * 0.5f,
                           (box.minimum.y + box.maximum.y) * 0.5f,
                           (box.minimum.z + box.maximum.z) * 0.5f};
  const float sign = centre[axis] >= 0.0f ? 1.0f : -1.0f;

  XMFLOAT3 push{0.0f, 0.0f, 0.0f};
  const float distance = overlap[axis] + kSkin;
  if (axis == 0) push.x = distance * sign;
  if (axis == 1) push.y = distance * sign;
  if (axis == 2) push.z = distance * sign;

  ApplyPush(rotate, push, feet, contact);
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
    // axis-aligned box and the test is three slabs. Shapes are still tested as
    // their bounding boxes here: this is what keeps the camera out of a brick,
    // and being a fraction of a stud conservative at a corner does not show.
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
