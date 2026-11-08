#include "World/World.h"

namespace fieldbrik {
namespace {

// DynaBlocks-era flat colours: muted, slightly dirty, nothing saturated.
constexpr DirectX::XMFLOAT3 kBaseplateColour{0.55f, 0.57f, 0.55f};
constexpr DirectX::XMFLOAT3 kBrickRed{0.72f, 0.27f, 0.22f};
constexpr DirectX::XMFLOAT3 kBrickBlue{0.26f, 0.42f, 0.72f};
constexpr DirectX::XMFLOAT3 kBrickYellow{0.85f, 0.72f, 0.26f};
constexpr DirectX::XMFLOAT3 kBrickGreen{0.34f, 0.58f, 0.32f};
constexpr DirectX::XMFLOAT3 kBrickWhite{0.87f, 0.87f, 0.84f};
constexpr DirectX::XMFLOAT3 kBrickGrey{0.62f, 0.63f, 0.66f};

}  // namespace

void World::Add(const char* name, DirectX::XMFLOAT3 position,
                DirectX::XMFLOAT3 size, DirectX::XMFLOAT3 colour,
                DirectX::XMFLOAT3 rotation, bool collides) {
  Part part;
  part.name = name;
  part.position = position;
  part.size = size;
  part.colour = colour;
  part.rotationDegrees = rotation;
  part.collides = collides;
  parts_.push_back(part);
}

void World::BuildDefault() {
  parts_.clear();

  // The baseplate is an ordinary part: 80x1x80 studs, its top surface at y = 0.
  // Making it a part rather than a special case is what lets the same code draw
  // it, and later collide with it.
  Add("Baseplate", {0.0f, -0.5f, 0.0f}, {80.0f, 1.0f, 80.0f}, kBaseplateColour);

  // A few bricks that are hard to mistake for each other: different sizes,
  // different colours, different heights, and some rotation.
  Add("Red slab", {0.0f, 0.5f, 0.0f}, {8.0f, 1.0f, 8.0f}, kBrickRed);
  Add("Blue block", {12.0f, 1.0f, 2.0f}, {4.0f, 2.0f, 4.0f}, kBrickBlue);
  Add("Yellow pillar", {-11.0f, 3.0f, 4.0f}, {2.0f, 6.0f, 2.0f}, kBrickYellow);
  Add("Green wall", {7.0f, 1.5f, -9.0f}, {10.0f, 3.0f, 1.0f}, kBrickGreen);
  Add("White cube", {-7.0f, 1.5f, -8.0f}, {3.0f, 3.0f, 3.0f}, kBrickWhite,
      {0.0f, 30.0f, 0.0f});
  Add("Tilted plane", {0.0f, 3.0f, -16.0f}, {9.0f, 0.6f, 5.0f}, kBrickGrey,
      {14.0f, -18.0f, 0.0f});

  // A short flight of steps, to check that sizes read correctly next to each
  // other without needing a texture.
  Add("Step 1", {-16.0f, 0.5f, -14.0f}, {6.0f, 1.0f, 6.0f}, kBrickBlue);
  Add("Step 2", {-16.0f, 1.5f, -19.0f}, {6.0f, 1.0f, 4.0f}, kBrickBlue);
  Add("Step 3", {-16.0f, 2.5f, -23.0f}, {6.0f, 1.0f, 2.0f}, kBrickBlue);

  // A tall thin marker at the spawn point, so the middle of the world is
  // findable once the camera can be moved anywhere.
  Add("Spawn marker", {0.0f, 4.0f, 0.0f}, {0.6f, 8.0f, 0.6f}, kBrickRed, {0, 0, 0},
      false);
}

}  // namespace fieldbrik
