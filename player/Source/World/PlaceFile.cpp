#include "World/PlaceFile.h"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <cstdlib>
#include <fstream>
#include <iomanip>
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
      // Numeric references are used for the odd character in a name.
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

  // The tag's own name.
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

  // Attributes.
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
      return true;  // self-closing
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

  // Content: text, children, and the matching closing tag.
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

// Which mesh a place asks for. The era named the shape on the Part itself, and
// also had WedgePart and CylinderPart classes, so both are read.
PartShape ReadShape(const Element& item, const std::string& className) {
  if (EqualsIgnoreCase(className, "WedgePart")) return PartShape::Wedge;
  if (EqualsIgnoreCase(className, "CylinderPart")) return PartShape::Cylinder;

  if (const Element* shape = FindProperty(item, "Shape")) {
    const std::string value = Trim(shape->text);
    if (EqualsIgnoreCase(value, "Ball") || EqualsIgnoreCase(value, "Sphere")) {
      return PartShape::Sphere;
    }
    if (EqualsIgnoreCase(value, "Cylinder")) return PartShape::Cylinder;
    if (EqualsIgnoreCase(value, "Wedge")) return PartShape::Wedge;
  }

  return PartShape::Cube;
}

// Which face a Decal names. Unknown faces are skipped rather than guessed at.
int FaceIndex(const std::string& name) {
  if (EqualsIgnoreCase(name, "Top")) return 0;
  if (EqualsIgnoreCase(name, "Bottom")) return 1;
  if (EqualsIgnoreCase(name, "Front")) return 2;
  if (EqualsIgnoreCase(name, "Back")) return 3;
  if (EqualsIgnoreCase(name, "Right")) return 4;
  if (EqualsIgnoreCase(name, "Left")) return 5;
  return -1;
}

// A texture property is either a Content (with a url child) or a bare id.
std::string ReadTextureId(const Element& item) {
  const Element* texture = FindProperty(item, "Texture");
  if (!texture) texture = FindProperty(item, "TextureID");
  if (!texture) return std::string();

  if (const Element* url = texture->Child("url")) return Trim(url->text);
  return Trim(texture->text);
}

// Reads one Item, if it is something this client draws.
bool ReadItem(const Element& item, PlaceData& place) {
  const std::string* className = item.Attribute("class");
  if (!className) return false;

  const bool isSpawn = EqualsIgnoreCase(*className, "SpawnLocation");
  const bool isPart = EqualsIgnoreCase(*className, "Part") ||
                      EqualsIgnoreCase(*className, "WedgePart") ||
                      EqualsIgnoreCase(*className, "CylinderPart");
  if (!isSpawn && !isPart) return false;

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

  part.textureId = ReadTextureId(item);

  // Decals are children of the brick they cover, each naming a face. A decal on
  // the top face wins over the part's own TextureID, because it is the more
  // specific statement.
  for (const Element& child : item.children) {
    const std::string* decalClass = child.Attribute("class");
    if (!decalClass) continue;
    if (!EqualsIgnoreCase(*decalClass, "Decal") &&
        !EqualsIgnoreCase(*decalClass, "Texture")) {
      continue;
    }

    const int face = FaceIndex(Text(FindProperty(child, "Face")));
    if (face < 0) continue;

    const std::string id = ReadTextureId(child);
    if (!id.empty()) {
      part.faceTextures[static_cast<size_t>(face)] = id;
    }
  }

  if (!isSpawn) part.shape = ReadShape(item, *className);

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

  if (extension != ".rbxl" && extension != ".rbxlx" && extension != ".xml" &&
      extension != ".fbrx") {
    error = "only .rbxl and .fbrx places are supported so far";
    return false;
  }

  // Studio writes .fbrx with the same XML schema. An empty .fbrx is a valid
  // empty place; the older formats still have to contain something to open.
  const bool fieldBrikPlace = extension == ".fbrx";

  std::string text;
  if (!ReadWholeFile(path, text, error)) return false;

  size_t position = 0;
  Element root;
  if (!ParseElement(text, position, root, error)) return false;

  out.parts.clear();
  WalkItems(root, out);

  if (out.parts.empty() && !fieldBrikPlace) {
    error = "the file has no parts in it";
    return false;
  }

  return true;
}

