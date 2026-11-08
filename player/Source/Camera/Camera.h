// The third-person camera: it follows a point, and you drag to look around it.
//
// Dragging right turns the view right (the same way a mouse-look camera does),
// dragging up lifts the view; the camera sits at a fixed distance and eases
// towards where it is being pulled, so movement and looking both stay smooth.
//
// Milestone 4 adds collision so the camera cannot end up inside a brick.

#pragma once

#include <DirectXMath.h>

namespace fieldbrik {

class Camera {
 public:
  void SetViewport(int width, int height);

  // Where the camera should look from now on. The point is followed with easing,
  // which is what stops the view jerking when the player changes direction.
  void SetTarget(const DirectX::XMFLOAT3& point);

  // Jumps straight to the target instead of easing, for the first frame.
  void SnapToTarget();

  // Called once per frame with the frame time.
  void Update(float deltaSeconds);

  // Drag deltas in screen pixels.
  void Orbit(float deltaX, float deltaY);
  void Zoom(float steps);
  void Reset();

  DirectX::XMFLOAT3 Position() const;
  DirectX::XMMATRIX ViewProjection() const;

  float Distance() const { return distance_; }
  float Pitch() const { return pitch_; }
  float Yaw() const { return yaw_; }

 private:
  // Yaw 180 puts the camera on the +Z side, behind a player who faces -Z.
  float yaw_ = 180.0f;           // degrees, smoothed towards targetYaw_
  float pitch_ = 20.0f;          // degrees above the target
  float distance_ = 20.0f;       // studs behind the target

  float targetYaw_ = 180.0f;
  float targetPitch_ = 20.0f;
  float targetDistance_ = 20.0f;

  DirectX::XMFLOAT3 focus_{0.0f, 3.0f, 0.0f};
  DirectX::XMFLOAT3 focusGoal_{0.0f, 3.0f, 0.0f};

  int width_ = 1024;
  int height_ = 768;
};

}  // namespace fieldbrik
