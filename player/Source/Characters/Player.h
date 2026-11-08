// The player: where the avatar is, how it moves, and what it is standing on.
//
// Milestone 4 put real physics under the movement: gravity pulls the player down,
// Space jumps when they are on something, and every collidable brick pushes them
// back out. Fall off the baseplate and the client puts them back at the spawn
// point instead of letting them fall forever.
//
// Direction is relative to the camera, the way a third-person game works: W moves
// away from the camera, not along a fixed world axis. The avatar turns to face
// where it is going; the swinging of the limbs is the Avatar's business.

#pragma once

#include <DirectXMath.h>

#include <vector>

#include "Input/Input.h"
#include "World/Part.h"

namespace fieldbrik {

class Player {
 public:
  void Spawn(const DirectX::XMFLOAT3& feetPosition);

  // `parts` is everything in the world; the player collides with the ones whose
  // `collides` flag is set.
  void Update(const Input& input, const std::vector<Part>& parts,
              float cameraYawDegrees, float deltaSeconds);

  DirectX::XMFLOAT3 Position() const { return position_; }

  // Degrees, where 0 faces +Z and 90 faces +X.
  float Facing() const { return facing_; }

  bool Grounded() const { return grounded_; }

  // Studs per second along the ground, and up and down. The animation wants the
  // horizontal one to decide whether this is a walk or a stand, and the vertical
  // one to tell a jump from a fall.
  float HorizontalSpeed() const;
  float VerticalSpeed() const { return velocity_.y; }

 private:
  void Respawn();

  DirectX::XMFLOAT3 position_{0.0f, 0.0f, 0.0f};
  DirectX::XMFLOAT3 velocity_{0.0f, 0.0f, 0.0f};
  DirectX::XMFLOAT3 spawn_{0.0f, 0.0f, 14.0f};

  float facing_ = 0.0f;
  bool grounded_ = false;
};

}  // namespace fieldbrik
