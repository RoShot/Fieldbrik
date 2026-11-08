#include "World/PlaceFile.h"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <cstdlib>
#include <fstream>
#include <sstream>

using namespace DirectX;

namespace fieldbrik {
namespace {

bool EqualsIgnoreCase(const std::string& a, const char* b);

// Enough of an XML document to read a place: elements, attributes, text and the
// prolog. No namespaces, no entities beyond the five that matter, no validation.
struct Element {
  std::string name;
  std::vector<std::pair<std::string, std::string>> attributes;
  std::string text;
  std::vector<Element> children;

  const std::string* Attribute(const char* key) const {
    for (const auto& attribute : attributes) {
      if (EqualsIgnoreCase(attribute.first, key)) return &attribute.second;
    }
    return nullptr;
  }

  const Element* Child(const char* childName) const {
    for (const Element& child : children) {
      if (EqualsIgnoreCase(child.name, childName)) return &child;
    }
    return nullptr;
  }
};

bool EqualsIgnoreCase(const std::string& a, const char* b) {
  size_t index = 0;
  for (; index < a.size() && b[index] != '\0'; ++index) {
    if (std::tolower(static_cast<unsigned char>(a[index])) !=
        std::tolower(static_cast<unsigned char>(b[index]))) {
      return false;
    }
  }
  return index == a.size() && b[index] == '\0';
}

std::string Trim(const std::string& text) {
  size_t begin = 0;
  size_t end = text.size();
  while (begin < end && std::isspace(static_cast<unsigned char>(text[begin]))) {
    ++begin;
  }
  while (end > begin && std::isspace(static_cast<unsigned char>(text[end - 1]))) {
    --end;
  }
  return text.substr(begin, end - begin);
}

std::string DecodeEntities(const std::string& text) {
  std::string out;
  out.reserve(text.size());

  for (size_t index = 0; index < text.size(); ++index) {
    if (text[index] != '&') {
      out.push_back(text[index]);
      continue;
    }

    const size_t semicolon = text.find(';', index);
    if (semicolon == std::string::npos) {
      out.push_back(text[index]);
      continue;
    }

    const std::string entity = text.substr(index + 1, semicolon - index - 1);
    if (entity == "amp") {
      out.push_back('&');
    } else if (entity == "lt") {
      out.push_back('<');
    } else if (entity == "gt") {
      out.push_back('>');
    } else if (entity == "quot") {
      out.push_back('"');
    } else if (entity == "apos") {
      out.push_back('\'');
    } else if (!entity.empty() && entity[0] == '#') {
      const int code = std::strtol(entity.c_str() + 1, nullptr, 10);
      if (code > 0 && code < 128) out.push_back(static_cast<char>(code));
    } else {
      out.push_back('&');
      continue;
    }

    index = semicolon;
  }

  return out;
}

bool SkipSpace(const std::string& text, size_t& position) {
  while (position < text.size() &&
         std::isspace(static_cast<unsigned char>(text[position]))) {
    ++position;
  }
  return position < text.size();
}

// Comments, the XML declaration and a DOCTYPE line all have to be stepped over
// before the first real element.
bool SkipNoise(const std::string& text, size_t& position) {
  for (;;) {
    SkipSpace(text, position);
    if (position + 1 >= text.size() || text[position] != '<') return true;

    if (text.compare(position, 4, "<!--") == 0) {
      const size_t end = text.find("-->", position + 4);
      if (end == std::string::npos) return false;
      position = end + 3;
      continue;
    }

    if (text.compare(position, 9, "<![CDATA[") == 0) {
      const size_t end = text.find("]]>", position + 9);
      if (end == std::string::npos) return false;
      position = end + 3;
      continue;
    }

    if (text[position + 1] == '?' || text[position + 1] == '!') {
      const size_t end = text.find('>', position);
      if (end == std::string::npos) return false;
      position = end + 1;
      continue;
    }

    return true;
  }
}

bool ParseElement(const std::string& text, size_t& position, Element& element,
                  std::string& error) {
  if (!SkipNoise(text, position)) {
    error = "the file ends in the middle of a tag";
    return false;
  }
  if (position >= text.size() || text[position] != '<') {
    error = "expected a tag";
    return false;
  }

  ++position;

  const size_t nameStart = position;
  while (position < text.size() && !std::isspace(static_cast<unsigned char>(
                                       text[position])) &&
         text[position] != '>' && text[position] != '/') {
    ++position;
  }
  element.name = text.substr(nameStart, position - nameStart);
  if (element.name.empty()) {
    error = "a tag has no name";
    return false;
  }

  for (;;) {
    SkipSpace(text, position);
    if (position >= text.size()) {
      error = "a tag is not closed";
      return false;
    }
    if (text[position] == '>') {
      ++position;
      break;
    }
    if (text[position] == '/') {
      ++position;
      if (position >= text.size() || text[position] != '>') {
        error = "a tag is not closed";
        return false;
      }
      ++position;
      return true;
    }

    const size_t keyStart = position;
    while (position < text.size() && text[position] != '=' &&
           !std::isspace(static_cast<unsigned char>(text[position]))) {
      ++position;
    }
    const std::string key = text.substr(keyStart, position - keyStart);

    SkipSpace(text, position);
    if (position >= text.size() || text[position] != '=') {
      error = "an attribute has no value";
      return false;
    }
    ++position;
    SkipSpace(text, position);
    if (position >= text.size() || (text[position] != '"' && text[position] != '\'')) {
      error = "an attribute value is not quoted";
      return false;
    }

    const char quote = text[position];
    ++position;
    const size_t valueStart = position;
    while (position < text.size() && text[position] != quote) ++position;
    if (position >= text.size()) {
      error = "an attribute value is not closed";
      return false;
    }

    element.attributes.emplace_back(
        key, DecodeEntities(text.substr(valueStart, position - valueStart)));
    ++position;
  }

  for (;;) {
    const size_t textStart = position;
    while (position < text.size() && text[position] != '<') ++position;
    element.text += DecodeEntities(text.substr(textStart, position - textStart));

    if (position >= text.size()) {
      error = "a tag is never closed";
      return false;
    }

    // Comments and CDATA are legal anywhere, including between the items of a
    // workspace, so they are stepped over here as well as in the prolog.
    if (text.compare(position, 4, "<!--") == 0) {
      const size_t end = text.find("-->", position + 4);
      if (end == std::string::npos) {
        error = "a comment is never closed";
        return false;
      }
      position = end + 3;
      continue;
    }

    if (text.compare(position, 9, "<![CDATA[") == 0) {
      const size_t end = text.find("]]>", position + 9);
      if (end == std::string::npos) {
        error = "a CDATA block is never closed";
        return false;
      }
      element.text += text.substr(position + 9, end - position - 9);
      position = end + 3;
      continue;
    }

    if (text.compare(position, 2, "</") == 0) {
      const size_t end = text.find('>', position);
      if (end == std::string::npos) {
        error = "a closing tag is not closed";
        return false;
      }
      const std::string closing =
          Trim(text.substr(position + 2, end - position - 2));
      if (!EqualsIgnoreCase(closing, element.name.c_str())) {
        error = "a closing tag does not match its opening tag";
        return false;
      }
      position = end + 1;
      return true;
    }

    Element child;
    if (!ParseElement(text, position, child, error)) return false;
    element.children.push_back(std::move(child));
  }
}

// Properties live inside <Properties>, but some hand-written files put them
// straight on the item.
const Element* FindProperty(const Element& item, const char* propertyName) {
  const auto matches = [propertyName](const Element& candidate) {
    const std::string* attribute = candidate.Attribute("name");
    return attribute != nullptr && EqualsIgnoreCase(*attribute, propertyName);
  };

  if (const Element* properties = item.Child("Properties")) {
    for (const Element& child : properties->children) {
      if (matches(child)) return &child;
    }
  }

  for (const Element& child : item.children) {
    if (matches(child)) return &child;
  }

  return nullptr;
}

float Number(const Element* parent, const char* childName, float fallback) {
  if (!parent) return fallback;
  const Element* child = parent->Child(childName);
  if (!child) return fallback;
  const std::string value = Trim(child->text);
  if (value.empty()) return fallback;
  return static_cast<float>(std::atof(value.c_str()));
}

std::string Text(const Element* element) {
  return element ? Trim(element->text) : std::string();
}

// Colour3uint8 is a 32-bit 0xAARRGGBB number written in decimal.
bool ReadColour(const Element* property, XMFLOAT3& colour) {
  if (!property) return false;

  if (EqualsIgnoreCase(property->name, "Color3uint8")) {
    const std::string value = Trim(property->text);
    if (value.empty()) return false;
    const uint32_t packed =
        static_cast<uint32_t>(std::strtoull(value.c_str(), nullptr, 10));
    colour = {((packed >> 16) & 0xFF) / 255.0f, ((packed >> 8) & 0xFF) / 255.0f,
              (packed & 0xFF) / 255.0f};
    return true;
  }

  colour = {Number(property, "R", colour.x), Number(property, "G", colour.y),
            Number(property, "B", colour.z)};
  return true;
}

// A CoordinateFrame's rotation is given as a 3x3 matrix in the file's
// column-vector convention, so it is transposed into this project's row-vector
// one. Translation lives in X/Y/Z alongside it.
void ReadCFrame(const Element* property, XMFLOAT3& position, Part& part) {
  if (!property) return;

  position = {Number(property, "X", position.x), Number(property, "Y", position.y),
              Number(property, "Z", position.z)};

  if (!property->Child("R00")) return;

  XMFLOAT3X3& matrix = part.rotationMatrix;
  float rows[3][3];
  for (int row = 0; row < 3; ++row) {
    for (int column = 0; column < 3; ++column) {
      const std::string tag = "R" + std::string(1, static_cast<char>('0' + row)) +
                              std::string(1, static_cast<char>('0' + column));
      rows[row][column] = Number(property, tag.c_str(), row == column ? 1.0f : 0.0f);
    }
  }

  for (int row = 0; row < 3; ++row) {
    for (int column = 0; column < 3; ++column) {
      matrix.m[row][column] = rows[column][row];
    }
  }

  part.hasRotationMatrix = true;
}

// Reads one Item, if it is something this client draws.
bool ReadItem(const Element& item, PlaceData& place) {
  const std::string* className = item.Attribute("class");
  if (!className) return false;

  const bool isSpawn = EqualsIgnoreCase(*className, "SpawnLocation");
  if (!isSpawn && !EqualsIgnoreCase(*className, "Part")) return false;

  Part part;
  part.name = Text(FindProperty(item, "Name"));
  if (part.name.empty()) part.name = isSpawn ? "SpawnLocation" : "Part";

  // Older places write the property as "size", newer ones as "Size".
  const Element* extent = FindProperty(item, "size");
  if (!extent) extent = FindProperty(item, "Size");
  if (extent) {
    part.size = {Number(extent, "X", 1.0f), Number(extent, "Y", 1.0f),
                 Number(extent, "Z", 1.0f)};
  }

  const Element* frame = FindProperty(item, "CFrame");
  if (!frame) frame = FindProperty(item, "CoordinateFrame");
  ReadCFrame(frame, part.position, part);

  if (!ReadColour(FindProperty(item, "Color3uint8"), part.colour)) {
    if (!ReadColour(FindProperty(item, "Color"), part.colour)) {
      if (!ReadColour(FindProperty(item, "Color3uint8uint8"), part.colour)) {
        part.colour = {0.64f, 0.64f, 0.64f};
      }
    }
  }

  if (const Element* canCollide = FindProperty(item, "CanCollide")) {
    part.collides = !EqualsIgnoreCase(Trim(canCollide->text), "false");
  }

  if (const Element* texture = FindProperty(item, "TextureID")) {
    if (const Element* url = texture->Child("url")) {
      part.textureId = Trim(url->text);
    } else if (!Trim(texture->text).empty()) {
      part.textureId = Trim(texture->text);
    }
  }

  if (isSpawn) {
    // Stand on top of the spawn brick, not inside it.
    place.spawn = {part.position.x, part.position.y + part.size.y * 0.5f,
                   part.position.z};
    place.haveSpawn = true;
  }

  place.parts.push_back(std::move(part));
  return true;
}

// Items nest (a Part lives inside Workspace), so the whole tree is walked.
void WalkItems(const Element& element, PlaceData& place) {
  for (const Element& child : element.children) {
    if (EqualsIgnoreCase(child.name, "Item")) {
      ReadItem(child, place);
    }
    WalkItems(child, place);
  }
}

bool ReadWholeFile(const std::string& path, std::string& text, std::string& error) {
  std::ifstream file(path, std::ios::binary);
  if (!file) {
    error = "the place file could not be opened";
    return false;
  }

  std::ostringstream buffer;
  buffer << file.rdbuf();
  text = buffer.str();

  if (text.empty()) {
    error = "the place file is empty";
    return false;
  }

  return true;
}

std::string Lower(const std::string& text) {
  std::string out = text;
  std::transform(out.begin(), out.end(), out.begin(), [](unsigned char c) {
    return static_cast<char>(std::tolower(c));
  });
  return out;
}

}  // namespace

bool LoadPlaceFile(const std::string& path, PlaceData& out, std::string& error) {
  const std::string extension = Lower(path.substr(path.find_last_of('.') ==
                                                      std::string::npos
                                                  ? path.size()
                                                  : path.find_last_of('.')));

  if (extension != ".rbxl" && extension != ".rbxlx" && extension != ".xml") {
    // .fbrx is reserved for the format Studio will write. Saying so is friendlier
    // than "unknown file".
    if (extension == ".fbrx") {
      error = ".fbrx places are not supported yet";
    } else {
      error = "only .rbxl places are supported so far";
    }
    return false;
  }

  std::string text;
  if (!ReadWholeFile(path, text, error)) return false;

  size_t position = 0;
  Element root;
  if (!ParseElement(text, position, root, error)) return false;

  out.parts.clear();
  WalkItems(root, out);

  if (out.parts.empty()) {
    error = "the file has no parts in it";
    return false;
  }

  return true;
}

}  // namespace fieldbrik
