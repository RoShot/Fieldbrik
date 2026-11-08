cmake_minimum_required(VERSION 3.21)

# FieldBrik Player - the standalone desktop client.
#
# One executable, no DLLs to ship: the C runtime is linked statically and there
# are no third-party dependencies at all. Win32 for the window, Direct3D 11 for
# the picture, DirectXMath (part of the Windows SDK) for the maths.
#
# Built by .github/workflows/player-build.yml on every push that touches this
# folder, and by hand with the commands in README.md.

project(FieldBrikPlayer VERSION 0.6 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(FieldBrikPlayer WIN32
  Source/Application/main.cpp
  Source/Application/App.cpp
  Source/Window/Window.cpp
  Source/Rendering/Renderer.cpp
  Source/Rendering/Mesh.cpp
  Source/Input/Input.cpp
  Source/Camera/Camera.cpp
  Source/World/World.cpp
  Source/World/PlaceFile.cpp
  Source/Characters/Avatar.cpp
  Source/Characters/Player.cpp
  Source/Physics/Physics.cpp
)

target_include_directories(FieldBrikPlayer PRIVATE Source)

target_compile_definitions(FieldBrikPlayer PRIVATE
  UNICODE
  _UNICODE
  NOMINMAX
  WIN32_LEAN_AND_MEAN
)

# d3d11 is the renderer, dxgi creates the swap chain behind it, d3dcompiler
# compiles the shader source at startup.
target_link_libraries(FieldBrikPlayer PRIVATE d3d11 dxgi d3dcompiler)

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
