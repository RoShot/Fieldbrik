#include "Camera/Camera.h"

#include <algorithm>
#include <cmath>

using namespace DirectX;

namespace fieldbrik {
namespace {

constexpr float kMinPitch = -12.0f;
constexpr float kMaxPitch = 78.0f;

// First person has no body between the eye and the sky and no floor for the camera
// to be pushed through, so it can look nearly straight up and down.
constexpr float kMinFirstPersonPitch = -85.0f;
constexpr float kMaxFirstPersonPitch = 85.0f;

constexpr float kOrbitDegreesPerPixel = 0.30f;
constexpr float kFieldOfViewDegrees = 58.0f;
constexpr float kNearPlane = 0.1f;
constexpr float kFarPlane = 400.0f;

float Ease(float deltaSeconds, float rate) {
  return 1.0f - std::exp(-rate * deltaSeconds);
}

// The unit offset from the focus point towards the camera, for a yaw and a pitch.
// Position scales it by the distance and the view looks back down its negation,
// so the two can never disagree about which way the camera faces.
XMFLOAT3 EyeDirection(float yawDegrees, float pitchDegrees) {
  const float yaw = XMConvertToRadians(yawDegrees);
  const float pitch = XMConvertToRadians(pitchDegrees);
  const float horizontal = std::cos(pitch);
  return {std::sin(yaw) * horizontal, std::sin(pitch),
          -std::cos(yaw) * horizontal};
}

}  // namespace

void Camera::SetViewport(int width, int height) {
  width_ = width > 0 ? width : 1;
  height_ = height > 0 ? height : 1;
}

void Camera::SetTarget(const XMFLOAT3& point) { focusGoal_ = point; }

void Camera::SnapToTarget() { focus_ = focusGoal_; }

void Camera::Update(float deltaSeconds) {
  // Frame-rate independent easing: the same feel at 60 and at 144 fps. Only the
  // angles ease; the distance is a notch and snaps, because a zoom that slides
  // between steps is the one thing the era's wheel never did.
  const float blend = Ease(deltaSeconds, 18.0f);
  yaw_ += (targetYaw_ - yaw_) * blend;
  pitch_ += (targetPitch_ - pitch_) * blend;

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
  // The third-person camera has a floor to stay above, so it keeps the narrow
  // pitch range; first person can look almost straight up and down.
  const float lowest = FirstPerson() ? kMinFirstPersonPitch : kMinPitch;
  const float highest = FirstPerson() ? kMaxFirstPersonPitch : kMaxPitch;
  targetPitch_ = std::clamp(targetPitch_ + deltaY * kOrbitDegreesPerPixel, lowest,
                            highest);
}

void Camera::Zoom(float notches) {
  const int was = zoom_;
  const long wanted =
      static_cast<long>(zoom_) + static_cast<long>(std::lround(notches));
  zoom_ = static_cast<int>(std::clamp<long>(wanted, 0, kZoomLevels));

  // Stepping back out of first person: the camera cannot sit that far up or down
  // without going through the world, so the pitch comes back into its range.
  if (was == 0 && zoom_ > 0) {
    targetPitch_ = std::clamp(targetPitch_, kMinPitch, kMaxPitch);
  }
}

void Camera::Reset() {
  targetYaw_ = 180.0f;
  targetPitch_ = 20.0f;
  zoom_ = kDefaultZoomLevel;
}

XMFLOAT3 Camera::Position() const {
  // A brick behind the player wins over the distance being asked for.
  const float distance = std::min(Distance(), maxDistance_);
  const XMFLOAT3 direction = EyeDirection(yaw_, pitch_);

  XMFLOAT3 position;
  position.x = focus_.x + direction.x * distance;
  position.y = focus_.y + direction.y * distance;
  position.z = focus_.z + direction.z * distance;
  return position;
}

XMMATRIX Camera::ViewProjection() const {
  const XMFLOAT3 position = Position();
  const XMFLOAT3 direction = EyeDirection(yaw_, pitch_);

  const XMVECTOR eye = XMLoadFloat3(&position);

  // Look back down the eye offset rather than at the focus point: in first person
  // the eye and the focus are the same place, and a LookAt from a point to itself
  // has no direction at all.
  const XMVECTOR forward =
      XMVectorSet(-direction.x, -direction.y, -direction.z, 0.0f);
  const XMVECTOR up = XMVectorSet(0.0f, 1.0f, 0.0f, 0.0f);

  const XMMATRIX view = XMMatrixLookAtLH(eye, XMVectorAdd(eye, forward), up);

  const float aspect =
      static_cast<float>(width_) / static_cast<float>(height_ > 0 ? height_ : 1);
  const XMMATRIX projection = XMMatrixPerspectiveFovLH(
      XMConvertToRadians(kFieldOfViewDegrees), aspect, kNearPlane, kFarPlane);

  return view * projection;
}

Camera::SkyBasis Camera::SkyRayBasis() const {
  // The same axes the view matrix is built from, so the sky and the bricks look
  // out along exactly the same directions.
  const XMFLOAT3 position = Position();
  const XMFLOAT3 direction = EyeDirection(yaw_, pitch_);
  const XMVECTOR eye = XMLoadFloat3(&position);
  const XMVECTOR up = XMVectorSet(0.0f, 1.0f, 0.0f, 0.0f);

  const XMVECTOR forward =
      XMVectorSet(-direction.x, -direction.y, -direction.z, 0.0f);
  XMVECTOR right = XMVector3Normalize(XMVector3Cross(up, forward));
  XMVECTOR cameraUp = XMVector3Cross(forward, right);

  // The half tangents: at the edge of the screen the ray leans out by tan(fov/2)
  // horizontally and vertically, and the shader should not have to know either
  // the field of view or the aspect ratio.
  const float vertical =
      std::tan(XMConvertToRadians(kFieldOfViewDegrees) * 0.5f);
  const float aspect =
      static_cast<float>(width_) / static_cast<float>(height_ > 0 ? height_ : 1);

  right = XMVectorScale(right, vertical * aspect);
  cameraUp = XMVectorScale(cameraUp, vertical);

  SkyBasis basis;
  XMStoreFloat3(&basis.forward, forward);
  XMStoreFloat3(&basis.right, right);
  XMStoreFloat3(&basis.up, cameraUp);
  return basis;
}

}  // namespace fieldbrik
