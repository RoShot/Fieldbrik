cmake_minimum_required(VERSION 3.21)

# FieldBrik Player - the standalone desktop client.
#
# One executable, no DLLs to ship: the C runtime is linked statically and there
# are no third-party dependencies at all. Win32 for the window, Direct3D 11 for
# the picture, DirectXMath (part of the Windows SDK) for the maths, and the
# Windows Imaging Component - part of the operating system - to decode the face.
#
# Built by .github/workflows/player-build.yml on every push that touches this
# folder, and by hand with the commands in README.md.

project(FieldBrikPlayer VERSION 0.9 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# The head model and the face image are the ones the website's avatar renderer
# already uses, kept in one place in the repository. They are compiled into the
# exe as Windows resources rather than installed beside it, which is what keeps
# the client a single file to download.
set(PLAYER_ASSET_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../public/avatar/assets")

file(REAL_PATH "${PLAYER_ASSET_DIR}/head.obj" HEAD_MESH_PATH)
file(REAL_PATH "${PLAYER_ASSET_DIR}/face.png" FACE_TEXTURE_PATH)

if(NOT EXISTS "${HEAD_MESH_PATH}" OR NOT EXISTS "${FACE_TEXTURE_PATH}")
  message(FATAL_ERROR
    "The head model and face image are required: expected head.obj and face.png "
    "in ${PLAYER_ASSET_DIR}")
endif()

# The textures live in content/textures and are compiled in the same way. Nothing
# here is required: a half-finished drop still builds, and the client stops with a
# message if a place asks for an image that is not present, rather than drawing
# the wrong colour. Adding a file renumbers the textures after it, which is why
# only the generated table knows the ids.
set(PLAYER_TEXTURE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/content/textures")

file(GLOB BRICK_TEXTURE_FILES
  "${PLAYER_TEXTURE_DIR}/bricks/*.png"
  "${PLAYER_TEXTURE_DIR}/bricks/*.jpg"
  "${PLAYER_TEXTURE_DIR}/bricks/*.jpeg")
list(SORT BRICK_TEXTURE_FILES)

set(TEXTURE_RESOURCES "")
set(TEXTURE_ENTRIES "")
set(texture_id 201)

foreach(texture ${BRICK_TEXTURE_FILES})
  file(REAL_PATH "${texture}" texture_path)
  get_filename_component(texture_name "${texture_path}" NAME)
  string(APPEND TEXTURE_RESOURCES "${texture_id} 10 \"${texture_path}\"\n")
  string(APPEND TEXTURE_ENTRIES "    {${texture_id}, L\"${texture_name}\"},\n")
  math(EXPR texture_id "${texture_id} + 1")
endforeach()

file(GLOB SKY_TEXTURE_FILES
  "${PLAYER_TEXTURE_DIR}/sky/panorama.png"
  "${PLAYER_TEXTURE_DIR}/sky/panorama.jpg")

if(SKY_TEXTURE_FILES)
  list(GET SKY_TEXTURE_FILES 0 sky_texture)
  file(REAL_PATH "${sky_texture}" sky_texture_path)
  string(APPEND TEXTURE_RESOURCES "150 10 \"${sky_texture_path}\"\n")
  set(SKY_PRESENT 1)
else()
  set(SKY_PRESENT 0)
endif()

list(LENGTH BRICK_TEXTURE_FILES texture_count)
message(STATUS
  "FieldBrik Player: ${texture_count} brick texture(s), sky ${SKY_PRESENT}")

configure_file(Tools/TextureTable.h.in
  "${CMAKE_CURRENT_BINARY_DIR}/TextureTable.generated.h" @ONLY)

# The title bar says which version this is, and the number comes from the
# project() line above, so the exe and the release tag cannot drift apart.
configure_file(Tools/Version.h.in
  "${CMAKE_CURRENT_BINARY_DIR}/Version.generated.h" @ONLY)
configure_file(Tools/assets.rc.in "${CMAKE_CURRENT_BINARY_DIR}/assets.rc" @ONLY)

add_executable(FieldBrikPlayer WIN32
  Source/Application/main.cpp
  Source/Application/App.cpp
  Source/Window/Window.cpp
  Source/Rendering/Renderer.cpp
  Source/Rendering/RendererHead.cpp
  Source/Rendering/RendererTextures.cpp
  Source/Rendering/Mesh.cpp
  Source/Rendering/ObjMesh.cpp
  Source/Rendering/Texture.cpp
  Source/Input/Input.cpp
  Source/Camera/Camera.cpp
  Source/World/World.cpp
  Source/World/PlaceFile.cpp
  Source/Characters/Avatar.cpp
  Source/Characters/Player.cpp
  Source/Physics/Physics.cpp
  "${CMAKE_CURRENT_BINARY_DIR}/assets.rc"
)

target_include_directories(FieldBrikPlayer PRIVATE
  Source
  "${CMAKE_CURRENT_BINARY_DIR}"   # TextureTable.generated.h
)

target_compile_definitions(FieldBrikPlayer PRIVATE
  UNICODE
  _UNICODE
  NOMINMAX
  WIN32_LEAN_AND_MEAN
)

# d3d11 is the renderer, dxgi creates the swap chain behind it, d3dcompiler
# compiles the shader source at startup, windowscodecs is WIC decoding the face,
# ole32 is the COM apartment WIC runs in.
target_link_libraries(FieldBrikPlayer PRIVATE d3d11 dxgi d3dcompiler windowscodecs ole32)

if(MSVC)
  target_compile_options(FieldBrikPlayer PRIVATE /W4 /permissive-)

  # Static CRT. Without this the exe needs the Visual C++ redistributable
  # installed, which defeats "download one file and double-click it".
  set_property(TARGET FieldBrikPlayer PROPERTY
    MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif()

set_target_properties(FieldBrikPlayer PROPERTIES
  OUTPUT_NAME "FieldBrikPlayer"
  VS_DEBUGGER_WORKING_DIRECTORY "${CMAKE_SOURCE_DIR}"
)
