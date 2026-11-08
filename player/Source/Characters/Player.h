// The player: where the avatar is and how it moves.
//
// Movement is deliberately simple for Milestone 3. There is no gravity, no
// jumping and no collision yet — the avatar walks on the flat top of the
// baseplate and is stopped at its edge. Milestone 4 is what turns that into
// physics.
//
// Direction is relative to the camera, the way a third-person game works: W moves
// away from the camera, not along a fixed world axis. The avatar turns to face
// where it is going, which is the only "animation" the early client had.

#pragma once

#include <DirectXMath.h>

#include "Input/Input.h"

namespace fieldbrik {

class Player {
 public:
  void Spawn(const DirectX::XMFLOAT3& feetPosition);

  void Update(const Input& input, float cameraYawDegrees, float deltaSeconds);

  DirectX::XMFLOAT3 Position() const { return position_; }

  // Degrees, where 0 faces +Z and 90 faces +X.
  float Facing() const { return facing_; }

 private:
  DirectX::XMFLOAT3 position_{0.0f, 0.0f, 0.0f};
  float facing_ = 0.0f;
};

}  // namespace fieldbrik
