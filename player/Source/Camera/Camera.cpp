#include "Camera/Camera.h"

#include <algorithm>
#include <cmath>

using namespace DirectX;

namespace fieldbrik {
namespace {

constexpr float kMinPitch = -8.0f;
constexpr float kMaxPitch = 82.0f;
constexpr float kMinDistance = 10.0f;
constexpr float kMaxDistance = 140.0f;
constexpr float kOrbitDegreesPerPixel = 0.28f;
constexpr float kZoomPerStep = 4.0f;

}  // namespace

void Camera::SetViewport(int width, int height) {
  width_ = width > 0 ? width : 1;
  height_ = height > 0 ? height : 1;
}

void Camera::Update(float deltaSeconds) {
  // Frame-rate independent easing: the same feel at 60 and at 144 fps.
  const float blend = 1.0f - std::exp(-16.0f * deltaSeconds);
  yaw_ += (targetYaw_ - yaw_) * blend;
  pitch_ += (targetPitch_ - pitch_) * blend;
  distance_ += (targetDistance_ - distance_) * blend;
}

void Camera::Orbit(float deltaX, float deltaY) {
  targetYaw_ += deltaX * kOrbitDegreesPerPixel;
  targetPitch_ = std::clamp(targetPitch_ + deltaY * kOrbitDegreesPerPixel, kMinPitch,
                            kMaxPitch);
}

void Camera::Zoom(float steps) {
  targetDistance_ =
      std::clamp(targetDistance_ + steps * kZoomPerStep, kMinDistance, kMaxDistance);
}

void Camera::Reset() {
  targetYaw_ = 35.0f;
  targetPitch_ = 28.0f;
  targetDistance_ = 52.0f;
}

XMFLOAT3 Camera::Position() const {
  const float yaw = XMConvertToRadians(yaw_);
  const float pitch = XMConvertToRadians(pitch_);
  const float horizontal = std::cos(pitch) * distance_;

  XMFLOAT3 position;
  position.x = target_.x + std::sin(yaw) * horizontal;
  position.y = target_.y + std::sin(pitch) * distance_;
  position.z = target_.z - std::cos(yaw) * horizontal;
  return position;
}

XMMATRIX Camera::ViewProjection() const {
  const XMFLOAT3 position = Position();

  const XMVECTOR eye = XMLoadFloat3(&position);
  const XMVECTOR target = XMLoadFloat3(&target_);
  const XMVECTOR up = XMVectorSet(0.0f, 1.0f, 0.0f, 0.0f);

  const XMMATRIX view = XMMatrixLookAtLH(eye, target, up);

  const float aspect =
      static_cast<float>(width_) / static_cast<float>(height_ > 0 ? height_ : 1);
  const XMMATRIX projection =
      XMMatrixPerspectiveFovLH(XMConvertToRadians(58.0f), aspect, 0.1f, 400.0f);

  return view * projection;
}

}  // namespace fieldbrik
