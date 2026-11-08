// Turning image bytes into something the shader can sample.
//
// The client ships as one exe with no files beside it, so textures arrive as
// bytes compiled into the executable rather than as a path to open. Decoding
// them is Windows' own job: the Windows Imaging Component reads PNG, JPEG and
// the rest, which is why there is no image library here. WIC is part of the
// operating system, so this is still a client with no third-party dependencies.
//
// The 2D entry point is named for PNG because that is what the avatar assets
// are, but the decoder underneath does not care: the sky's cube faces are JPEG
// and arrive through the same code.

#pragma once

#include <d3d11.h>

#include <cstddef>
#include <string>

namespace fieldbrik {

// Decodes an image held in memory and uploads it as a 32-bit RGBA texture. The
// view is written to `view` on success; on failure `error` says why, in the same
// voice as the rest of the client's messages.
bool CreateTextureFromPng(ID3D11Device* device, const void* bytes, std::size_t size,
                          ID3D11ShaderResourceView** view, std::wstring& error);

// Uploads pixels made in memory rather than decoded from a file: the HUD's
// labels are drawn with GDI, which produces 32-bit BGRA and no file. Top-down.
bool CreateTextureFromBgra(ID3D11Device* device, int width, int height,
                           const void* pixels, ID3D11ShaderResourceView** view,
                           std::wstring& error);

// The sky, as the era shipped it: six square pictures, one per face of a cube
// around the camera, in the order Direct3D numbers them (+X, -X, +Y, -Y, +Z,
// -Z). They have to agree on size and be square, because that is what a cube is;
// anything else is refused rather than stretched into something plausible.
bool CreateTextureCubeFromImages(ID3D11Device* device, const void* const* images,
                                 const std::size_t* sizes, int count,
                                 ID3D11ShaderResourceView** view, std::wstring& error);

// A single white texel, bound whenever a draw is not textured. Direct3D does not
// mind a shader that samples nothing having no texture bound, but binding one
// keeps the pipeline in a known state.
bool CreateWhiteTexture(ID3D11Device* device, ID3D11ShaderResourceView** view,
                        std::wstring& error);

}  // namespace fieldbrik
