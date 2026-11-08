#include "Characters/Player.h"

#include <algorithm>
#include <cmath>

using namespace DirectX;

namespace fieldbrik {
namespace {

constexpr float kWalkSpeed = 16.0f;      // studs per second
constexpr float kTurnBlend = 14.0f;      // how quickly the body swings round
constexpr float kBaseplateHalf = 38.0f;  // stops short of the 80-stud edge

float ShortestArc(float from, float to) {
  float difference = to - from;
  while (difference > 180.0f) difference -= 360.0f;
  while (difference < -180.0f) difference += 360.0f;
  return difference;
}

}  // namespace

void Player::Spawn(const XMFLOAT3& feetPosition) {
  position_ = feetPosition;

  // Facing -Z, which is where the bricks are. The camera starts behind him, so
  // the first frame reads as "you are standing here, the build is in front".
  facing_ = 180.0f;
}

void Player::Update(const Input& input, float cameraYawDegrees,
                    float deltaSeconds) {
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
  if (length < 0.0001f) return;

  moveX /= length;
  moveZ /= length;

  position_.x = std::clamp(position_.x + moveX * kWalkSpeed * deltaSeconds,
                           -kBaseplateHalf, kBaseplateHalf);
  position_.z = std::clamp(position_.z + moveZ * kWalkSpeed * deltaSeconds,
                           -kBaseplateHalf, kBaseplateHalf);

  // Face the direction of travel, easing so a tap of D does not snap the body.
  const float desired = XMConvertToDegrees(std::atan2(moveX, moveZ));
  const float blend = 1.0f - std::exp(-kTurnBlend * deltaSeconds);
  facing_ += ShortestArc(facing_, desired) * blend;
}

}  // namespace fieldbrik
