// An orbit camera around a point of interest.
//
// Milestone 2 only needs to look at the world from different angles, so this is
// a free orbit: drag to swing around the target, keys to rotate, zoom in and out.
// The third-person follow camera that stays behind an avatar is Milestone 3, and
// it will reuse the same projection and the same smoothing.

#pragma once

#include <DirectXMath.h>

namespace fieldbrik {

class Camera {
 public:
  void SetViewport(int width, int height);

  // Called once per frame with the frame time, so the camera eases towards where
  // it is being dragged instead of snapping.
  void Update(float deltaSeconds);

  // Delta in screen pixels.
  void Orbit(float deltaX, float deltaY);
  void Zoom(float steps);
  void Reset();

  DirectX::XMFLOAT3 Position() const;
  DirectX::XMMATRIX ViewProjection() const;

  float Distance() const { return distance_; }
  float Pitch() const { return pitch_; }
  float Yaw() const { return yaw_; }

 private:
  float yaw_ = 35.0f;            // degrees, smoothed towards targetYaw_
  float pitch_ = 28.0f;          // degrees above the target
  float distance_ = 52.0f;       // studs from the target

  float targetYaw_ = 35.0f;
  float targetPitch_ = 28.0f;
  float targetDistance_ = 52.0f;

  DirectX::XMFLOAT3 target_{0.0f, 3.0f, 0.0f};

  int width_ = 1024;
  int height_ = 768;
};

}  // namespace fieldbrik
