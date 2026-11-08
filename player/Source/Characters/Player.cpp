#include "Characters/Player.h"

#include <algorithm>
#include <cmath>

#include "Physics/Physics.h"

using namespace DirectX;

namespace fieldbrik {
namespace {

constexpr float kWalkSpeed = 16.0f;        // studs per second
constexpr float kGroundAccel = 110.0f;     // studs per second squared
constexpr float kAirAccel = 22.0f;         // less steering in the air
constexpr float kGroundDamping = 12.0f;    // how fast you come to a stop
constexpr float kGravity = -60.0f;
constexpr float kJumpSpeed = 24.0f;        // clears a 1-stud brick comfortably
constexpr float kMaxFallSpeed = 140.0f;
constexpr float kTurnBlend = 14.0f;        // how quickly the body swings round

// The player is moved in slices this small, so nothing is ever stepped over:
// at 16 studs per second a frame moves about a quarter of a stud, and a jump
// lands at roughly one stud per frame.
constexpr float kSubstep = 0.2f;
constexpr int kMaxSubsteps = 64;

// Below this there is nothing left to stand on, so the player is put back.
constexpr float kRespawnBelow = -60.0f;

float Approach(float value, float target, float maxDelta) {
  const float difference = target - value;
  if (std::fabs(difference) <= maxDelta) return target;
  return value + (difference > 0.0f ? maxDelta : -maxDelta);
}

float ShortestArc(float from, float to) {
  float difference = to - from;
  while (difference > 180.0f) difference -= 360.0f;
  while (difference < -180.0f) difference += 360.0f;
  return difference;
}

}  // namespace

void Player::Spawn(const XMFLOAT3& feetPosition) {
  spawn_ = feetPosition;
  position_ = feetPosition;
  velocity_ = {0.0f, 0.0f, 0.0f};
  grounded_ = false;

  // Facing -Z, which is where the bricks are. The camera starts behind him, so
  // the first frame reads as "you are standing here, the build is in front".
  facing_ = 180.0f;
}

void Player::Respawn() {
  position_ = spawn_;
  velocity_ = {0.0f, 0.0f, 0.0f};
  grounded_ = false;
  facing_ = 180.0f;
}

void Player::Update(const Input& input, const std::vector<Part>& parts,
                    float cameraYawDegrees, float deltaSeconds) {
  float forwardInput = 0.0f;
  float rightInput = 0.0f;

  if (input.KeyDown('W')) forwardInput += 1.0f;
  if (input.KeyDown('S')) forwardInput -= 1.0f;
  if (input.KeyDown('D')) rightInput += 1.0f;
  if (input.KeyDown('A')) rightInput -= 1.0f;

  // The camera looks from its eye towards the target, so the ground direction it
  // faces is the negation of the eye offset.
  const float yaw = XMConvertToRadians(cameraYawDegrees);
  const float forwardX = -std::sin(yaw);
  const float forwardZ = std::cos(yaw);
  const float rightX = std::cos(yaw);
  const float rightZ = -std::sin(yaw);

  float moveX = forwardX * forwardInput + rightX * rightInput;
  float moveZ = forwardZ * forwardInput + rightZ * rightInput;

  const float length = std::sqrt(moveX * moveX + moveZ * moveZ);
  const bool wantsToMove = length > 0.0001f;

  if (wantsToMove) {
    moveX /= length;
    moveZ /= length;
  }

  // Steering: reach walking speed in a fraction of a second on the ground, and
  // slower in the air, so a jump keeps the momentum it started with.
  const float accel = grounded_ ? kGroundAccel : kAirAccel;
  velocity_.x = Approach(velocity_.x, moveX * kWalkSpeed, accel * deltaSeconds);
  velocity_.z = Approach(velocity_.z, moveZ * kWalkSpeed, accel * deltaSeconds);

  // Standing still on the ground means grip, not a long slide.
  if (grounded_ && !wantsToMove) {
    const float damping = std::exp(-kGroundDamping * deltaSeconds);
    velocity_.x *= damping;
    velocity_.z *= damping;
  }

  // Jump before gravity is applied, so the first frame of a jump is not eaten.
  if (grounded_ && input.KeyPressed(VK_SPACE)) {
    velocity_.y = kJumpSpeed;
    grounded_ = false;
  }

  velocity_.y = std::max(velocity_.y + kGravity * deltaSeconds, -kMaxFallSpeed);

  // One frame's travel, cut into slices small enough that a thin brick cannot be
  // passed through.
  const float travel = std::max(
      {std::fabs(velocity_.x * deltaSeconds), std::fabs(velocity_.y * deltaSeconds),
       std::fabs(velocity_.z * deltaSeconds)});
  const int substeps = std::clamp(
      static_cast<int>(std::ceil(travel / kSubstep)), 1, kMaxSubsteps);

  const float stepX = velocity_.x * deltaSeconds / substeps;
  const float stepY = velocity_.y * deltaSeconds / substeps;
  const float stepZ = velocity_.z * deltaSeconds / substeps;

  bool grounded = false;

  for (int step = 0; step < substeps; ++step) {
    position_.x += stepX;
    position_.y += stepY;
    position_.z += stepZ;

    const Contact contact = ResolvePlayer(parts, position_);

    if (contact.grounded) {
      // Landed: whatever is left of the fall stops here.
      grounded = true;
      velocity_.y = 0.0f;
    } else if (contact.hitCeiling) {
      velocity_.y = std::min(velocity_.y, 0.0f);
    }
  }

  grounded_ = grounded;
  if (grounded_) velocity_.y = 0.0f;

  // Face the direction of travel, easing so a tap of D does not snap the body.
  const float horizontalSpeed = std::sqrt(velocity_.x * velocity_.x +
                                          velocity_.z * velocity_.z);
  if (horizontalSpeed > 0.5f) {
    const float desired = XMConvertToDegrees(std::atan2(velocity_.x, velocity_.z));
    const float blend = 1.0f - std::exp(-kTurnBlend * deltaSeconds);
    facing_ += ShortestArc(facing_, desired) * blend;
  }

  if (position_.y < kRespawnBelow) Respawn();
}

}  // namespace fieldbrik
