// One brick.
//
// Position is the centre of the brick, size is its full extent in studs, and
// rotation is Euler degrees (X pitch, Y yaw, Z roll). Collision is a flag for
// now rather than a shape: Milestone 4 is what gives it meaning, but carrying it
// on the part from the start keeps the data the same when physics arrives.

#pragma once

#include <DirectXMath.h>

#include <string>

namespace fieldbrik {

struct Part {
  DirectX::XMFLOAT3 position{0.0f, 0.0f, 0.0f};
  DirectX::XMFLOAT3 size{1.0f, 1.0f, 1.0f};
  DirectX::XMFLOAT3 rotationDegrees{0.0f, 0.0f, 0.0f};
  DirectX::XMFLOAT3 colour{0.6f, 0.6f, 0.6f};
  bool collides = true;
  std::string name;

  // Scale, then rotate, then translate: rotation happens around the brick's own
  // centre, which is what a building tool expects when you spin a brick in place.
  DirectX::XMFLOAT4X4 ModelMatrix() const {
    using namespace DirectX;

    const XMMATRIX scale = XMMatrixScaling(size.x, size.y, size.z);
    const XMMATRIX rotate = XMMatrixRotationRollPitchYaw(
        XMConvertToRadians(rotationDegrees.x),
        XMConvertToRadians(rotationDegrees.y),
        XMConvertToRadians(rotationDegrees.z));
    const XMMATRIX translate =
        XMMatrixTranslation(position.x, position.y, position.z);

    DirectX::XMFLOAT4X4 result;
    XMStoreFloat4x4(&result, scale * rotate * translate);
    return result;
  }
};

}  // namespace fieldbrik
