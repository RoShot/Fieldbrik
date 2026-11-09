// One brick.
//
// Position is the centre of the brick, size is its full extent in studs, and
// rotation is either Euler degrees (X pitch, Y yaw, Z roll) or an explicit
// matrix. The matrix is what a place file gives us: a CoordinateFrame is a
// rotation, not three angles, and turning it into Euler only to turn it back is a
// way to lose accuracy — and to break on the one brick that happens to sit at a
// gimbal lock. Parts built in code use the angles; parts loaded from a file use
// the matrix.
//
// Collision is a flag rather than a shape, which is enough while every brick is a
// box: the physics resolver only needs to know whether to consider it. Anchored
// is separate again: collision says whether a brick is solid, anchored says
// whether the physics step is allowed to move it.

#pragma once

#include <DirectXMath.h>

#include <array>
#include <string>

namespace fieldbrik {

// What generated mesh draws a part. Everything is scaled from a unit shape, so a
// sphere of any size is the same geometry. The head is the era's own model and
// keeps its own path; RoundedHead is the generated block used when that model
// cannot be read.
//
// Collision is still a box for every shape: the physics resolver has no sphere or
// wedge test, and pretending it does would be worse than saying so.
enum class PartShape { Cube, RoundedHead, Sphere, Cylinder, Wedge };

// The six faces a decal can sit on, in the order the renderer's quads are built.
enum class PartFace { Top = 0, Bottom, Front, Back, Right, Left };
constexpr int kPartFaceCount = 6;

struct Part {
  DirectX::XMFLOAT3 position{0.0f, 0.0f, 0.0f};
  DirectX::XMFLOAT3 size{1.0f, 1.0f, 1.0f};
  DirectX::XMFLOAT3 rotationDegrees{0.0f, 0.0f, 0.0f};

  // Set when the rotation came from a place file. Stored already in this
  // project's row-vector convention, so it can be used directly.
  bool hasRotationMatrix = false;
  DirectX::XMFLOAT3X3 rotationMatrix{1.0f, 0.0f, 0.0f,
                                     0.0f, 1.0f, 0.0f,
                                     0.0f, 0.0f, 1.0f};

  DirectX::XMFLOAT3 colour{0.6f, 0.6f, 0.6f};
  bool collides = true;

  // The place file's Anchored. Unanchored bricks are simulated by
  // Physics/Dynamics: they fall, are shoved by the player and rest on whatever
  // is under them. A file with no Anchored property stays anchored, so the
  // places FieldBrik's own Studio has written do not collapse when they open.
  bool anchored = true;

  // Only meaningful while unanchored.
  DirectX::XMFLOAT3 velocity{0.0f, 0.0f, 0.0f};

  // Where the brick began, so one that falls out of the world is put back
  // instead of being lost for the rest of the visit.
  DirectX::XMFLOAT3 homePosition{0.0f, 0.0f, 0.0f};

  // The part's own TextureID, which the era put on the top face. Kept as its own
  // field so every existing place keeps working; the renderer treats it as a
  // decal on the top face.
  std::string textureId;

  // A decal per face, from Decal children in the place file. Empty means the face
  // keeps its surface strip. The lookup is the same last-segment-by-name one the
  // top-face texture has always used.
  std::array<std::string, kPartFaceCount> faceTextures{};

  std::string name;

  // Which generated mesh draws this part. A place file's bricks are all cubes;
  // the avatar asks for the head.
  PartShape shape = PartShape::Cube;

  DirectX::XMMATRIX RotationMatrix() const {
    if (hasRotationMatrix) return DirectX::XMLoadFloat3x3(&rotationMatrix);
    return DirectX::XMMatrixRotationRollPitchYaw(
        DirectX::XMConvertToRadians(rotationDegrees.x),
        DirectX::XMConvertToRadians(rotationDegrees.y),
        DirectX::XMConvertToRadians(rotationDegrees.z));
  }

  // Scale, then rotate, then translate: rotation happens around the brick's own
  // centre, which is what a building tool expects when you spin a brick in place.
  DirectX::XMFLOAT4X4 ModelMatrix() const {
    using namespace DirectX;

    const XMMATRIX scale = XMMatrixScaling(size.x, size.y, size.z);
    const XMMATRIX rotate = RotationMatrix();
    const XMMATRIX translate =
        XMMatrixTranslation(position.x, position.y, position.z);

    DirectX::XMFLOAT4X4 result;
    XMStoreFloat4x4(&result, scale * rotate * translate);
    return result;
  }
};

}  // namespace fieldbrik
