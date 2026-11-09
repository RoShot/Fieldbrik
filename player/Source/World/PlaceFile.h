// Reading a place from a file.
//
// The format is Roblox's XML place file — what .rbxl was before it went binary —
// because it is plain, readable text and because maps exist in it. What is read
// is only what this client understands: Part and SpawnLocation items and the
// properties that mean something here. Every other class and property in the file
// is skipped, so a real map opens instead of failing on the first thing the
// client has never heard of.
//
// Choosing a format by extension is deliberate: .fbrx can be added beside .rbxl
// without changing any caller, and without a "version 2" flag threaded through
// the code.
//
// Not read yet, and listed as known issues: Script (there is no Lua), Decal and
// texture drawing (the id is carried on the part but nothing paints it) and welded
// assemblies (unanchored bricks are simulated one by one, never as a welded
// group).

#pragma once

#include <string>
#include <vector>

#include "World/Part.h"

namespace fieldbrik {

struct PlaceData {
  std::vector<Part> parts;
  DirectX::XMFLOAT3 spawn{0.0f, 0.0f, 14.0f};

  // True when the file had a SpawnLocation, so an empty or odd file cannot move
  // the player somewhere the map author never asked for.
  bool haveSpawn = false;

  std::string name;
};

// Returns false and fills `error` with why, rather than throwing or exiting: a
// broken map should leave the client running on its built-in place.
bool LoadPlaceFile(const std::string& path, PlaceData& out, std::string& error);

// Writes the place as the same XML the reader understands. Studio saves .fbrx
// through this; the player can open the result because the extension is the only
// difference from an XML .rbxl.
bool SavePlaceFile(const std::string& path, const std::vector<Part>& parts,
                   std::string& error);

}  // namespace fieldbrik
