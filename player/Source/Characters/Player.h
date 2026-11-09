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
  // Puts the player at a point and settles them onto whatever is under it. A
  // spawn is not a landing: it starts grounded, with no landing pose to hold.
  void Spawn(const DirectX::XMFLOAT3& feetPosition,
             const std::vector<Part>& parts);

  // `parts` is everything in the world; the player collides with the ones whose
  // `collides` flag is set.
  void Update(const Input& input, const std::vector<Part>& parts,
              float cameraYawDegrees, float deltaSeconds);

  DirectX::XMFLOAT3 Position() const { return position_; }

  // The velocity the movement step ended with. A shove transfers it to an
  // unanchored brick, and a moving part carries the player with its own.
  DirectX::XMFLOAT3 Velocity() const { return velocity_; }

  // Moves the player without touching their velocity, for a part they are
  // standing on. The next update resolves any collision the move caused.
  void Nudge(const DirectX::XMFLOAT3& offset) {
    position_.x += offset.x;
    position_.y += offset.y;
    position_.z += offset.z;
  }

  // Degrees, where 0 faces +Z and 90 faces +X.
  float Facing() const { return facing_; }

  bool Grounded() const { return grounded_; }

  // True for the beat after a landing, while the jump pose is still being held.
  bool Landing() const { return landingHold_ > 0.0f; }

  // Drops a held landing pose. The client calls this when the window comes back
  // to the foreground: an arm still up from a landing that happened before the
  // client went away is not something the returning player did.
  void CancelLanding() { landingHold_ = 0.0f; }

  // Studs per second along the ground, and up and down. The animation wants the
  // horizontal one to decide whether this is a walk or a stand, and the vertical
  // one to tell a jump from a fall.
  float HorizontalSpeed() const;
  float VerticalSpeed() const { return velocity_.y; }

 private:
  void Respawn(const std::vector<Part>& parts);

  DirectX::XMFLOAT3 position_{0.0f, 0.0f, 0.0f};
  DirectX::XMFLOAT3 velocity_{0.0f, 0.0f, 0.0f};
  DirectX::XMFLOAT3 spawn_{0.0f, 0.0f, 14.0f};

  float facing_ = 0.0f;
  bool grounded_ = false;

  // Seconds left of the landing pose. The era's client did not drop the arms the
  // instant you touched down, and that hang is most of what makes a jump read.
  float landingHold_ = 0.0f;
};

}  // namespace fieldbrik
