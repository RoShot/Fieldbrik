cmake_minimum_required(VERSION 3.21)

# FieldBrik Studio - the place editor, a separate executable from the player.
#
# It links the player's own renderer, world reader and camera instead of growing a
# second renderer, because a brick has to look identical in the editor and in the
# game. The chrome is Win32: a menu bar, a drawn toolbar, native Explorer and
# Properties panels and a status bar, which is what 2008 Studio was made of.
#
# Unlike the player, Studio keeps some art on disk. content/icons is read at
# startup and content/textures/bricks is added to the texture table at runtime, so
# art can be dropped in without a rebuild. The whole content folder is copied next
# to the exe after every build.

project(FieldBrikStudio VERSION 0.6 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(PLAYER_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../player")
set(PLAYER_SOURCE_DIR "${PLAYER_DIR}/Source")
set(PLAYER_TEXTURE_DIR "${PLAYER_DIR}/content/textures")
set(PLAYER_ASSET_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../public/avatar/assets")

# The head is not drawn in the editor yet, but the renderer loads it with the rest
# of its assets and Studio ships the same renderer. The face and head come from
# the one copy the website's avatar renderer already uses.
file(REAL_PATH "${PLAYER_ASSET_DIR}/head.obj" HEAD_MESH_PATH)
file(REAL_PATH "${PLAYER_ASSET_DIR}/face.png" FACE_TEXTURE_PATH)

if(NOT EXISTS "${HEAD_MESH_PATH}" OR NOT EXISTS "${FACE_TEXTURE_PATH}")
  message(FATAL_ERROR
    "The head model and face image are required: expected head.obj and face.png "
    "in ${PLAYER_ASSET_DIR}")
endif()

# The sky and the surface strip are taken from the player's content so the
# viewport shows the same sky and the same studs the game does. Brick art dropped
# into Studio's own content/textures/bricks is loaded at runtime and therefore is
# not globbed here.
set(TEXTURE_RESOURCES "")
set(TEXTURE_ENTRIES "")
set(texture_id 301)

file(GLOB BRICK_TEXTURE_FILES
  "${PLAYER_TEXTURE_DIR}/bricks/*.png"
  "${PLAYER_TEXTURE_DIR}/bricks/*.jpg"
  "${PLAYER_TEXTURE_DIR}/bricks/*.jpeg")
list(SORT BRICK_TEXTURE_FILES)

# The surface strips are embedded on their own id below, not as brick textures.
list(FILTER BRICK_TEXTURE_FILES EXCLUDE REGEX "/Surfaces(Strip)?\\.png$")

foreach(texture ${BRICK_TEXTURE_FILES})
  file(REAL_PATH "${texture}" texture_path)
  get_filename_component(texture_name "${texture_path}" NAME)
  string(APPEND TEXTURE_RESOURCES "${texture_id} 10 \"${texture_path}\"\n")
  string(APPEND TEXTURE_ENTRIES "    {${texture_id}, L\"${texture_name}\"},\n")
  math(EXPR texture_id "${texture_id} + 1")
endforeach()

# The six cube faces of the era's sky, mounted in Direct3D's order: +X, -X,
# +Y, -Y, +Z, -Z. The pictures' own ring is rt -> ft -> lf -> bk, so the mount
# is rotated to keep adjacent pictures adjacent. All six or no sky, the same
# rule the player follows.
set(SKY_PRESENT 0)
set(SKY_CUBE_IDS "0,0,0,0,0,0")
set(sky_cube_complete 1)
set(sky_cube_id 151)
set(sky_cube_resources "")

foreach(side ft bk up dn rt lf)
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

# The surface strip every brick's faces wear.
set(SURFACES_PRESENT 0)
set(surfaces_file "${PLAYER_TEXTURE_DIR}/bricks/Surfaces.png")

if(EXISTS "${surfaces_file}")
  file(REAL_PATH "${surfaces_file}" surfaces_path)
  string(APPEND TEXTURE_RESOURCES "160 10 \"${surfaces_path}\"\n")
  set(SURFACES_PRESENT 1)
endif()

# The sun, the moon and the flare, all optional and all additive.
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
message(STATUS "FieldBrik Studio: ${texture_count} embedded brick texture(s), sky ${SKY_PRESENT}")

configure_file("${PLAYER_DIR}/Tools/TextureTable.h.in"
  "${CMAKE_CURRENT_BINARY_DIR}/TextureTable.generated.h" @ONLY)
configure_file("${PLAYER_DIR}/Tools/Version.h.in"
  "${CMAKE_CURRENT_BINARY_DIR}/Version.generated.h" @ONLY)
configure_file("${PLAYER_DIR}/Tools/assets.rc.in"
  "${CMAKE_CURRENT_BINARY_DIR}/assets.rc" @ONLY)

add_executable(FieldBrikStudio WIN32
  Source/main.cpp
  Source/Studio.cpp
  Source/Icons.cpp
  "${PLAYER_SOURCE_DIR}/Rendering/Renderer.cpp"
  "${PLAYER_SOURCE_DIR}/Rendering/RendererHead.cpp"
  "${PLAYER_SOURCE_DIR}/Rendering/RendererTextures.cpp"
  "${PLAYER_SOURCE_DIR}/Rendering/Mesh.cpp"
  "${PLAYER_SOURCE_DIR}/Rendering/ObjMesh.cpp"
  "${PLAYER_SOURCE_DIR}/Rendering/Texture.cpp"
  "${PLAYER_SOURCE_DIR}/Camera/Camera.cpp"
  "${PLAYER_SOURCE_DIR}/World/World.cpp"
  "${PLAYER_SOURCE_DIR}/World/PlaceFile.cpp"
  "${CMAKE_CURRENT_BINARY_DIR}/assets.rc"
)

target_include_directories(FieldBrikStudio PRIVATE
  Source
  "${PLAYER_SOURCE_DIR}"
  "${CMAKE_CURRENT_BINARY_DIR}"   # TextureTable.generated.h, Version.generated.h
)

target_compile_definitions(FieldBrikStudio PRIVATE
  UNICODE
  _UNICODE
  NOMINMAX
  WIN32_LEAN_AND_MEAN
)

# d3d11/dxgi/d3dcompiler are the shared renderer, windowscodecs is WIC decoding
# the icons and dropped brick PNGs, ole32 is the COM apartment both run in,
# comctl32 is the Explorer and Properties panels, comdlg32 is Open, msimg32 is
# AlphaBlend drawing the toolbar icons.
target_link_libraries(FieldBrikStudio PRIVATE
  d3d11 dxgi d3dcompiler windowscodecs ole32 comctl32 comdlg32 msimg32)

if(MSVC)
  target_compile_options(FieldBrikStudio PRIVATE /W4 /permissive-)

  # Static CRT, like the player: Studio is installed beside it and has to run on
  # a machine with no Visual C++ redistributable.
  set_property(TARGET FieldBrikStudio PROPERTY
    MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif()

set_target_properties(FieldBrikStudio PROPERTIES
  OUTPUT_NAME "FieldBrikStudio"
  VS_DEBUGGER_WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
)

# The icons and the drop-in texture folder live next to the exe, where Studio
# looks for them, so a build is runnable without any extra steps.
add_custom_command(TARGET FieldBrikStudio POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E copy_directory
    "${CMAKE_CURRENT_SOURCE_DIR}/content"
    "$<TARGET_FILE_DIR:FieldBrikStudio>/content"
  COMMENT "Copying Studio content beside the executable")
