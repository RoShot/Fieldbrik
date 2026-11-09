// The player's body: rigid boxes that swing from the shoulders and the hips.
//
// The motion is the old client's Animate script, ported rather than rewritten.
// Every joint is a motor that chases a desired angle at a capped rate, so the
// animation is a set of targets as a function of elapsed time — not a keyframe
// clip. That is what makes the arms lag behind the legs.
//
// What the script asks for, kept as it asks it:
//
//   Standing   amplitude 0.1, frequency 1    — a slow idle sway
//   Running    amplitude 1,   frequency 9    — the walk/run cycle
//   Climbing   amplitude 1,   frequency 9, climbFudge pi — arms opposite
//   Jumping    shoulders +-pi, hips 0, rate 0.75
//   FreeFall   the same as Jumping
//   Seated     shoulders and hips +-pi/2, rate 0.15
//
// The joints are the ones the script names: Right Shoulder, Left Shoulder,
// Right Hip, Left Hip, and the Torso that carries them. The Neck is never given
// an angle, so the head rides the torso.
//
// The sides are mirrored, which is what the script relies on: it hands both
// shoulders the same number and expects the arms to swing opposite each other.
// The same goes for the hips, which get the negative of the shoulders' number.
//
// Proportions in studs, feet at y = 0, facing +Z:
//
//            [head 2x1x1]         y 4.0 .. 5.0   neck at y 4.0
//   [arm]    [torso 2x2x1]  [arm]  y 2.0 .. 4.0   shoulders at y 4.0
//   [leg]       [leg]              y 0.0 .. 2.0   hips at y 2.0
//
// That makes a figure 4 studs wide and 5 tall, which is what the early client
// used and what keeps the avatar from looking giant next to 1-stud bricks.

#pragma once

#include <DirectXMath.h>

#include <vector>

#include "World/Part.h"

namespace fieldbrik {

// The script ticks at 0.1 s, and its MaxVelocity is the most a joint may move in
// one tick. Everything is converted to radians per second from here.
constexpr float kAnimationTick = 0.1f;

// Chasing rate for joints the script never gives a MaxVelocity to. The script is
// deliberately slow on the shoulders (0.15, the lazy swing) but leaves the hips
// alone while running, and a hip that crawled like that would keep the legs
// almost still, which is not what the old walk looked like.
constexpr float kTrackedJointRate = 20.0f;

class Avatar {
 public:
  // What the player is doing. The client can only produce the first four so far;
  // the rest are the script's other poses, carried so the animation does not have
  // to be rewritten when sitting and climbing arrive.
  enum class Pose { Standing, Running, Jumping, FreeFall, Climbing, Seated, Dead };

  // Advances the animation by one frame: works out where the joints want to be
  // and lets the motors chase it.
  void Animate(Pose pose, float deltaSeconds);

  // Feet position in the world and a facing angle in degrees, where 0 faces +Z.
  void SetPose(const DirectX::XMFLOAT3& feetPosition, float facingDegrees);

  // The six colours the site stores, in its order: head, torso, left arm, right
  // arm, left leg, right leg. Join passes the account's own palette here.
  void SetAppearance(const DirectX::XMFLOAT3& head,
                     const DirectX::XMFLOAT3& torso,
                     const DirectX::XMFLOAT3& leftArm,
                     const DirectX::XMFLOAT3& rightArm,
                     const DirectX::XMFLOAT3& leftLeg,
                     const DirectX::XMFLOAT3& rightLeg);

  // Puts the whole body back at rest, dropping whatever pose was being held. The
  // client calls this when the window comes back to the foreground: an arm still
  // up from a landing that happened while the client was in the background is not
  // something the returning player did, and easing it down would look like the
  // jump had just happened.
  void Settle();

  // Appends the body parts, already placed in the world, to the list.
  void CollectParts(std::vector<Part>& out) const;

  // What the animation is doing right now, which is also what a tool pose will
  // need to know later.
  Pose Current() const { return pose_; }

  // Degrees on the right hip and right shoulder this frame. The animation is
  // checked with these.
  float HipAngleDegrees() const;
  float ArmAngleDegrees() const;

 private:
  struct Joint {
    float angle = 0.0f;    // radians, where the joint is now
    float desired = 0.0f;  // radians, where the pose wants it
    float rate = 0.0f;     // the script's MaxVelocity, in radians per tick
  };

  void MoveSwing(Pose pose);
  void MoveJump();
  void MoveSit();
  void Advance(float deltaSeconds);


  DirectX::XMFLOAT3 feet_{0.0f, 0.0f, 0.0f};
  float facing_ = 0.0f;

  // The palette, defaulting to the 2005 colours in Avatar.cpp.
  DirectX::XMFLOAT3 headColour_{0.96f, 0.80f, 0.19f};
  DirectX::XMFLOAT3 torsoColour_{0.06f, 0.41f, 0.67f};
  DirectX::XMFLOAT3 leftArmColour_{0.96f, 0.80f, 0.19f};
  DirectX::XMFLOAT3 rightArmColour_{0.96f, 0.80f, 0.19f};
  DirectX::XMFLOAT3 leftLegColour_{0.64f, 0.74f, 0.28f};
  DirectX::XMFLOAT3 rightLegColour_{0.64f, 0.74f, 0.28f};

  // Elapsed seconds, which is the `time` the script feeds into its sine.
  float time_ = 0.0f;

  Pose pose_ = Pose::Standing;

  Joint rightShoulder_{0.0f, 0.0f, 0.0f};
  Joint leftShoulder_{0.0f, 0.0f, 0.0f};
  Joint rightHip_{0.0f, 0.0f, 0.0f};
  Joint leftHip_{0.0f, 0.0f, 0.0f};
};

}  // namespace fieldbrik
