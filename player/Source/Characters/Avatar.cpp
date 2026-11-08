#include "Characters/Avatar.h"

#include <cmath>

using namespace DirectX;

namespace fieldbrik {
namespace {

// The 2005 default: bright yellow head and arms, bright blue torso, yellowish
// green legs. These are approximations of the old palette rather than exact
// sRGB values, because the renderer shades everything with one fixed light.
constexpr XMFLOAT3 kSkinColour{0.96f, 0.80f, 0.19f};
constexpr XMFLOAT3 kTorsoColour{0.06f, 0.41f, 0.67f};
constexpr XMFLOAT3 kLegColour{0.64f, 0.74f, 0.28f};
constexpr XMFLOAT3 kFaceColour{0.09f, 0.09f, 0.09f};

// Which motor a part hangs off.
enum class JointId {
  Torso,
  Head,
  LeftArm,
  RightArm,
  LeftLeg,
  RightLeg,
};

struct BodyPart {
  const char* name;
  XMFLOAT3 pivot;   // body space: where the part bends
  XMFLOAT3 centre;  // body space: the box's centre when the limb hangs straight
  XMFLOAT3 size;
  XMFLOAT3 colour;
  JointId joint;
};

// Laid out once, in body space, then swung, turned and moved to the world.
constexpr BodyPart kBody[] = {
    {"Left leg", {-0.5f, 2.0f, 0.0f}, {-0.5f, 1.0f, 0.0f}, {1.0f, 2.0f, 1.0f},
     kLegColour, JointId::LeftLeg},
    {"Right leg", {0.5f, 2.0f, 0.0f}, {0.5f, 1.0f, 0.0f}, {1.0f, 2.0f, 1.0f},
     kLegColour, JointId::RightLeg},
    {"Torso", {0.0f, 2.0f, 0.0f}, {0.0f, 3.0f, 0.0f}, {2.0f, 2.0f, 1.0f},
     kTorsoColour, JointId::Torso},
    {"Left arm", {-1.5f, 4.0f, 0.0f}, {-1.5f, 3.0f, 0.0f}, {1.0f, 2.0f, 1.0f},
     kSkinColour, JointId::LeftArm},
    {"Right arm", {1.5f, 4.0f, 0.0f}, {1.5f, 3.0f, 0.0f}, {1.0f, 2.0f, 1.0f},
     kSkinColour, JointId::RightArm},
    {"Head", {0.0f, 4.0f, 0.0f}, {0.0f, 4.5f, 0.0f}, {2.0f, 1.0f, 1.0f},
     kSkinColour, JointId::Head},

    // The face: two dots and a smile, sitting just proud of the front of the head
    // so they cannot z-fight with it. They hang off the same pivot as the head, so
    // they follow it if the neck ever moves.
    {"Left eye", {0.0f, 4.0f, 0.0f}, {-0.42f, 4.62f, 0.52f}, {0.18f, 0.18f, 0.06f},
     kFaceColour, JointId::Head},
    {"Right eye", {0.0f, 4.0f, 0.0f}, {0.42f, 4.62f, 0.52f}, {0.18f, 0.18f, 0.06f},
     kFaceColour, JointId::Head},
    {"Mouth", {0.0f, 4.0f, 0.0f}, {0.0f, 4.28f, 0.52f}, {0.52f, 0.10f, 0.06f},
     kFaceColour, JointId::Head},
    {"Mouth left", {0.0f, 4.0f, 0.0f}, {-0.31f, 4.35f, 0.52f}, {0.12f, 0.10f, 0.06f},
     kFaceColour, JointId::Head},
    {"Mouth right", {0.0f, 4.0f, 0.0f}, {0.31f, 4.35f, 0.52f}, {0.12f, 0.10f, 0.06f},
     kFaceColour, JointId::Head},
};

// The pitch a part swings through, in body space. The sides are mirrored, which
// is what the script assumes: the same number on both shoulders swings the arms
// opposite ways, and the hips take the negated number.
float PitchFor(JointId joint, float rightShoulder, float leftShoulder, float rightHip,
               float leftHip) {
  switch (joint) {
    case JointId::RightArm:
      return rightShoulder;
    case JointId::LeftArm:
      return -leftShoulder;
    case JointId::RightLeg:
      return rightHip;
    case JointId::LeftLeg:
      return -leftHip;
    case JointId::Head:
    case JointId::Torso:
      break;
  }
  return 0.0f;
}

}  // namespace

void Avatar::Animate(Pose pose, float deltaSeconds) {
  pose_ = pose;
  time_ += deltaSeconds;

  switch (pose) {
    case Pose::Jumping:
    case Pose::FreeFall:
      MoveJump();
      break;
    case Pose::Seated:
      MoveSit();
      break;
    default:
      MoveSwing(pose);
      break;
  }

  Advance(deltaSeconds);
}

// Standing, running, climbing and dead all use the same sine; only the amplitude,
// the frequency and the climbing fudge change. That is the script's shape too.
void Avatar::MoveSwing(Pose pose) {
  float amplitude = 0.1f;
  float frequency = 1.0f;
  float climbFudge = 0.0f;

  if (pose == Pose::Running) {
    // The script lifts the shoulders' rate only once they are out past 1.5 rad,
    // which is what makes a held arm snap up and a swinging one ease out.
    rightShoulder_.rate = std::fabs(rightShoulder_.angle) > 1.5f ? 0.75f : 0.15f;
    leftShoulder_.rate = std::fabs(leftShoulder_.angle) > 1.5f ? 0.75f : 0.15f;
    amplitude = 1.0f;
    frequency = 9.0f;
  } else if (pose == Pose::Climbing) {
    rightShoulder_.rate = 0.5f;
    leftShoulder_.rate = 0.5f;
    amplitude = 1.0f;
    frequency = 9.0f;
    climbFudge = 3.14f;
  }

  const float swing = amplitude * std::sin(time_ * frequency);

  rightShoulder_.desired = swing + climbFudge;
  leftShoulder_.desired = swing - climbFudge;

  // The hips take the shoulders' number negated, which is why an arm and the leg
  // on the same side go opposite ways.
  rightHip_.desired = -swing;
  leftHip_.desired = -swing;
}

void Avatar::MoveJump() {
  rightShoulder_.rate = 0.75f;
  leftShoulder_.rate = 0.75f;

  rightShoulder_.desired = 3.14f;
  leftShoulder_.desired = -3.14f;

  rightHip_.desired = 0.0f;
  leftHip_.desired = 0.0f;
}

void Avatar::MoveSit() {
  rightShoulder_.rate = 0.15f;
  leftShoulder_.rate = 0.15f;

  rightShoulder_.desired = 3.14f / 2.0f;
  leftShoulder_.desired = -3.14f / 2.0f;

  rightHip_.desired = 3.14f / 2.0f;
  leftHip_.desired = -3.14f / 2.0f;
}

void Avatar::Advance(float deltaSeconds) {
  const float ticks = deltaSeconds / kAnimationTick;

  // A joint that has no rate of its own follows the pose. Everything the script
  // gives a number to moves at that number, or at most one tick's worth of it.
  const auto advance = [ticks](Joint& joint) {
    const float rate = joint.rate > 0.0f ? joint.rate : kTrackedJointRate;
    const float limit = rate * ticks;
    const float difference = joint.desired - joint.angle;

    if (difference > limit) {
      joint.angle += limit;
    } else if (difference < -limit) {
      joint.angle -= limit;
    } else {
      joint.angle = joint.desired;
    }
  };

  advance(rightShoulder_);
  advance(leftShoulder_);
  advance(leftHip_);
  advance(rightHip_);
}

void Avatar::SetPose(const XMFLOAT3& feetPosition, float facingDegrees) {
  feet_ = feetPosition;
  facing_ = facingDegrees;
}

void Avatar::CollectParts(std::vector<Part>& out) const {
  const float facing = XMConvertToRadians(facing_);
  const float sine = std::sin(facing);
  const float cosine = std::cos(facing);

  for (const BodyPart& body : kBody) {
    const float pitch = PitchFor(body.joint, rightShoulder_.angle, leftShoulder_.angle,
                                 rightHip_.angle, leftHip_.angle);
    const float swingSine = std::sin(pitch);
    const float swingCosine = std::cos(pitch);

    // Swing the offset from the pivot about the body's X axis, which is a limb
    // going forwards or backwards, then turn the whole body to face where it is
    // going, then move it to the feet.
    const float offsetX = body.centre.x - body.pivot.x;
    const float offsetY = body.centre.y - body.pivot.y;
    const float offsetZ = body.centre.z - body.pivot.z;

    const float swungY = offsetY * swingCosine - offsetZ * swingSine;
    const float swungZ = offsetY * swingSine + offsetZ * swingCosine;

    const XMFLOAT3 local{body.pivot.x + offsetX, body.pivot.y + swungY,
                         body.pivot.z + swungZ};

    Part part;
    part.name = body.name;
    part.size = body.size;
    part.colour = body.colour;

    part.position.x = feet_.x + local.x * cosine + local.z * sine;
    part.position.y = feet_.y + local.y;
    part.position.z = feet_.z - local.x * sine + local.z * cosine;

    // Roll, then pitch, then yaw: the limb swings in body space and the yaw turns
    // the result, which is the same order the position maths above uses.
    part.rotationDegrees = {XMConvertToDegrees(pitch), facing_, 0.0f};

    out.push_back(part);
  }
}

float Avatar::HipAngleDegrees() const {
  return XMConvertToDegrees(rightHip_.angle);
}

float Avatar::ArmAngleDegrees() const {
  return XMConvertToDegrees(rightShoulder_.angle);
}

}  // namespace fieldbrik
