// The third-person camera: it follows a point, and you drag to look around it.
//
// Dragging right turns the view right (the same way a mouse-look camera does),
// dragging up lifts the view. Looking eases; the distance does not. Zoom is a
// notch count and each notch snaps the camera to the next step, which is what the
// era's click-zoom was, and the last notch in is first person:
//
//    notch 0     the eye is the head, the avatar is not drawn
//    notch 1-30  two studs apart, from 2 out to 60
//
// The camera never drifts behind the player on its own: it stays where it was
// put, which is how the era's camera behaved.
//
// Collision is the caller's job, because the camera does not know what a brick is:
// it asks the world for the distance to the first thing between the eye and the
// point it is looking at, and the camera stays inside that.

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

  // Whole notches, positive to zoom out and negative to zoom in. Fractions are
  // rounded, because there is no distance between two notches to sit at.
  void Zoom(float notches);
  void Reset();

  // How close a brick is along the view line. The distance actually used is the
  // smaller of this and the distance being asked for, and it is reset by the
  // caller every frame.
  void SetMaximumDistance(float distance) { maxDistance_ = distance; }

  // The point the camera looks at, which is where a ray towards the eye starts.
  DirectX::XMFLOAT3 Focus() const { return focus_; }

  DirectX::XMFLOAT3 Position() const;
  DirectX::XMMATRIX ViewProjection() const;

  // The camera's three axes in world space, with the field of view already
  // folded into the right and up ones: a pixel at the edge of the screen looks
  // along forward + right. The sky needs this because it has no geometry to
  // carry a direction in, and inverting the view-projection at these near and
  // far planes loses almost all of the screen's spread.
  struct SkyBasis {
    DirectX::XMFLOAT3 forward;
    DirectX::XMFLOAT3 right;
    DirectX::XMFLOAT3 up;
  };
  SkyBasis SkyRayBasis() const;

  // How far the camera is asked to sit, in studs.
  float Distance() const { return static_cast<float>(zoom_) * kZoomStep; }

  // True at full zoom in, where the eye is the head itself.
  bool FirstPerson() const { return zoom_ == 0; }

  float Pitch() const { return pitch_; }
  float Yaw() const { return yaw_; }

  // Studio's free camera. The eye is wherever the editor put it and the angles
  // are the camera's own, rather than an orbit around a point, so flying does not
  // drag the thing being looked at along. Nothing in the player turns this on.
  void SetFreePose(const DirectX::XMFLOAT3& eye, float yawDegrees,
                   float pitchDegrees);
  void SetFreeAngles(float yawDegrees, float pitchDegrees);
  void MoveFree(const DirectX::XMFLOAT3& delta);
  bool Free() const { return free_; }
  DirectX::XMFLOAT3 FreeEye() const { return eye_; }
  float FreeYaw() const { return freeYaw_; }
  float FreePitch() const { return freePitch_; }

 private:
  // Zoom is a notch count rather than a distance: each notch snaps the camera to
  // the next step out, so the view never creeps between two distances.
  static constexpr int kZoomLevels = 30;  // 60 studs at the far end
  static constexpr float kZoomStep = 2.0f;
  static constexpr int kDefaultZoomLevel = 7;

  int zoom_ = kDefaultZoomLevel;  // 7 notches, 14 studs, a little closer than 20

  // Yaw 180 puts the camera on the +Z side, behind a player who faces -Z.
  float yaw_ = 180.0f;           // degrees, smoothed towards targetYaw_
  float pitch_ = 20.0f;          // degrees above the target

  float targetYaw_ = 180.0f;
  float targetPitch_ = 20.0f;

  DirectX::XMFLOAT3 focus_{0.0f, 3.0f, 0.0f};
  DirectX::XMFLOAT3 focusGoal_{0.0f, 3.0f, 0.0f};

  float maxDistance_ = 1.0e9f;

  int width_ = 1024;
  int height_ = 768;

  bool free_ = false;
  DirectX::XMFLOAT3 eye_{0.0f, 20.0f, 30.0f};
  float freeYaw_ = 180.0f;
  float freePitch_ = 20.0f;
};

}  // namespace fieldbrik