bool SavePlaceFile(const std::string& path, const std::vector<Part>& parts,
                   std::string& error) {
  std::ofstream file(path, std::ios::binary);
  if (!file) {
    error = "the place file could not be written";
    return false;
  }

  const auto escape = [](const std::string& text) {
    std::string out;
    out.reserve(text.size());
    for (char character : text) {
      switch (character) {
        case '&': out += "&amp;"; break;
        case '<': out += "&lt;"; break;
        case '>': out += "&gt;"; break;
        case '"': out += "&quot;"; break;
        case '\'': out += "&apos;"; break;
        default: out.push_back(character); break;
      }
    }
    return out;
  };

  file << std::fixed << std::setprecision(6);
  file << "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n";
  file << "<roblox version=\"4\">\n";
  file << "  <Item class=\"Workspace\" referent=\"RBX0\">\n";
  file << "    <Properties>\n";
  file << "      <string name=\"Name\">Workspace</string>\n";
  file << "    </Properties>\n";

  for (size_t index = 0; index < parts.size(); ++index) {
    const Part& part = parts[index];

    const char* className = "Part";
    if (part.shape == PartShape::Cylinder) {
      className = "CylinderPart";
    } else if (part.shape == PartShape::Wedge) {
      className = "WedgePart";
    }

    XMFLOAT3X3 rotation{};
    XMStoreFloat3x3(&rotation, part.RotationMatrix());

    const uint32_t red = static_cast<uint32_t>(
        std::min(255.0f, std::max(0.0f, part.colour.x)) * 255.0f + 0.5f);
    const uint32_t green = static_cast<uint32_t>(
        std::min(255.0f, std::max(0.0f, part.colour.y)) * 255.0f + 0.5f);
    const uint32_t blue = static_cast<uint32_t>(
        std::min(255.0f, std::max(0.0f, part.colour.z)) * 255.0f + 0.5f);
    const uint32_t packed = 0xFF000000u | (red << 16) | (green << 8) | blue;

    file << "    <Item class=\"" << className << "\" referent=\"RBX"
         << (index + 1) << "\">\n";
    file << "      <Properties>\n";
    file << "        <string name=\"Name\">" << escape(part.name)
         << "</string>\n";

    file << "        <CoordinateFrame name=\"CFrame\">\n";
    file << "          <X>" << part.position.x << "</X>\n";
    file << "          <Y>" << part.position.y << "</Y>\n";
    file << "          <Z>" << part.position.z << "</Z>\n";
    for (int row = 0; row < 3; ++row) {
      for (int column = 0; column < 3; ++column) {
        file << "          <R" << row << column << ">"
             << rotation.m[column][row] << "</R" << row << column
             << ">\n";
      }
    }
    file << "        </CoordinateFrame>\n";

    file << "        <Vector3 name=\"size\">\n";
    file << "          <X>" << part.size.x << "</X>\n";
    file << "          <Y>" << part.size.y << "</Y>\n";
    file << "          <Z>" << part.size.z << "</Z>\n";
    file << "        </Vector3>\n";

    file << "        <Color3uint8 name=\"Color3uint8\">" << packed
         << "</Color3uint8>\n";

    if (part.shape == PartShape::Sphere) {
      file << "        <token name=\"Shape\">Ball</token>\n";
    }

    file << "        <bool name=\"CanCollide\">"
         << (part.collides ? "true" : "false") << "</bool>\n";

    if (!part.textureId.empty()) {
      file << "        <Content name=\"TextureID\"><url>"
           << escape(part.textureId) << "</url></Content>\n";
    }

    file << "      </Properties>\n";

    static const char* kFaceNames[kPartFaceCount] = {
        "Top", "Bottom", "Front", "Back", "Right", "Left"};
    for (int face = 0; face < kPartFaceCount; ++face) {
      const std::string& texture = part.faceTextures[static_cast<size_t>(face)];
      if (texture.empty()) continue;

      file << "      <Item class=\"Decal\" referent=\"RBX" << (index + 1)
           << "Decal" << face << "\">\n";
      file << "        <Properties>\n";
      file << "          <token name=\"Face\">" << kFaceNames[face]
           << "</token>\n";
      file << "          <Content name=\"Texture\"><url>" << escape(texture)
           << "</url></Content>\n";
      file << "        </Properties>\n";
      file << "      </Item>\n";
    }

    file << "    </Item>\n";
  }

  file << "  </Item>\n";
  file << "</roblox>\n";

  if (!file) {
    error = "the place file could not be finished";
    return false;
  }

  return true;
}

}  // namespace fieldbrik
