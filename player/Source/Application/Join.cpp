#include "Application/Join.h"

#include <windows.h>
#include <winhttp.h>

#include <cctype>
#include <cstdio>
#include <cwchar>
#include <cwctype>
#include <string>
#include <vector>

namespace fieldbrik {
namespace {

const wchar_t kScheme[] = L"fieldbrik://";

std::string NarrowAscii(const std::wstring& text) {
  std::string out;
  out.reserve(text.size());
  for (const wchar_t character : text) {
    out.push_back(character <= 0x7f ? static_cast<char>(character) : '?');
  }
  return out;
}

std::wstring WidenUtf8(const std::string& text) {
  if (text.empty()) return std::wstring();
  const int needed = MultiByteToWideChar(CP_UTF8, 0, text.c_str(), -1, nullptr, 0);
  if (needed <= 1) return std::wstring();

  std::wstring out(static_cast<size_t>(needed - 1), L'\0');
  MultiByteToWideChar(CP_UTF8, 0, text.c_str(), -1, out.data(), needed);
  return out;
}

int HexDigit(char value) {
  if (value >= '0' && value <= '9') return value - '0';
  if (value >= 'a' && value <= 'f') return value - 'a' + 10;
  return value - 'A' + 10;
}

std::string PercentDecode(const std::wstring& value) {
  const std::string bytes = NarrowAscii(value);
  std::string out;
  out.reserve(bytes.size());

  for (size_t index = 0; index < bytes.size(); ++index) {
    if (bytes[index] == '%' && index + 2 < bytes.size() &&
        std::isxdigit(static_cast<unsigned char>(bytes[index + 1])) != 0 &&
        std::isxdigit(static_cast<unsigned char>(bytes[index + 2])) != 0) {
      out.push_back(static_cast<char>(HexDigit(bytes[index + 1]) * 16 +
                                      HexDigit(bytes[index + 2])));
      index += 2;
    } else if (bytes[index] == '+') {
      out.push_back(' ');
    } else {
      out.push_back(bytes[index]);
    }
  }
  return out;
}

bool StartsWithScheme(const std::wstring& text) {
  const size_t length = std::wcslen(kScheme);
  if (text.size() < length) return false;
  for (size_t index = 0; index < length; ++index) {
    if (towlower(text[index]) != towlower(kScheme[index])) return false;
  }
  return true;
}

std::wstring QueryValue(const std::wstring& query, const wchar_t* key) {
  size_t position = 0;
  while (position <= query.size()) {
    const size_t end = query.find(L'&', position);
    const std::wstring pair =
        query.substr(position, end == std::wstring::npos ? std::wstring::npos
                                                         : end - position);
    const size_t equals = pair.find(L'=');
    if (equals != std::wstring::npos && pair.substr(0, equals) == key) {
      return pair.substr(equals + 1);
    }
    if (end == std::wstring::npos) break;
    position = end + 1;
  }
  return std::wstring();
}

bool ParseColour(const std::string& text, DirectX::XMFLOAT3& out) {
  if (text.size() != 6) return false;
  for (const char character : text) {
    if (std::isxdigit(static_cast<unsigned char>(character)) == 0) return false;
  }

  const auto channel = [&text](size_t at) {
    return static_cast<float>(HexDigit(text[at]) * 16 + HexDigit(text[at + 1])) /
           255.0f;
  };

  out = {channel(0), channel(2), channel(4)};
  return true;
}

void CloseHandles(HINTERNET request, HINTERNET connection, HINTERNET session) {
  if (request) WinHttpCloseHandle(request);
  if (connection) WinHttpCloseHandle(connection);
  if (session) WinHttpCloseHandle(session);
}

}  // namespace

bool IsJoinUrl(const std::wstring& argument) {
  return StartsWithScheme(argument);
}

bool ParseJoinUrl(const std::wstring& argument, JoinInfo& out,
                  std::wstring& error) {
  if (!StartsWithScheme(argument)) {
    error = L"That is not a FieldBrik launch link.";
    return false;
  }

  const size_t question = argument.find(L'?');
  const std::wstring query =
      question == std::wstring::npos ? std::wstring() : argument.substr(question + 1);

  const std::wstring place = QueryValue(query, L"place");
  if (place.empty()) {
    error = L"The launch link does not say which place to open.";
    return false;
  }

  out.placeUrl = WidenUtf8(PercentDecode(place));
  if (out.placeUrl.empty()) {
    error = L"The place address in the launch link cannot be read.";
    return false;
  }

  out.name = WidenUtf8(PercentDecode(QueryValue(query, L"name")));
  out.userId = WidenUtf8(PercentDecode(QueryValue(query, L"id")));
  out.face = PercentDecode(QueryValue(query, L"face"));

  const std::string colours = PercentDecode(QueryValue(query, L"colours"));
  if (!colours.empty()) {
    size_t start = 0;
    int index = 0;
    bool valid = true;

    while (start <= colours.size() && index < 6) {
      const size_t comma = colours.find(',', start);
      const std::string value =
          colours.substr(start, comma == std::string::npos ? std::string::npos
                                                           : comma - start);
      if (!ParseColour(value, out.colours[index])) {
        valid = false;
        break;
      }
      index += 1;
      if (comma == std::string::npos) break;
      start = comma + 1;
    }

    // Six colours or none: a partial palette would leave half an avatar in the
    // site's colours and half in the client's, which looks like a bug.
    if (!valid || index != 6) {
      error = L"The avatar colours in the launch link cannot be read.";
      return false;
    }
    out.hasColours = true;
  }

  return true;
}

bool DownloadPlace(const std::wstring& url, std::wstring& tempPath,
                   std::wstring& error) {
  URL_COMPONENTS parts{};
  parts.dwStructSize = sizeof(parts);
  parts.dwSchemeLength = static_cast<DWORD>(-1);
  parts.dwHostNameLength = static_cast<DWORD>(-1);
  parts.dwUrlPathLength = static_cast<DWORD>(-1);
  parts.dwExtraInfoLength = static_cast<DWORD>(-1);

  if (!WinHttpCrackUrl(url.c_str(), 0, 0, &parts)) {
    error = L"The place address cannot be read.";
    return false;
  }

  const bool secure = parts.nScheme == INTERNET_SCHEME_HTTPS;
  const std::wstring host(parts.lpszHostName, parts.dwHostNameLength);
  std::wstring path(parts.lpszUrlPath, parts.dwUrlPathLength);
  if (parts.lpszExtraInfo && parts.dwExtraInfoLength > 0) {
    path.append(parts.lpszExtraInfo, parts.dwExtraInfoLength);
  }

  HINTERNET session =
      WinHttpOpen(L"FieldBrikPlayer/0.21", WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
                  WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
  if (!session) {
    error = L"Could not start an HTTP session.";
    return false;
  }
  WinHttpSetTimeouts(session, 15000, 15000, 30000, 30000);

  HINTERNET connection = WinHttpConnect(session, host.c_str(), parts.nPort, 0);
  if (!connection) {
    error = L"Could not reach " + host + L".";
    CloseHandles(nullptr, nullptr, session);
    return false;
  }

  HINTERNET request = WinHttpOpenRequest(
      connection, L"GET", path.c_str(), nullptr, WINHTTP_NO_REFERER,
      WINHTTP_DEFAULT_ACCEPT_TYPES, secure ? WINHTTP_FLAG_SECURE : 0);
  if (!request) {
    error = L"Could not open the request.";
    CloseHandles(nullptr, connection, session);
    return false;
  }

  if (!WinHttpSendRequest(request, WINHTTP_NO_ADDITIONAL_HEADERS, 0,
                          WINHTTP_NO_REQUEST_DATA, 0, 0, 0) ||
      !WinHttpReceiveResponse(request, nullptr)) {
    error = L"The place could not be downloaded.";
    CloseHandles(request, connection, session);
    return false;
  }

  DWORD status = 0;
  DWORD statusSize = sizeof(status);
  WinHttpQueryHeaders(request, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
                      WINHTTP_HEADER_NAME_BY_INDEX, &status, &statusSize,
                      WINHTTP_NO_HEADER_INDEX);

  if (status != 200) {
    wchar_t message[96];
    swprintf_s(message, L"The site answered %lu instead of sending the place.",
               status);
    error = message;
    CloseHandles(request, connection, session);
    return false;
  }

  std::vector<char> bytes;
  for (;;) {
    DWORD available = 0;
    if (!WinHttpQueryDataAvailable(request, &available) || available == 0) break;

    const size_t offset = bytes.size();
    bytes.resize(offset + available);
    DWORD read = 0;
    if (!WinHttpReadData(request, bytes.data() + offset, available, &read) ||
        read == 0) {
      bytes.resize(offset);
      break;
    }
    bytes.resize(offset + read);
  }

  CloseHandles(request, connection, session);

  if (bytes.empty()) {
    error = L"The site sent an empty place file.";
    return false;
  }

  wchar_t directory[MAX_PATH]{};
  const DWORD length = GetTempPathW(MAX_PATH, directory);
  if (length == 0) {
    error = L"The temporary folder could not be found.";
    return false;
  }

  wchar_t name[64]{};
  swprintf_s(name, L"fieldbrik-join-%lu.rbxl",
             static_cast<unsigned long>(GetCurrentProcessId()));

  tempPath = std::wstring(directory, length) + name;

  HANDLE file = CreateFileW(tempPath.c_str(), GENERIC_WRITE, 0, nullptr,
                            CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, nullptr);
  if (file == INVALID_HANDLE_VALUE) {
    error = L"The downloaded place could not be written to the temp folder.";
    return false;
  }

  DWORD written = 0;
  const DWORD size = static_cast<DWORD>(bytes.size());
  const bool ok =
      WriteFile(file, bytes.data(), size, &written, nullptr) != 0 && written == size;
  CloseHandle(file);

  if (!ok) {
    DeleteFileW(tempPath.c_str());
    error = L"The downloaded place could not be written to the temp folder.";
    return false;
  }

  return true;
}

void RegisterJoinScheme() {
  wchar_t exe[MAX_PATH]{};
  if (GetModuleFileNameW(nullptr, exe, MAX_PATH) == 0) return;

  HKEY key = nullptr;
  if (RegCreateKeyExW(HKEY_CURRENT_USER, L"Software\\Classes\\fieldbrik", 0,
                      nullptr, 0, KEY_WRITE, nullptr, &key,
                      nullptr) != ERROR_SUCCESS) {
    return;
  }

  const wchar_t description[] = L"URL:FieldBrik launch link";
  RegSetValueExW(key, nullptr, 0, REG_SZ,
                 reinterpret_cast<const BYTE*>(description),
                 static_cast<DWORD>((std::wcslen(description) + 1) * sizeof(wchar_t)));

  const wchar_t empty[] = L"";
  RegSetValueExW(key, L"URL Protocol", 0, REG_SZ,
                 reinterpret_cast<const BYTE*>(empty), sizeof(empty));
  RegCloseKey(key);

  HKEY command = nullptr;
  if (RegCreateKeyExW(HKEY_CURRENT_USER,
                      L"Software\\Classes\\fieldbrik\\shell\\open\\command", 0,
                      nullptr, 0, KEY_WRITE, nullptr, &command,
                      nullptr) != ERROR_SUCCESS) {
    return;
  }

  const std::wstring line = L"\"" + std::wstring(exe) + L"\" \"%1\"";
  RegSetValueExW(command, nullptr, 0, REG_SZ,
                 reinterpret_cast<const BYTE*>(line.c_str()),
                 static_cast<DWORD>((line.size() + 1) * sizeof(wchar_t)));
  RegCloseKey(command);
}

}  // namespace fieldbrik
