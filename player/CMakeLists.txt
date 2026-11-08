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

# The surface strips are not brick textures: they are what a brick's faces wear,
# so they are embedded on their own id rather than swept up by the glob above.
list(FILTER BRICK_TEXTURE_FILES EXCLUDE REGEX "/Surfaces(Strip)?\\.png$")

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

# The sky, the way the era shipped it: six square pictures, one per face of a
# cube round the camera, named *_rt, *_lf, *_up, *_dn, *_ft and *_bk. All six are
# needed or there is no sky at all: half a sky is worse than a clear colour,
# because it is the kind of thing that hides.
set(SKY_PRESENT 0)
set(SKY_CUBE_IDS "0,0,0,0,0,0")
set(sky_cube_complete 1)
set(sky_cube_id 151)
set(sky_cube_resources "")

# In the order Direct3D numbers a cube's faces: +X, -X, +Y, -Y, +Z, -Z, which is
# the order the generated table and the shader agree on.
foreach(side rt lf up dn ft bk)
  file(GLOB sky_side_files
    "${PLAYER_TEXTURE_DIR}/sky/*_${side}.png"
    "${PLAYER_TEXTURE_DIR}/sky/*_${side}.jpg")

  if(sky_side_files)
    list(GET sky_side_files 0 sky_side)
    file(REAL_PATH "${sky_side}" sky_side_path)
    string(APPEND sky_cube_resources "${sky_cube_id} 10 \"${sky_side_path}\"\n")
    math(EXPR sky_cube_id "${sky_cube_id} + 1")
  else()
    set(sky_cube_complete 0)
  endif()
endforeach()

if(sky_cube_complete)
  set(SKY_PRESENT 1)
  set(SKY_CUBE_IDS "151,152,153,154,155,156")
  string(APPEND TEXTURE_RESOURCES "${sky_cube_resources}")
endif()

# The surface strip: studs, inlets, weld and glue, which every brick's faces wear.
set(SURFACES_PRESENT 0)
set(surfaces_file "${PLAYER_TEXTURE_DIR}/bricks/Surfaces.png")

if(EXISTS "${surfaces_file}")
  file(REAL_PATH "${surfaces_file}" surfaces_path)
  string(APPEND TEXTURE_RESOURCES "160 10 \"${surfaces_path}\"\n")
  set(SURFACES_PRESENT 1)
endif()

# The things that hang in the sky, all drawn additively over it: the sun, the moon
# opposite it, and the flare that follows the sun across the screen.
set(SUN_PRESENT 0)
set(MOON_PRESENT 0)
set(FLARE_PRESENT 0)

foreach(pair "SUN;sun.jpg;170" "MOON;moon.jpg;171" "FLARE;lensflare.jpg;172")
  list(GET pair 0 sky_role)
  list(GET pair 1 sky_file)
  list(GET pair 2 sky_id)

  if(EXISTS "${PLAYER_TEXTURE_DIR}/sky/${sky_file}")
    file(REAL_PATH "${PLAYER_TEXTURE_DIR}/sky/${sky_file}" sky_object_path)
    string(APPEND TEXTURE_RESOURCES "${sky_id} 10 \"${sky_object_path}\"\n")
    set(${sky_role}_PRESENT 1)
  endif()
endforeach()

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
