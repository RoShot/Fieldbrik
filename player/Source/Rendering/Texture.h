// Turning PNG bytes into something the shader can sample.
//
// The client ships as one exe with no files beside it, so textures arrive as
// bytes compiled into the executable rather than as a path to open. Decoding
// them is Windows' own job: the Windows Imaging Component reads PNG, JPEG and
// the rest, which is why there is no image library here. WIC is part of the
// operating system, so this is still a client with no third-party dependencies.

#pragma once

#include <d3d11.h>

#include <cstddef>
#include <string>

namespace fieldbrik {

// Decodes a PNG held in memory and uploads it as a 32-bit RGBA texture. The
// view is written to `view` on success; on failure `error` says why, in the same
// voice as the rest of the client's messages.
bool CreateTextureFromPng(ID3D11Device* device, const void* bytes, std::size_t size,
                          ID3D11ShaderResourceView** view, std::wstring& error);

// A single white texel, bound whenever a draw is not textured. Direct3D does not
// mind a shader that samples nothing having no texture bound, but binding one
// keeps the pipeline in a known state.
bool CreateWhiteTexture(ID3D11Device* device, ID3D11ShaderResourceView** view,
                        std::wstring& error);

}  // namespace fieldbrik
