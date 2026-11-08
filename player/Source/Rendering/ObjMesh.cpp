#include "Rendering/ObjMesh.h"

#include <algorithm>
#include <cmath>
#include <cstddef>
#include <cstdlib>
#include <vector>

namespace fieldbrik {
namespace {

// Pulls the next whitespace-separated token off a line. The line is not copied:
// everything is walked by pointer, because the head mesh is a few hundred
// kilobytes of text and it is parsed once at startup.
bool NextToken(const char*& cursor, const char* end, std::string& token) {
  while (cursor < end && (*cursor == ' ' || *cursor == '\t' || *cursor == '\r')) {
    ++cursor;
  }
  if (cursor >= end) return false;

  const char* start = cursor;
  while (cursor < end && *cursor != ' ' && *cursor != '\t' && *cursor != '\r' &&
         *cursor != '\n') {
    ++cursor;
  }

  token.assign(start, static_cast<std::size_t>(cursor - start));
  return true;
}

bool Number(const std::string& token, float& value) {
  if (token.empty()) return false;

  char* end = nullptr;
  value = std::strtof(token.c_str(), &end);
  return end != token.c_str();
}

// OBJ indices are 1-based, and a negative one counts back from the attributes
// read so far, which is how an exporter writes a face into the middle of a file.
bool Resolve(int value, int count, int& out) {
  if (value > 0) {
    if (value > count) return false;
    out = value - 1;
    return true;
  }
  if (value < 0) {
    if (-value > count) return false;
    out = count + value;
    return true;
  }
  return false;
}

// One face corner: "7", "7/3", "7//2" or "7/3/2". A missing attribute is -1,
// which is how a model without UVs or normals is written.
bool Corner(const std::string& token, int positions, int texcoords, int normals,
            int& position, int& texcoord, int& normal) {
  int values[3] = {0, 0, 0};

  int slot = 0;
  std::size_t start = 0;
  while (slot < 3) {
    const std::size_t slash = token.find('/', start);
    const std::string piece =
        token.substr(start, slash == std::string::npos ? std::string::npos
                                                       : slash - start);
    if (!piece.empty()) values[slot] = std::atoi(piece.c_str());

    ++slot;
    if (slash == std::string::npos) break;
    start = slash + 1;
  }

  texcoord = -1;
  normal = -1;

  if (!Resolve(values[0], positions, position)) return false;
  if (values[1] != 0 && !Resolve(values[1], texcoords, texcoord)) return false;
  if (values[2] != 0 && !Resolve(values[2], normals, normal)) return false;
  return true;
}

}  // namespace

bool ParseObj(std::string_view text, MeshData& out, std::wstring& error) {
  out.vertices.clear();
  out.indices.clear();

  std::vector<float> positions;
  std::vector<float> texcoords;
  std::vector<float> normals;

  const char* cursor = text.data();
  const char* const end = cursor + text.size();
  std::string token;

  while (cursor < end) {
    const char* lineEnd = cursor;
    while (lineEnd < end && *lineEnd != '\n') ++lineEnd;

    const char* line = cursor;
    cursor = lineEnd < end ? lineEnd + 1 : end;

    const char* walk = line;
    if (!NextToken(walk, lineEnd, token)) continue;

    if (token == "v" || token == "vn") {
      // Caught before the coordinate tokens overwrite `token`, which is what
      // decides whether these end up as positions or as normals.
      const bool isPosition = token == "v";

      float values[3]{};
      int count = 0;
      while (count < 3) {
        if (!NextToken(walk, lineEnd, token)) break;
        if (!Number(token, values[count])) break;
        ++count;
      }
      if (count < 3) {
        error = L"A vertex in the head model is missing a coordinate.";
        return false;
      }

      std::vector<float>& target = isPosition ? positions : normals;
      target.insert(target.end(), values, values + 3);
    } else if (token == "vt") {
      float values[2]{};
      int count = 0;
      while (count < 2) {
        if (!NextToken(walk, lineEnd, token)) break;
        if (!Number(token, values[count])) break;
        ++count;
      }
      if (count < 2) {
        error = L"A texture coordinate in the head model is incomplete.";
        return false;
      }
      texcoords.insert(texcoords.end(), values, values + 2);
    } else if (token == "f") {
      const int positionCount = static_cast<int>(positions.size() / 3);
      const int texcoordCount = static_cast<int>(texcoords.size() / 2);
      const int normalCount = static_cast<int>(normals.size() / 3);

      // A face is a fan: the first corner is shared by every triangle.
      int corners = 0;
      int firstPosition = -1;
      int firstTexcoord = -1;
      int firstNormal = -1;
      int previousPosition = -1;
      int previousTexcoord = -1;
      int previousNormal = -1;

      // Emits one corner as a vertex and returns its index.
      const auto emit = [&](int position, int texcoord, int normal) {
        Vertex vertex;
        vertex.position = {positions[static_cast<std::size_t>(position) * 3],
                           positions[static_cast<std::size_t>(position) * 3 + 1],
                           positions[static_cast<std::size_t>(position) * 3 + 2]};

        if (normal >= 0) {
          vertex.normal = {normals[static_cast<std::size_t>(normal) * 3],
                           normals[static_cast<std::size_t>(normal) * 3 + 1],
                           normals[static_cast<std::size_t>(normal) * 3 + 2]};
        }

        out.vertices.push_back(vertex);
        return static_cast<unsigned int>(out.vertices.size() - 1);
      };

      while (NextToken(walk, lineEnd, token)) {
        int position = -1;
        int texcoord = -1;
        int normal = -1;
        if (!Corner(token, positionCount, texcoordCount, normalCount, position,
                    texcoord, normal)) {
          error = L"A face in the head model points at a vertex that is not there.";
          return false;
        }

        if (corners == 0) {
          firstPosition = position;
          firstTexcoord = texcoord;
          firstNormal = normal;
        } else if (corners >= 2) {
          const unsigned int a = emit(firstPosition, firstTexcoord, firstNormal);
          const unsigned int b = emit(previousPosition, previousTexcoord, previousNormal);
          const unsigned int c = emit(position, texcoord, normal);
          out.indices.push_back(a);
          out.indices.push_back(b);
          out.indices.push_back(c);
        }

        previousPosition = position;
        previousTexcoord = texcoord;
        previousNormal = normal;
        ++corners;
      }

      if (corners < 3) {
        error = L"A face in the head model has fewer than three corners.";
        return false;
      }
    }
  }

  if (out.indices.empty()) {
    error = L"The head model has no faces in it.";
    return false;
  }

  // A model with no normals drawn flat: the light needs one per vertex, and a
  // geometric normal per corner is what a faceted look wants anyway.
  for (std::size_t i = 0; i < out.indices.size(); i += 3) {
    Vertex& a = out.vertices[out.indices[i]];
    Vertex& b = out.vertices[out.indices[i + 1]];
    Vertex& c = out.vertices[out.indices[i + 2]];

    const bool flat = b.normal.x == 0.0f && b.normal.y == 0.0f && b.normal.z == 0.0f;
    if (!flat) continue;

    const float ux = b.position.x - a.position.x;
    const float uy = b.position.y - a.position.y;
    const float uz = b.position.z - a.position.z;
    const float vx = c.position.x - a.position.x;
    const float vy = c.position.y - a.position.y;
    const float vz = c.position.z - a.position.z;

    float nx = uy * vz - uz * vy;
    float ny = uz * vx - ux * vz;
    float nz = ux * vy - uy * vx;
    const float length = std::sqrtf(nx * nx + ny * ny + nz * nz);
    if (length > 0.0f) {
      nx /= length;
      ny /= length;
      nz /= length;
    }

    a.normal = {nx, ny, nz};
    b.normal = {nx, ny, nz};
    c.normal = {nx, ny, nz};
  }

  return true;
}

}  // namespace fieldbrik
