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
// box: the physics resolver only needs to know whether to consider it.

#pragma once

#include <DirectXMath.h>

#include <string>

namespace fieldbrik {

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

  // Asset id or path of the part's texture, straight out of the place file. The
  // renderer does not draw textures yet, so this is carried rather than used.
  std::string textureId;

  std::string name;

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
