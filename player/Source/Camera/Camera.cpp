#include "Camera/Camera.h"

#include <algorithm>
#include <cmath>

using namespace DirectX;

namespace fieldbrik {
namespace {

constexpr float kMinPitch = -12.0f;
constexpr float kMaxPitch = 78.0f;
constexpr float kMinDistance = 6.0f;
constexpr float kMaxDistance = 60.0f;
constexpr float kOrbitDegreesPerPixel = 0.30f;
constexpr float kZoomPerStep = 2.0f;

float Ease(float deltaSeconds, float rate) {
  return 1.0f - std::exp(-rate * deltaSeconds);
}

}  // namespace

void Camera::SetViewport(int width, int height) {
  width_ = width > 0 ? width : 1;
  height_ = height > 0 ? height : 1;
}

void Camera::SetTarget(const XMFLOAT3& point) { focusGoal_ = point; }

void Camera::SnapToTarget() { focus_ = focusGoal_; }

void Camera::Update(float deltaSeconds) {
  // Frame-rate independent easing: the same feel at 60 and at 144 fps.
  const float blend = Ease(deltaSeconds, 18.0f);
  yaw_ += (targetYaw_ - yaw_) * blend;
  pitch_ += (targetPitch_ - pitch_) * blend;
  distance_ += (targetDistance_ - distance_) * blend;

  // The follow point trails slightly behind the avatar, which reads as weight
  // rather than a camera welded to its back.
  const float follow = Ease(deltaSeconds, 10.0f);
  focus_.x += (focusGoal_.x - focus_.x) * follow;
  focus_.y += (focusGoal_.y - focus_.y) * follow;
  focus_.z += (focusGoal_.z - focus_.z) * follow;
}

void Camera::Orbit(float deltaX, float deltaY) {
  // Dragging right turns the view right: subtracting, because the eye orbits the
  // target in the opposite direction to the way the view swings.
  targetYaw_ -= deltaX * kOrbitDegreesPerPixel;
  targetPitch_ = std::clamp(targetPitch_ + deltaY * kOrbitDegreesPerPixel, kMinPitch,
                            kMaxPitch);
}

void Camera::Zoom(float steps) {
  targetDistance_ =
      std::clamp(targetDistance_ + steps * kZoomPerStep, kMinDistance, kMaxDistance);
}

void Camera::Reset() {
  targetYaw_ = 180.0f;
  targetPitch_ = 20.0f;
  targetDistance_ = 20.0f;
}

XMFLOAT3 Camera::Position() const {
  // A brick behind the player wins over the distance being asked for.
  const float distance = std::min(distance_, maxDistance_);

  const float yaw = XMConvertToRadians(yaw_);
  const float pitch = XMConvertToRadians(pitch_);
  const float horizontal = std::cos(pitch) * distance;

  XMFLOAT3 position;
  position.x = focus_.x + std::sin(yaw) * horizontal;
  position.y = focus_.y + std::sin(pitch) * distance;
  position.z = focus_.z - std::cos(yaw) * horizontal;
  return position;
}

XMMATRIX Camera::ViewProjection() const {
  const XMFLOAT3 position = Position();

  const XMVECTOR eye = XMLoadFloat3(&position);
  const XMVECTOR target = XMLoadFloat3(&focus_);
  const XMVECTOR up = XMVectorSet(0.0f, 1.0f, 0.0f, 0.0f);

  const XMMATRIX view = XMMatrixLookAtLH(eye, target, up);

  const float aspect =
      static_cast<float>(width_) / static_cast<float>(height_ > 0 ? height_ : 1);
  const XMMATRIX projection =
      XMMatrixPerspectiveFovLH(XMConvertToRadians(58.0f), aspect, 0.1f, 400.0f);

  return view * projection;
}

}  // namespace fieldbrik
