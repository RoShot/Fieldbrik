#include "Characters/Player.h"

#include <algorithm>
#include <cmath>

#include "Physics/Physics.h"

using namespace DirectX;

namespace fieldbrik {
namespace {

// The era's own numbers. Roblox's gravity is 196.2 studs per second squared, the
// walk is 16, and a jump leaves the ground at 50, which peaks about six studs up.
// The one thing that is not a number from the engine is how quickly you get going
// and how quickly you stop: those are tuned by feel, slow enough to carry
// momentum and quick enough that letting go does not read as ice.
constexpr float kWalkSpeed = 16.0f;        // studs per second
constexpr float kGroundAccel = 55.0f;      // studs per second squared
constexpr float kGroundDecel = 90.0f;      // friction once the keys are let go
constexpr float kAirAccel = 15.0f;         // less steering in the air
constexpr float kGravity = -196.2f;
constexpr float kJumpSpeed = 50.0f;
constexpr float kMaxFallSpeed = 250.0f;
constexpr float kTurnBlend = 14.0f;        // how quickly the body swings round

// The player is moved in slices this small, so nothing is ever stepped over:
// at 16 studs per second a frame moves about a quarter of a stud, and a jump
// lands at roughly one stud per frame.
constexpr float kSubstep = 0.2f;
constexpr int kMaxSubsteps = 64;

// A ledge this high is walked up rather than jumped onto. It clears a one-stud
// brick and the steps, and stops short of anything that should really be jumped.
constexpr float kStepHeight = 1.15f;

// How many slices the step-up settle scans downwards in. It has to be finer than
// the forward bite one substep takes, or the resolver reports the step's side as
// the shallowest overlap and pushes the player back out instead of setting them
// on top. That is why walking into a step slowly used to be stopped by it.
constexpr int kStepSettleSteps = 24;

// Below this there is nothing left to stand on, so the player is put back.
constexpr float kRespawnBelow = -60.0f;

// How long the jump pose is held after touching down. Half a second of arms still
// up, then the idle starts bringing them down at its own slow rate, which takes
// another two seconds. It is not a blend, and it should not be, because the
// client it is copying was not smooth either.
constexpr float kLandingHoldSeconds = 0.5f;

float Approach(float value, float target, float maxDelta) {
  const float difference = target - value;
  if (std::fabs(difference) <= maxDelta) return target;
  return value + (difference > 0.0f ? maxDelta : -maxDelta);
}

float ShortestArc(float from, float to) {
  float difference = to - from;
  while (difference > 180.0f) difference -= 360.0f;
  while (difference < -180.0f) difference += 360.0f;
  return difference;
}

// Tries to walk up a low ledge by lifting the player over it and setting them back
// down on top. Returns false when there is no ledge to step onto, in which case
// the caller keeps the ordinary blocked result.
bool TryStepUp(const std::vector<Part>& parts, const XMFLOAT3& before, float stepX,
               float stepZ, const XMFLOAT3& blocked, XMFLOAT3& out) {
  const float intended = std::sqrt(stepX * stepX + stepZ * stepZ);
  if (intended < 1e-5f) return false;

  // Only worth trying if the move really was cut short.
  const float gainedX = blocked.x - before.x;
  const float gainedZ = blocked.z - before.z;
  const float achieved = std::sqrt(gainedX * gainedX + gainedZ * gainedZ);
  if (achieved > intended * 0.75f) return false;

  XMFLOAT3 raised = before;
  raised.y += kStepHeight;
  raised.x += stepX;
  raised.z += stepZ;

  // No room at the top means it is a wall, not a ledge.
  if (IsBlocked(parts, raised)) return false;

  // Come back down in slices until something is under the player. Asking
  // IsBlocked rather than watching for a grounded resolve matters: a shallow
  // forward bite makes the sideways overlap smaller than the drop, so the
  // resolver would rather push the player off the step than up onto it. IsBlocked
  // only answers "would this spot be moved", so it stops at the step's top either
  // way.
  const float drop = kStepHeight / static_cast<float>(kStepSettleSteps);

  bool supported = false;
  float freeY = raised.y;
  for (int step = 1; step <= kStepSettleSteps; ++step) {
    const XMFLOAT3 probe{raised.x, raised.y - drop * static_cast<float>(step),
                         raised.z};
    if (IsBlocked(parts, probe)) {
      supported = true;
      break;
    }
    freeY = probe.y;
  }

  // Nothing under the player at the top of the step: it was a drop, not a ledge.
  if (!supported) return false;

  // A step up, not a fall: anything lower is left to gravity.
  if (freeY < before.y - 0.01f) return false;

  // Sink a hair into the surface and let the resolver put the player exactly on
  // top of it, so they finish this frame standing rather than falling.
  XMFLOAT3 settled{raised.x, freeY - 0.02f, raised.z};
  const Contact contact = ResolvePlayer(parts, settled);
  if (!contact.grounded) return false;
  if (settled.y < before.y - 0.01f) return false;

  out = settled;
  return true;
}

}  // namespace

void Player::Spawn(const XMFLOAT3& feetPosition, const std::vector<Part>& parts) {
  spawn_ = feetPosition;
  position_ = feetPosition;
  velocity_ = {0.0f, 0.0f, 0.0f};
  landingHold_ = 0.0f;

  // Facing -Z, which is where most builds put their bricks. The camera starts
  // behind him, so the first frame reads as "you are standing here, the build is
  // in front".
  facing_ = 180.0f;

  // Being placed is not a landing. Settle onto the ground before the first frame
  // and start grounded, or the client treats the spawn as the end of a fall: it
  // holds the jump pose for half a second and the arms swing up and back down
  // before the player has moved at all.
  XMFLOAT3 settled = position_;
  const Contact contact = ResolvePlayer(parts, settled);
  position_ = settled;
  grounded_ = contact.grounded;
  velocity_.y = 0.0f;
}

float Player::HorizontalSpeed() const {
  return std::sqrt(velocity_.x * velocity_.x + velocity_.z * velocity_.z);
}

void Player::Respawn(const std::vector<Part>& parts) {
  // The same treatment as a first spawn: being put back is not a landing either.
  Spawn(spawn_, parts);
}

void Player::Update(const Input& input, const std::vector<Part>& parts,
                    float cameraYawDegrees, float deltaSeconds) {
  float forwardInput = 0.0f;
  float rightInput = 0.0f;

  if (input.KeyDown('W')) forwardInput += 1.0f;
  if (input.KeyDown('S')) forwardInput -= 1.0f;
  if (input.KeyDown('D')) rightInput += 1.0f;
  if (input.KeyDown('A')) rightInput -= 1.0f;

  // The camera looks from its eye towards the target, so the ground direction it
  // faces is the negation of the eye offset. Right is that forward turned a
  // quarter turn: (cos, sin), which is what the view matrix's own right-hand
  // column comes out as. Get that sign wrong and W still reads correctly while
  // A and D swap over the moment the camera is turned sideways, which is exactly
  // how it looked before this was fixed.
  const float yaw = XMConvertToRadians(cameraYawDegrees);
  const float forwardX = -std::sin(yaw);
  const float forwardZ = std::cos(yaw);
  const float rightX = std::cos(yaw);
  const float rightZ = std::sin(yaw);

  float moveX = forwardX * forwardInput + rightX * rightInput;
  float moveZ = forwardZ * forwardInput + rightZ * rightInput;

  const float length = std::sqrt(moveX * moveX + moveZ * moveZ);
  const bool wantsToMove = length > 0.0001f;

  if (wantsToMove) {
    moveX /= length;
    moveZ /= length;
  }

  // Steering: reach walking speed in a fraction of a second on the ground, and
  // slower in the air, so a jump keeps the momentum it started with.
  const float accel = grounded_ ? kGroundAccel : kAirAccel;
  velocity_.x = Approach(velocity_.x, moveX * kWalkSpeed, accel * deltaSeconds);
  velocity_.z = Approach(velocity_.z, moveZ * kWalkSpeed, accel * deltaSeconds);

  // Standing still on the ground means friction, not a long slide: a steady
  // deceleration, so a stop takes about a fifth of a second from full speed.
  if (grounded_ && !wantsToMove) {
    velocity_.x = Approach(velocity_.x, 0.0f, kGroundDecel * deltaSeconds);
    velocity_.z = Approach(velocity_.z, 0.0f, kGroundDecel * deltaSeconds);
  }

  // Jump before gravity is applied, so the first frame of a jump is not eaten.
  if (grounded_ && input.KeyPressed(VK_SPACE)) {
    velocity_.y = kJumpSpeed;
    grounded_ = false;
  }

  velocity_.y = std::max(velocity_.y + kGravity * deltaSeconds, -kMaxFallSpeed);

  // One frame's travel, cut into slices small enough that a thin brick cannot be
  // passed through.
  const float travel = std::max(
      {std::fabs(velocity_.x * deltaSeconds), std::fabs(velocity_.y * deltaSeconds),
       std::fabs(velocity_.z * deltaSeconds)});
  const int substeps = std::clamp(
      static_cast<int>(std::ceil(travel / kSubstep)), 1, kMaxSubsteps);

  const float stepX = velocity_.x * deltaSeconds / substeps;
  const float stepY = velocity_.y * deltaSeconds / substeps;
  const float stepZ = velocity_.z * deltaSeconds / substeps;

  bool grounded = false;
  const bool wasGrounded = grounded_;
  XMFLOAT3 pushed{0.0f, 0.0f, 0.0f};

  for (int step = 0; step < substeps; ++step) {
    const XMFLOAT3 before = position_;

    position_.x += stepX;
    position_.y += stepY;
    position_.z += stepZ;

    Contact contact = ResolvePlayer(parts, position_);

    // Walking into a low ledge should take you up it, not stop you dead.
    if (wasGrounded) {
      XMFLOAT3 stepped{};
      if (TryStepUp(parts, before, stepX, stepZ, position_, stepped)) {
        position_ = stepped;
        contact = ResolvePlayer(parts, position_);

        // A step up is not a fall. The player never left the ground, so this frame
        // must not read as airborne: otherwise the jump pose fires on every climb
        // and the arms go up as you walk up the steps.
        contact.grounded = true;
        grounded = true;
        velocity_.y = 0.0f;
      }
    }

    pushed.x += contact.push.x;
    pushed.y += contact.push.y;
    pushed.z += contact.push.z;

    if (contact.grounded) {
      // Landed: whatever is left of the fall stops here.
      grounded = true;
      velocity_.y = 0.0f;
    } else if (contact.hitCeiling) {
      velocity_.y = std::min(velocity_.y, 0.0f);
    }
  }

  // A frame can end with no contact and still not be airborne: standing exactly
  // one skin above a surface, or being set down by a step up, resolves to nothing
  // at all. Probe a hair below the feet before believing the player is falling,
  // or a standing player flickers into the jump pose and the arms snap up - which
  // is the reported "jump pose comes back" bug.
  if (!grounded && velocity_.y <= 0.0f) {
    XMFLOAT3 probe = position_;
    probe.y -= 0.05f;

    const Contact ground = ResolvePlayer(parts, probe);
    if (ground.grounded) {
      position_ = probe;
      grounded = true;
      velocity_.y = 0.0f;
    }
  }

  grounded_ = grounded;
  if (grounded_) velocity_.y = 0.0f;

  // Touching down starts the hang: the arms stay where the jump left them for a
  // moment, so a landing reads as an event instead of the walk resuming in mid
  // stride. Fresh jumps cancel it by leaving the ground again.
  if (grounded_ && !wasGrounded) landingHold_ = kLandingHoldSeconds;
  if (landingHold_ > 0.0f) landingHold_ -= deltaSeconds;

  // Walk on whatever the player was pushed out of instead of stopping dead
  // against it. The push is along the surface's own normal, so the velocity is
  // flattened onto that surface: on flat ground nothing is left to remove, against
  // a wall only the part heading into it goes (so walking at a wall at an angle
  // slides along it), and on a shallow slope the velocity turns upwards and the
  // player climbs. Steeper than forty-five degrees is still a wall, which is the
  // cliff the era would not let you walk up.
  const float pushLength =
      std::sqrt(pushed.x * pushed.x + pushed.y * pushed.y + pushed.z * pushed.z);
  if (pushLength > 1e-4f) {
    const float normalX = pushed.x / pushLength;
    const float normalY = pushed.y / pushLength;
    const float normalZ = pushed.z / pushLength;

    if (normalY >= kWalkableSlopeNormal) {
      const float along =
          velocity_.x * normalX + velocity_.y * normalY + velocity_.z * normalZ;
      velocity_.x -= along * normalX;
      velocity_.y -= along * normalY;
      velocity_.z -= along * normalZ;
    } else {
      // The wall case: the normal is taken flat, so the downward part of a push
      // out of a wall's side does not read as lifting the player.
      const float horizontal = std::sqrt(normalX * normalX + normalZ * normalZ);
      if (horizontal > 1e-4f) {
        const float flatX = normalX / horizontal;
        const float flatZ = normalZ / horizontal;
        const float into = velocity_.x * flatX + velocity_.z * flatZ;

        if (into < 0.0f) {
          velocity_.x -= into * flatX;
          velocity_.z -= into * flatZ;
        }
      }
    }
  }

  // Face the direction of travel, easing so a tap of D does not snap the body.
  const float horizontalSpeed =
      std::sqrt(velocity_.x * velocity_.x + velocity_.z * velocity_.z);
  if (horizontalSpeed > 0.5f) {
    const float desired = XMConvertToDegrees(std::atan2(velocity_.x, velocity_.z));
    const float blend = 1.0f - std::exp(-kTurnBlend * deltaSeconds);
    facing_ += ShortestArc(facing_, desired) * blend;
  }

  if (position_.y < kRespawnBelow) Respawn(parts);
}

}  // namespace fieldbrik
