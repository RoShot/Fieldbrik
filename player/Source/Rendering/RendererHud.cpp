// The HUD's own draw path: screen-space quads with alpha, drawn after the world.
//
// It is a second, much smaller shader rather than a branch in the brick one: the
// geometry is four vertices generated from the vertex id, so there is no buffer to
// fill, and a rectangle in pixels is the only thing the caller has to say. Text is
// an image by the time it arrives here; see Hud.cpp for how the labels are drawn.

#include "Rendering/Renderer.h"

#include <d3d11.h>
#include <d3dcompiler.h>
#include <wrl/client.h>

#include <string>
#include <vector>

#include "Rendering/Resources.h"
#include "Rendering/Texture.h"

using Microsoft::WRL::ComPtr;


namespace fieldbrik {
namespace {

constexpr char kHudShaderSource[] = R"hlsl(
cbuffer HudConstants : register(b0)
{
    float4 rect;    // x, y, width, height in pixels, top left at 0, 0
    float4 colour;
    float4 screen;  // x, y: the client size
};

Texture2D hudTexture : register(t0);
SamplerState hudSampler : register(s0);

struct HudOut
{
    float4 position : SV_POSITION;
    float2 uv : TEXCOORD0;
};

// Four vertices, no buffer: corner (0,0) is the rectangle's top left, (1,1) its
// bottom right, which is also the texture's own orientation.
HudOut HudVS(uint id : SV_VertexID)
{
    float2 corner = float2((id == 1 || id == 3) ? 1.0f : 0.0f,
                           (id == 2 || id == 3) ? 1.0f : 0.0f);

    float2 pixel = rect.xy + corner * rect.zw;
    float2 clip = float2(pixel.x / screen.x * 2.0f - 1.0f,
                         1.0f - pixel.y / screen.y * 2.0f);

    HudOut output;
    output.position = float4(clip, 0.0f, 1.0f);
    output.uv = corner;
    return output;
}

float4 HudPS(HudOut input) : SV_TARGET
{
    return hudTexture.Sample(hudSampler, input.uv) * colour;
}
)hlsl";

bool CompileHudShader(const char* entryPoint, const char* target, ID3DBlob** blob,
                      std::wstring& error) {
  ComPtr<ID3DBlob> errors;
  const HRESULT result = D3DCompile(
      kHudShaderSource, sizeof(kHudShaderSource) - 1, "hud.hlsl", nullptr, nullptr,
      entryPoint, target, D3DCOMPILE_OPTIMIZATION_LEVEL3, 0, blob, &errors);

  if (FAILED(result)) {
    if (errors) {
      error.assign(static_cast<const char*>(errors->GetBufferPointer()),
                   static_cast<const char*>(errors->GetBufferPointer()) +
                       errors->GetBufferSize());
    } else {
      error = L"The HUD shaders could not be compiled.";
    }
    return false;
  }
  return true;
}

}  // namespace

bool Renderer::CreateHudPipeline() {
  ComPtr<ID3DBlob> vertexBlob;
  ComPtr<ID3DBlob> pixelBlob;

  if (!CompileHudShader("HudVS", "vs_4_0", &vertexBlob, lastError_)) return false;
  if (!CompileHudShader("HudPS", "ps_4_0", &pixelBlob, lastError_)) return false;

  if (FAILED(device_->CreateVertexShader(vertexBlob->GetBufferPointer(),
                                         vertexBlob->GetBufferSize(), nullptr,
                                         &hudVertexShader_)) ||
      FAILED(device_->CreatePixelShader(pixelBlob->GetBufferPointer(),
                                        pixelBlob->GetBufferSize(), nullptr,
                                        &hudPixelShader_))) {
    lastError_ = L"The HUD shaders could not be created.";
    return false;
  }

  D3D11_BUFFER_DESC constants{};
  constants.Usage = D3D11_USAGE_DYNAMIC;
  constants.ByteWidth = 16 * 3;
  constants.BindFlags = D3D11_BIND_CONSTANT_BUFFER;
  constants.CPUAccessFlags = D3D11_CPU_ACCESS_WRITE;

  if (FAILED(device_->CreateBuffer(&constants, nullptr, &hudBuffer_))) {
    lastError_ = L"The HUD's constants could not be created.";
    return false;
  }

  // Ordinary source alpha over what is already there: the panels are translucent
  // and the text's edges are the alpha GDI left in the image.
  D3D11_BLEND_DESC blend{};
  blend.RenderTarget[0].BlendEnable = TRUE;
  blend.RenderTarget[0].SrcBlend = D3D11_BLEND_SRC_ALPHA;
  blend.RenderTarget[0].DestBlend = D3D11_BLEND_INV_SRC_ALPHA;
  blend.RenderTarget[0].BlendOp = D3D11_BLEND_OP_ADD;
  blend.RenderTarget[0].SrcBlendAlpha = D3D11_BLEND_ONE;
  blend.RenderTarget[0].DestBlendAlpha = D3D11_BLEND_INV_SRC_ALPHA;
  blend.RenderTarget[0].BlendOpAlpha = D3D11_BLEND_OP_ADD;
  blend.RenderTarget[0].RenderTargetWriteMask = D3D11_COLOR_WRITE_ENABLE_ALL;

  if (FAILED(device_->CreateBlendState(&blend, &hudBlend_))) {
    lastError_ = L"The HUD's blend state could not be created.";
    return false;
  }

  // The HUD is never hidden by a brick, however close the camera gets.
  D3D11_DEPTH_STENCIL_DESC depth{};
  depth.DepthEnable = FALSE;
  depth.DepthWriteMask = D3D11_DEPTH_WRITE_MASK_ZERO;
  depth.DepthFunc = D3D11_COMPARISON_ALWAYS;
  depth.StencilEnable = FALSE;

  if (FAILED(device_->CreateDepthStencilState(&depth, &hudDepth_))) {
    lastError_ = L"The HUD's depth state could not be created.";
    return false;
  }

  // Linear and clamped: the text images are drawn at their own size, and the
  // key art may be scaled a little on a large window.
  D3D11_SAMPLER_DESC sampler{};
  sampler.Filter = D3D11_FILTER_MIN_MAG_MIP_LINEAR;
  sampler.AddressU = D3D11_TEXTURE_ADDRESS_CLAMP;
  sampler.AddressV = D3D11_TEXTURE_ADDRESS_CLAMP;
  sampler.AddressW = D3D11_TEXTURE_ADDRESS_CLAMP;
  sampler.ComparisonFunc = D3D11_COMPARISON_NEVER;
  sampler.MaxLOD = D3D11_FLOAT32_MAX;

  if (FAILED(device_->CreateSamplerState(&sampler, &hudSampler_))) {
    lastError_ = L"The HUD's sampler could not be created.";
    return false;
  }

  return true;
}

