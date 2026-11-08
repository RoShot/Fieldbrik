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

struct BodyPart {
  const char* name;
  XMFLOAT3 localCentre;  // relative to the feet, before facing is applied
  XMFLOAT3 size;
  XMFLOAT3 colour;
};

// Laid out once, in body space, then rotated and moved to the world.
constexpr BodyPart kBody[] = {
    {"Left leg", {-0.5f, 1.0f, 0.0f}, {1.0f, 2.0f, 1.0f}, kLegColour},
    {"Right leg", {0.5f, 1.0f, 0.0f}, {1.0f, 2.0f, 1.0f}, kLegColour},
    {"Torso", {0.0f, 3.0f, 0.0f}, {2.0f, 2.0f, 1.0f}, kTorsoColour},
    {"Left arm", {-1.5f, 3.0f, 0.0f}, {1.0f, 2.0f, 1.0f}, kSkinColour},
    {"Right arm", {1.5f, 3.0f, 0.0f}, {1.0f, 2.0f, 1.0f}, kSkinColour},
    {"Head", {0.0f, 4.5f, 0.0f}, {2.0f, 1.0f, 1.0f}, kSkinColour},

    // The face: two dots and a smile, sitting just proud of the front of the head
    // so they cannot z-fight with it. A face was the one detail the early avatar
    // always had, so it is drawn here rather than left for later.
    {"Left eye", {-0.42f, 4.62f, 0.52f}, {0.18f, 0.18f, 0.06f}, kFaceColour},
    {"Right eye", {0.42f, 4.62f, 0.52f}, {0.18f, 0.18f, 0.06f}, kFaceColour},
    {"Mouth", {0.0f, 4.28f, 0.52f}, {0.52f, 0.10f, 0.06f}, kFaceColour},
    {"Mouth left", {-0.31f, 4.35f, 0.52f}, {0.12f, 0.10f, 0.06f}, kFaceColour},
    {"Mouth right", {0.31f, 4.35f, 0.52f}, {0.12f, 0.10f, 0.06f}, kFaceColour},
};

}  // namespace

void Avatar::SetPose(const XMFLOAT3& feetPosition, float facingDegrees) {
  feet_ = feetPosition;
  facing_ = facingDegrees;
}

void Avatar::CollectParts(std::vector<Part>& out) const {
  const float facing = XMConvertToRadians(facing_);
  const float sine = std::sin(facing);
  const float cosine = std::cos(facing);

  for (const BodyPart& body : kBody) {
    Part part;
    part.name = body.name;
    part.size = body.size;
    part.colour = body.colour;

    // Rotate the offset around the feet so the whole body turns together.
    part.position.x = feet_.x + body.localCentre.x * cosine + body.localCentre.z * sine;
    part.position.y = feet_.y + body.localCentre.y;
    part.position.z = feet_.z - body.localCentre.x * sine + body.localCentre.z * cosine;

    part.rotationDegrees = {0.0f, facing_, 0.0f};

    out.push_back(part);
  }
}

}  // namespace fieldbrik