bool Renderer::LoadHudTexture(int resourceId,
                              ID3D11ShaderResourceView** view) {
  if (!device_ || !view) return false;

  std::vector<unsigned char> bytes;
  std::wstring error;
  if (!ReadEmbedded(resourceId, bytes, error)) {
    lastError_ = error;
    return false;
  }

  if (!CreateTextureFromPng(device_.Get(), bytes.data(), bytes.size(), view,
                            error)) {
    lastError_ = error;
    return false;
  }
  return true;
}

bool Renderer::CreateHudTextureFromBgra(int width, int height,
                                        const void* pixels,
                                        ID3D11ShaderResourceView** view) {
  if (!device_) return false;
  std::wstring error;
  if (!CreateTextureFromBgra(device_.Get(), width, height, pixels, view, error)) {
    lastError_ = error;
    return false;
  }
  return true;
}

void Renderer::DrawHud(const std::vector<HudSprite>& sprites) {
  if (!context_ || sprites.empty()) return;

  if (!context_ || sprites.empty()) return;

  if (!hudVertexShader_ && !CreateHudPipeline()) {
    return;
  }

  context_->IASetInputLayout(nullptr);
  context_->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLESTRIP);
  context_->VSSetShader(hudVertexShader_.Get(), nullptr, 0);
  context_->PSSetShader(hudPixelShader_.Get(), nullptr, 0);
  context_->RSSetState(rasterState_.Get());
  context_->OMSetDepthStencilState(hudDepth_.Get(), 0);

  const float blendFactor[4] = {0.0f, 0.0f, 0.0f, 0.0f};
  context_->OMSetBlendState(hudBlend_.Get(), blendFactor, 0xffffffff);

  ID3D11SamplerState* samplers[] = {hudSampler_.Get()};
  context_->PSSetSamplers(0, 1, samplers);

  ID3D11Buffer* constants[] = {hudBuffer_.Get()};
  context_->VSSetConstantBuffers(0, 1, constants);
  context_->PSSetConstantBuffers(0, 1, constants);

  for (const HudSprite& sprite : sprites) {
    D3D11_MAPPED_SUBRESOURCE mapped{};
    if (FAILED(context_->Map(hudBuffer_.Get(), 0, D3D11_MAP_WRITE_DISCARD, 0,
                             &mapped))) {
      break;
    }

    auto* data = static_cast<float*>(mapped.pData);
    data[0] = sprite.x;
    data[1] = sprite.y;
    data[2] = sprite.width;
    data[3] = sprite.height;

    data[4] = sprite.colour.x;
    data[5] = sprite.colour.y;
    data[6] = sprite.colour.z;
    data[7] = sprite.colour.w;

    data[8] = static_cast<float>(width_);
    data[9] = static_cast<float>(height_);
    data[10] = 0.0f;
    data[11] = 0.0f;

    context_->Unmap(hudBuffer_.Get(), 0);

    ID3D11ShaderResourceView* texture =
        sprite.texture ? sprite.texture : whiteTexture_.Get();
    context_->PSSetShaderResources(0, 1, &texture);
    context_->Draw(4, 0);
  }

  // The next pass is three-dimensional again, so the HUD's states come off.
  context_->OMSetBlendState(nullptr, nullptr, 0xffffffff);
  context_->OMSetDepthStencilState(nullptr, 0);

  ID3D11ShaderResourceView* none = nullptr;
  context_->PSSetShaderResources(0, 1, &none);

  context_->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST);
}

}  // namespace fieldbrik
