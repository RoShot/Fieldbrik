#include "Rendering/Renderer.h"

#include <windows.h>

#include <d3d11.h>
#include <d3dcompiler.h>
#include <dxgi1_2.h>

#include <DirectXMath.h>

#include <vector>

#include "Camera/Camera.h"
#include "Rendering/Texture.h"
#include "World/Part.h"

using namespace DirectX;

namespace fieldbrik {
namespace {

constexpr D3D_FEATURE_LEVEL kFeatureLevels[] = {D3D_FEATURE_LEVEL_11_0,
                                                D3D_FEATURE_LEVEL_10_1,
                                                D3D_FEATURE_LEVEL_10_0};

// How far away the sun and the moon are drawn. They have no parallax worth
// modelling, so any distance does; this one stays inside the camera's far plane.
constexpr float kSkyObjectDistance = 120.0f;

// One directional light, fixed in the world, and no shadows. Enough to tell the
// faces of a brick apart, which is all a 2004-era client needs.
//
// The sky is a separate entry point pair in the same source: a fullscreen
// triangle that leans out along the camera's own axes and samples the panorama
// along the ray.
constexpr char kShaderSource[] = R"hlsl(
cbuffer FrameConstants : register(b0)
{
    row_major float4x4 viewProjection;
};

cbuffer ObjectConstants : register(b1)
{
    row_major float4x4 world;
    float4 colour;
    float4 options;   // x: sample the texture; y: sample the surface strip
    float4 partSize;  // xyz: the part's size in studs, which decides how many studs a face shows
};

cbuffer SkyConstants : register(b0)
{
    float4 skyForward;  // xyz: the way the camera looks
    float4 skyRight;    // xyz: a lean of one screen-edge rightwards
    float4 skyUp;       // xyz: a lean of one screen-edge upwards
};

// One texture slot for the whole client: a brick's top face, the avatar's face,
// or the sky. Which image is bound is the drawing code's business, and the
// textured branch below is chosen per draw rather than per material.
//
// The sky's cube faces get their own slot, because a TextureCube is a different
// kind of object from a Texture2D and cannot share the declaration above.
Texture2D sceneTexture : register(t0);
TextureCube sceneCube : register(t1);
Texture2D sceneSurface : register(t2);
SamplerState sceneSampler : register(s0);

struct VertexIn
{
    float3 position : POSITION;
    float3 normal : NORMAL;
    float3 tint : COLOUR;
};

struct VertexOut
{
    float4 position : SV_POSITION;
    float3 normal : NORMAL;
    float4 colour : COLOUR;
    float3 local : TEXCOORD0;         // where on the part's own box this is
    float3 objectNormal : TEXCOORD1;  // which of the six faces it is
};

VertexOut VSMain(VertexIn input)
{
    VertexOut output;
    float4 worldPosition = mul(float4(input.position, 1.0f), world);
    output.position = mul(worldPosition, viewProjection);
    output.normal = normalize(mul(float4(input.normal, 0.0f), world).xyz);
    output.colour = colour * float4(input.tint, 1.0f);
    output.local = input.position;
    output.objectNormal = input.normal;
    return output;
}

float4 PSMain(VertexOut input) : SV_TARGET
{
    // A brick's face wears the era's surface strip: studs on top, inlets
    // underneath, weld on the sides. One tile is one stud, so a face of any size
    // gets a grid of them rather than one stretched picture, and a 1-stud arm
    // gets exactly one stud.
    if (options.y > 0.5f)
    {
        const float3 n = input.objectNormal;
        float2 faceUV;
        float2 faceSize;
        float block;  // 0 studs, 1 inlets, 2 weld

        if (abs(n.y) > 0.5f)
        {
            // Top and bottom: across is X, up the picture is Z.
            faceUV = float2(input.local.x + 0.5f, 0.5f - input.local.z);
            faceSize = float2(partSize.x, partSize.z);
            block = n.y > 0.0f ? 0.0f : 1.0f;
        }
        else if (abs(n.x) > 0.5f)
        {
            faceUV = float2(input.local.z + 0.5f, 0.5f - input.local.y);
            faceSize = float2(partSize.z, partSize.y);
            block = 2.0f;
        }
        else
        {
            faceUV = float2(input.local.x + 0.5f, 0.5f - input.local.y);
            faceSize = float2(partSize.x, partSize.y);
            block = 2.0f;
        }

        // The strip holds two studs across and four down, so that is how often it
        // repeats; a stud is never scaled.
        const float2 studs = faceUV * faceSize;
        const float2 tile = float2(frac(studs.x * 0.5f), frac(studs.y * 0.25f));

        const float4 surface =
            sceneSurface.Sample(sceneSampler, float2(tile.x, (block + tile.y) * 0.25f));

        const float3 lightDirection = normalize(float3(0.45f, 0.80f, 0.35f));
        const float diffuse = saturate(dot(input.normal, lightDirection));
        const float shade = 0.55f + 0.45f * diffuse;

        // The strip is grey artwork: scaling it up keeps a brick its own colour
        // with the studs readable over it. The tint is the object's own colour,
        // not the vertex's: on the arm's stud quad the vertex colour is a
        // coordinate, and multiplying by it painted a red-green gradient.
        return float4(saturate(surface.rgb * 2.0f * colour.rgb * shade), 1.0f);
    }

    // The sun, the moon and the flare: a picture added to what is already on the
    // screen rather than drawn over it, so the black around the art disappears and
    // the flare can fade out. The quad's corners give the coordinates, not the
    // colour channel, because the colour carries the fade.
    if (options.z > 0.5f)
    {
        const float2 uv = float2(input.local.x + 0.5f, 0.5f - input.local.y);
        const float4 texel = sceneTexture.Sample(sceneSampler, uv);

        // Added, not blended: the art is drawn on black, so black contributes
        // nothing and no alpha channel is needed. A JPEG's alpha cannot be relied
        // on, which is why this does not read it.
        return float4(texel.rgb * colour.rgb * colour.a, 1.0f);
    }

    // The face is line art on a transparent canvas: everything the artist did not
    // draw is thrown away rather than blended, so the head stays solid behind it
    // and there is no white card where the image ends.
    //
    // Its coordinates ride in the vertex colour rather than in a texture
    // coordinate attribute: the only textured thing in the client is one square
    // plane, and the colour channel is already carried for the studs.
    if (options.x > 0.5f)
    {
        float4 texel = sceneTexture.Sample(sceneSampler, input.colour.rg);
        clip(texel.a - 0.5f);

        // A decal is part of the brick, so it takes the same light the brick's own
        // faces do. The head's face clears options.w and stays at full
        // brightness, because line art on a head should not dim with the angle.
        if (options.w > 0.5f)
        {
            const float3 lightDirection = normalize(float3(0.45f, 0.80f, 0.35f));
            const float diffuse = saturate(dot(input.normal, lightDirection));
            texel.rgb *= 0.55f + 0.45f * diffuse;
        }

        return float4(texel.rgb, 1.0f);
    }

    float3 lightDirection = normalize(float3(0.45f, 0.80f, 0.35f));
    float diffuse = saturate(dot(input.normal, lightDirection));

    // Half lambert with a floor: no face is darker than half its colour, so a
    // brick's own colour stays readable from any side.
    float shade = 0.55f + 0.45f * diffuse;
    return float4(input.colour.rgb * shade, 1.0f);
}

struct SkyOut
{
    float4 position : SV_POSITION;
    float2 ndc : TEXCOORD0;
};

SkyOut SkyVS(uint id : SV_VertexID)
{
    float2 corner = float2(id == 1 ? 3.0f : -1.0f, id == 2 ? 3.0f : -1.0f);

    SkyOut output;
    output.position = float4(corner, 1.0f, 1.0f);
    output.ndc = corner;
    return output;
}

float4 SkyPS(SkyOut input) : SV_TARGET
{
    // The ray this pixel looks along. The camera's axes arrive already scaled by
    // the field of view, so the only work left is to lean out towards the pixel.
    float3 direction = normalize(skyForward.xyz + input.ndc.x * skyRight.xyz +
                                     input.ndc.y * skyUp.xyz);

    // The era's sky is six pictures, not a gradient. The hardware picks the face
    // and the texel from the ray, so the joins are the artist's problem and not
    // the shader's: nothing is stitched here on purpose.
    return float4(sceneCube.Sample(sceneSampler, direction).rgb, 1.0f);
}
)hlsl";

struct FrameConstants {
  XMFLOAT4X4 viewProjection;
};

struct ObjectConstants {
  XMFLOAT4X4 world;
  XMFLOAT4 colour;
  XMFLOAT4 options;   // x: textured draw, y: surface strip, z: billboard, w: lit
  XMFLOAT4 partSize;  // xyz: the part's size in studs
};

struct SkyConstants {
  XMFLOAT4 forward;
  XMFLOAT4 right;
  XMFLOAT4 up;
};

std::wstring Widen(const char* text) {
  if (!text || !*text) return std::wstring();
  const int needed = MultiByteToWideChar(CP_UTF8, 0, text, -1, nullptr, 0);
  if (needed <= 1) return std::wstring();
  std::wstring result(static_cast<size_t>(needed - 1), L'\0');
  MultiByteToWideChar(CP_UTF8, 0, text, -1, result.data(), needed);
  return result;
}

bool CompileShader(const char* entryPoint, const char* target, ID3DBlob** blob,
                   std::wstring& error) {
  Microsoft::WRL::ComPtr<ID3DBlob> errors;
  const HRESULT result =
      D3DCompile(kShaderSource, sizeof(kShaderSource) - 1, "fieldbrik.hlsl",
                 nullptr, nullptr, entryPoint, target,
                 D3DCOMPILE_OPTIMIZATION_LEVEL3, 0, blob, &errors);

  if (FAILED(result)) {
    error = errors ? Widen(static_cast<const char*>(errors->GetBufferPointer()))
                   : L"The shaders could not be compiled.";
    return false;
  }
  return true;
}

bool CreateConstantBuffer(ID3D11Device* device, size_t bytes,
                          ID3D11Buffer** buffer) {
  D3D11_BUFFER_DESC description{};
  description.Usage = D3D11_USAGE_DYNAMIC;
  description.ByteWidth = static_cast<UINT>(bytes);
  description.BindFlags = D3D11_BIND_CONSTANT_BUFFER;
  description.CPUAccessFlags = D3D11_CPU_ACCESS_WRITE;
  return SUCCEEDED(device->CreateBuffer(&description, nullptr, buffer));
}

}  // namespace

Renderer::~Renderer() { Shutdown(); }

bool Renderer::Initialise(HWND handle, int width, int height) {
  width_ = width > 0 ? width : 1;
  height_ = height > 0 ? height : 1;

  // The swap chain has to be created by a factory, and the device has to be made
  // for the same adapter, so the factory comes first.
  Microsoft::WRL::ComPtr<IDXGIFactory1> factory;
  HRESULT result = CreateDXGIFactory1(IID_PPV_ARGS(&factory));
  if (FAILED(result)) {
    lastError_ = L"DXGI could not be started.";
    return false;
  }

  Microsoft::WRL::ComPtr<IDXGIAdapter> adapter;
  if (FAILED(factory->EnumAdapters(0, &adapter))) {
    lastError_ = L"No graphics adapter was found.";
    return false;
  }

  // BGRA is not needed today; it is requested because screenshot capture and
  // Direct2D expect it later.
  const UINT flags = D3D11_CREATE_DEVICE_BGRA_SUPPORT;

  result = D3D11CreateDevice(
      adapter.Get(), D3D_DRIVER_TYPE_UNKNOWN, nullptr, flags, kFeatureLevels,
      static_cast<UINT>(sizeof(kFeatureLevels) / sizeof(kFeatureLevels[0])),
      D3D11_SDK_VERSION, &device_, nullptr, &context_);

  if (FAILED(result)) {
    lastError_ =
        L"Direct3D 11 could not be started. The graphics driver may be too old.";
    return false;
  }

  DXGI_SWAP_CHAIN_DESC description{};
  description.BufferCount = 2;
  description.BufferDesc.Width = static_cast<UINT>(width_);
  description.BufferDesc.Height = static_cast<UINT>(height_);
  description.BufferDesc.Format = DXGI_FORMAT_R8G8B8A8_UNORM;
  description.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
  description.OutputWindow = handle;
  description.SampleDesc.Count = 1;
  description.SampleDesc.Quality = 0;
  description.Windowed = TRUE;
  description.SwapEffect = DXGI_SWAP_EFFECT_FLIP_DISCARD;

  result = factory->CreateSwapChain(device_.Get(), &description, &swapChain_);
  if (FAILED(result)) {
    lastError_ = L"The swap chain could not be created for this window.";
    return false;
  }

  // Alt+Enter would hand the window to Direct3D's own fullscreen path, which
  // fights the Win32 resize handling. Fullscreen becomes a client feature.
  Microsoft::WRL::ComPtr<IDXGIFactory> dxgiFactory;
  if (SUCCEEDED(swapChain_->GetParent(IID_PPV_ARGS(&dxgiFactory)))) {
    dxgiFactory->MakeWindowAssociation(handle, DXGI_MWA_NO_ALT_ENTER);
  }

  if (!CreatePipeline()) return false;
  return CreateTargets();
}

bool Renderer::CreatePipeline() {
  Microsoft::WRL::ComPtr<ID3DBlob> vertexBlob;
  Microsoft::WRL::ComPtr<ID3DBlob> pixelBlob;

  if (!CompileShader("VSMain", "vs_4_0", &vertexBlob, lastError_)) return false;
  if (!CompileShader("PSMain", "ps_4_0", &pixelBlob, lastError_)) return false;

  if (FAILED(device_->CreateVertexShader(vertexBlob->GetBufferPointer(),
                                         vertexBlob->GetBufferSize(), nullptr,
                                         &vertexShader_))) {
    lastError_ = L"The vertex shader could not be created.";
    return false;
  }

  if (FAILED(device_->CreatePixelShader(pixelBlob->GetBufferPointer(),
                                        pixelBlob->GetBufferSize(), nullptr,
                                        &pixelShader_))) {
    lastError_ = L"The pixel shader could not be created.";
    return false;
  }

  const D3D11_INPUT_ELEMENT_DESC elements[] = {
      {"POSITION", 0, DXGI_FORMAT_R32G32B32_FLOAT, 0, 0,
       D3D11_INPUT_PER_VERTEX_DATA, 0},
      {"NORMAL", 0, DXGI_FORMAT_R32G32B32_FLOAT, 0, 12,
       D3D11_INPUT_PER_VERTEX_DATA, 0},
      {"COLOUR", 0, DXGI_FORMAT_R32G32B32_FLOAT, 0, 24,
       D3D11_INPUT_PER_VERTEX_DATA, 0},
  };

  if (FAILED(device_->CreateInputLayout(
          elements, static_cast<UINT>(sizeof(elements) / sizeof(elements[0])),
          vertexBlob->GetBufferPointer(), vertexBlob->GetBufferSize(),
          &inputLayout_))) {
    lastError_ = L"The vertex layout could not be created.";
    return false;
  }

  if (!CreateConstantBuffer(device_.Get(), sizeof(FrameConstants), &frameBuffer_) ||
      !CreateConstantBuffer(device_.Get(), sizeof(ObjectConstants),
                            &objectBuffer_) ||
      !CreateConstantBuffer(device_.Get(), sizeof(SkyConstants), &skyBuffer_)) {
    lastError_ = L"The shader constants could not be allocated.";
    return false;
  }

  // Back faces are not culled yet: a closed box hides them anyway, and winding
  // becomes worth getting right once a mesh importer has to agree with it. This
  // is listed as a known issue.
  D3D11_RASTERIZER_DESC raster{};
  raster.FillMode = D3D11_FILL_SOLID;
  raster.CullMode = D3D11_CULL_NONE;
  raster.DepthClipEnable = TRUE;
  raster.ScissorEnable = FALSE;
  raster.MultisampleEnable = FALSE;
  raster.AntialiasedLineEnable = FALSE;

  if (FAILED(device_->CreateRasterizerState(&raster, &rasterState_))) {
    lastError_ = L"The rasterizer state could not be created.";
    return false;
  }

  // The sun, the moon and the flare are added to what is already there, so the
  // black around their art contributes nothing and their edges fade rather than
  // cutting.
  D3D11_BLEND_DESC blend{};
  blend.RenderTarget[0].BlendEnable = TRUE;
  blend.RenderTarget[0].SrcBlend = D3D11_BLEND_ONE;
  blend.RenderTarget[0].DestBlend = D3D11_BLEND_ONE;
  blend.RenderTarget[0].BlendOp = D3D11_BLEND_OP_ADD;
  blend.RenderTarget[0].SrcBlendAlpha = D3D11_BLEND_ONE;
  blend.RenderTarget[0].DestBlendAlpha = D3D11_BLEND_ONE;
  blend.RenderTarget[0].BlendOpAlpha = D3D11_BLEND_OP_ADD;
  blend.RenderTarget[0].RenderTargetWriteMask = D3D11_COLOR_WRITE_ENABLE_ALL;

  if (FAILED(device_->CreateBlendState(&blend, &additiveBlend_))) {
    lastError_ = L"The sky's blend state could not be created.";
    return false;
  }

  // Point filtering and clamping: the face is 128 pixels of line art, and it is
  // meant to stay pixel-sharp at every distance rather than be smoothed.
  D3D11_SAMPLER_DESC sampler{};
  sampler.Filter = D3D11_FILTER_MIN_MAG_MIP_POINT;
  sampler.AddressU = D3D11_TEXTURE_ADDRESS_CLAMP;
  sampler.AddressV = D3D11_TEXTURE_ADDRESS_CLAMP;
  sampler.AddressW = D3D11_TEXTURE_ADDRESS_CLAMP;
  sampler.ComparisonFunc = D3D11_COMPARISON_NEVER;
  sampler.MaxLOD = D3D11_FLOAT32_MAX;

  if (FAILED(device_->CreateSamplerState(&sampler, &samplerState_))) {
    lastError_ = L"The texture sampler could not be created.";
    return false;
  }

  Microsoft::WRL::ComPtr<ID3DBlob> skyVertexBlob;
  Microsoft::WRL::ComPtr<ID3DBlob> skyPixelBlob;

  if (!CompileShader("SkyVS", "vs_4_0", &skyVertexBlob, lastError_)) return false;
  if (!CompileShader("SkyPS", "ps_4_0", &skyPixelBlob, lastError_)) return false;

  if (FAILED(device_->CreateVertexShader(skyVertexBlob->GetBufferPointer(),
                                         skyVertexBlob->GetBufferSize(), nullptr,
                                         &skyVertexShader_)) ||
      FAILED(device_->CreatePixelShader(skyPixelBlob->GetBufferPointer(),
                                        skyPixelBlob->GetBufferSize(), nullptr,
                                        &skyPixelShader_))) {
    lastError_ = L"The sky shaders could not be created.";
    return false;
  }

  // The sky does not test or write depth: it is the backdrop.
  D3D11_DEPTH_STENCIL_DESC skyDepth{};
  skyDepth.DepthEnable = FALSE;
  skyDepth.DepthWriteMask = D3D11_DEPTH_WRITE_MASK_ZERO;
  skyDepth.DepthFunc = D3D11_COMPARISON_ALWAYS;
  skyDepth.StencilEnable = FALSE;

  if (FAILED(device_->CreateDepthStencilState(&skyDepth, &skyDepthState_))) {
    lastError_ = L"The sky's depth state could not be created.";
    return false;
  }

  std::vector<Vertex> vertices;
  std::vector<unsigned int> indices;

  BuildUnitCube(vertices, indices);
  if (!cube_.Create(device_.Get(), vertices, indices)) {
    lastError_ = L"The cube geometry could not be uploaded.";
    return false;
  }

  // The other shapes the era had, and the six faces a decal can sit on. All are
  // unit-sized; the part's matrix scales them to its own size.
  BuildSphere(vertices, indices);
  if (!sphere_.Create(device_.Get(), vertices, indices)) {
    lastError_ = L"The sphere geometry could not be uploaded.";
    return false;
  }

  BuildCylinder(vertices, indices);
  if (!cylinder_.Create(device_.Get(), vertices, indices)) {
    lastError_ = L"The cylinder geometry could not be uploaded.";
    return false;
  }

  BuildWedge(vertices, indices);
  if (!wedge_.Create(device_.Get(), vertices, indices)) {
    lastError_ = L"The wedge geometry could not be uploaded.";
    return false;
  }

  for (int face = 0; face < 6; ++face) {
    BuildDecalQuad(face, vertices, indices);
    if (!decalFaces_[face].Create(device_.Get(), vertices, indices)) {
      lastError_ = L"A decal face could not be uploaded.";
      return false;
    }
  }

  // The quad the sun, the moon and the flare are drawn on: one unit across, in
  // the camera's own plane, so it always faces the viewer.
  {
    const float corners[4][2] = {
        {-0.5f, 0.5f}, {0.5f, 0.5f}, {0.5f, -0.5f}, {-0.5f, -0.5f}};

    std::vector<Vertex> quad(4);
    for (int corner = 0; corner < 4; ++corner) {
      Vertex& vertex = quad[static_cast<std::size_t>(corner)];
      vertex.position = {corners[corner][0], corners[corner][1], 0.0f};
      vertex.normal = {0.0f, 0.0f, -1.0f};
    }

    const std::vector<unsigned int> quadIndices = {0, 1, 2, 0, 2, 3};
    if (!billboard_.Create(device_.Get(), quad, quadIndices)) {
      lastError_ = L"The sky's billboards could not be uploaded.";
      return false;
    }
  }

  BuildHead(vertices, indices);
  if (!head_.Create(device_.Get(), vertices, indices)) {
    lastError_ = L"The head geometry could not be uploaded.";
    return false;
  }

  if (!CreateWhiteTexture(device_.Get(), whiteTexture_.GetAddressOf(), lastError_)) {
    return false;
  }

  // The head model and its face. Not fatal: if they cannot be read, the generated
  // rounded block is drawn instead and the client still runs.
  LoadHeadAssets();

  // The brick and sky textures. Fatal, unlike the head: an image that will not
  // decode is a broken build, and drawing nothing would hide it.
  if (!LoadTextures()) return false;

  return true;
}

// A flip-model swap chain hands out a different texture as buffer 0 after every
// Present. Rendering into a view cached at startup therefore draws into a buffer
// that is no longer the one being shown, which looks exactly like "nothing
// renders" while the clear still reaches the screen.
bool Renderer::BindBackBuffer() {
  if (!swapChain_ || !context_) return false;

  Microsoft::WRL::ComPtr<ID3D11Texture2D> backBuffer;
  if (FAILED(swapChain_->GetBuffer(0, IID_PPV_ARGS(&backBuffer)))) return false;

  Microsoft::WRL::ComPtr<ID3D11RenderTargetView> view;
  for (const BackBufferView& entry : backBufferViews_) {
    if (entry.texture.Get() == backBuffer.Get()) {
      view = entry.view;
      break;
    }
  }

  if (!view) {
    BackBufferView entry;
    entry.texture = backBuffer;
    if (FAILED(device_->CreateRenderTargetView(backBuffer.Get(), nullptr,
                                              &entry.view))) {
      return false;
    }
    view = entry.view;
    backBufferViews_.push_back(entry);
  }

  targetView_ = view;

  ID3D11RenderTargetView* targets[] = {targetView_.Get()};
  context_->OMSetRenderTargets(1, targets, depthView_.Get());
  return true;
}

bool Renderer::CreateTargets() {
  ReleaseTargets();

  D3D11_TEXTURE2D_DESC depthDescription{};
  depthDescription.Width = static_cast<UINT>(width_);
  depthDescription.Height = static_cast<UINT>(height_);
  depthDescription.MipLevels = 1;
  depthDescription.ArraySize = 1;
  depthDescription.Format = DXGI_FORMAT_D32_FLOAT;
  depthDescription.SampleDesc.Count = 1;
  depthDescription.Usage = D3D11_USAGE_DEFAULT;
  depthDescription.BindFlags = D3D11_BIND_DEPTH_STENCIL;

  HRESULT result =
      device_->CreateTexture2D(&depthDescription, nullptr, &depthTexture_);
  if (FAILED(result)) {
    lastError_ = L"The depth buffer could not be created.";
    return false;
  }

  result = device_->CreateDepthStencilView(depthTexture_.Get(), nullptr, &depthView_);
  if (FAILED(result)) {
    lastError_ = L"The depth buffer could not be bound.";
    return false;
  }

  D3D11_VIEWPORT viewport{};
  viewport.TopLeftX = 0.0f;
  viewport.TopLeftY = 0.0f;
  viewport.Width = static_cast<float>(width_);
  viewport.Height = static_cast<float>(height_);
  viewport.MinDepth = 0.0f;
  viewport.MaxDepth = 1.0f;
  context_->RSSetViewports(1, &viewport);

  return BindBackBuffer();
}

void Renderer::ReleaseTargets() {
  if (context_) context_->OMSetRenderTargets(0, nullptr, nullptr);
  depthView_.Reset();
  depthTexture_.Reset();
  targetView_.Reset();
  // The textures go away with ResizeBuffers, so their views must go too.
  backBufferViews_.clear();
}

void Renderer::Resize(int width, int height) {
  if (!swapChain_ || width <= 0 || height <= 0) return;
  if (width == width_ && height == height_) return;

  width_ = width;
  height_ = height;

  // Buffers cannot be resized while a view still points at one.
  ReleaseTargets();
  context_->Flush();

  const HRESULT result = swapChain_->ResizeBuffers(
      0, static_cast<UINT>(width_), static_cast<UINT>(height_), DXGI_FORMAT_UNKNOWN,
      0);

  if (FAILED(result)) {
    // A failed resize is not fatal: the next WM_SIZE usually succeeds, and the
    // old buffers stay valid until then.
    lastError_ = L"The window was resized but the buffers could not follow.";
    return;
  }

  CreateTargets();
}

void Renderer::BeginFrame(const float clearColour[4]) {
  if (!context_) return;

  // Follow the buffer rotation before touching anything.
  if (!BindBackBuffer()) return;

  context_->ClearRenderTargetView(targetView_.Get(), clearColour);
  if (depthView_) {
    context_->ClearDepthStencilView(depthView_.Get(), D3D11_CLEAR_DEPTH, 1.0f, 0);
  }
}

void Renderer::DrawSky(const Camera& camera) {
  // No sky means no sky pass at all: the window's clear colour is what shows.
  // Replacing the gradient outright is deliberate, so a missing sky is obvious
  // rather than quietly plausible.
  if (!context_ || !targetView_ || !skyVertexShader_ || !skyPixelShader_ ||
      !skyCube_ || !skySampler_) {
    return;
  }

  D3D11_MAPPED_SUBRESOURCE mapped{};
  if (FAILED(context_->Map(skyBuffer_.Get(), 0, D3D11_MAP_WRITE_DISCARD, 0,
                           &mapped))) {
    return;
  }

  auto* sky = static_cast<SkyConstants*>(mapped.pData);
  const Camera::SkyBasis basis = camera.SkyRayBasis();
  sky->forward = {basis.forward.x, basis.forward.y, basis.forward.z, 0.0f};
  sky->right = {basis.right.x, basis.right.y, basis.right.z, 0.0f};
  sky->up = {basis.up.x, basis.up.y, basis.up.z, 0.0f};
  context_->Unmap(skyBuffer_.Get(), 0);

  ID3D11Buffer* skyConstants[] = {skyBuffer_.Get()};
  context_->VSSetConstantBuffers(0, 1, skyConstants);
  context_->PSSetConstantBuffers(0, 1, skyConstants);

  context_->IASetInputLayout(nullptr);
  context_->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST);
  context_->VSSetShader(skyVertexShader_.Get(), nullptr, 0);
  context_->PSSetShader(skyPixelShader_.Get(), nullptr, 0);
  context_->RSSetState(rasterState_.Get());
  context_->OMSetDepthStencilState(skyDepthState_.Get(), 0);

  ID3D11SamplerState* samplers[] = {skySampler_.Get()};
  context_->PSSetSamplers(0, 1, samplers);

  // The slot the shader declares its TextureCube in; slot 0 is left empty for
  // this pass, because the sky does not sample a 2D image.
  ID3D11ShaderResourceView* cubes[] = {skyCube_.Get()};
  context_->PSSetShaderResources(1, 1, cubes);

  context_->Draw(3, 0);

  // Put the depth buffer back in charge for everything drawn over the sky.
  context_->OMSetDepthStencilState(nullptr, 0);
}

void Renderer::DrawSkyObjects(const Camera& camera) {
  if (!context_ || !targetView_ || !billboard_.Valid() || !additiveBlend_ ||
      !skySampler_) {
    return;
  }

  BindGeometry(camera);

  ID3D11SamplerState* linear[] = {skySampler_.Get()};
  context_->PSSetSamplers(0, 1, linear);

  // They are infinitely far away: nothing may cut them, and they are drawn before
  // the world so the world covers them wherever it stands in front.
  context_->OMSetDepthStencilState(skyDepthState_.Get(), 0);

  const float blendFactor[4] = {0.0f, 0.0f, 0.0f, 0.0f};
  context_->OMSetBlendState(additiveBlend_.Get(), blendFactor, 0xffffffff);

  const XMFLOAT3 eyePosition = camera.Position();
  const Camera::SkyBasis basis = camera.SkyRayBasis();

  const XMVECTOR forward = XMVector3Normalize(XMLoadFloat3(&basis.forward));
  const XMVECTOR right = XMVector3Normalize(XMLoadFloat3(&basis.right));
  const XMVECTOR up = XMVector3Normalize(XMLoadFloat3(&basis.up));
  const XMVECTOR eye = XMLoadFloat3(&eyePosition);

  const auto draw = [&](XMVECTOR direction, float size, float alpha,
                        ID3D11ShaderResourceView* texture) {
    if (!texture || alpha <= 0.0f) return;

    const XMVECTOR position = eye + direction * kSkyObjectDistance;

    // The quad's own axes are the camera's, which is what keeps it facing the
    // viewer from anywhere.
    XMMATRIX placement = XMMatrixIdentity();
    placement.r[0] = XMVectorSetW(right, 0.0f);
    placement.r[1] = XMVectorSetW(up, 0.0f);
    placement.r[2] = XMVectorSetW(XMVectorNegate(forward), 0.0f);
    placement.r[3] = XMVectorSetW(position, 1.0f);

    D3D11_MAPPED_SUBRESOURCE mapped{};
    if (FAILED(context_->Map(objectBuffer_.Get(), 0, D3D11_MAP_WRITE_DISCARD, 0,
                             &mapped))) {
      return;
    }

    auto* object = static_cast<ObjectConstants*>(mapped.pData);
    XMStoreFloat4x4(&object->world, XMMatrixScaling(size, size, 1.0f) * placement);
    object->colour = XMFLOAT4(1.0f, 1.0f, 1.0f, alpha);
    object->options = XMFLOAT4(0.0f, 0.0f, 1.0f, 0.0f);
    object->partSize = XMFLOAT4(1.0f, 1.0f, 1.0f, 0.0f);
    context_->Unmap(objectBuffer_.Get(), 0);

    ID3D11ShaderResourceView* bound[] = {texture};
    context_->PSSetShaderResources(0, 1, bound);

    billboard_.Draw(context_.Get());
  };

  // The sun sits where the era's sky is brightest: up and away from the spawn, so
  // looking up from the default view finds it. The moon is straight opposite it.
  const XMFLOAT3 sunDirection{0.18f, 0.66f, -0.73f};
  const XMVECTOR sun = XMVector3Normalize(XMLoadFloat3(&sunDirection));

  draw(sun, 22.0f, 1.0f, sunTexture_.Get());
  draw(XMVectorNegate(sun), 22.0f, 1.0f, moonTexture_.Get());

  // The flare trails the sun across the screen: its direction mirrored in the
  // camera's right and up, so it sits on the far side of the centre. It fades as
  // the sun leaves the view rather than snapping off.
  const float alongRight = XMVectorGetX(XMVector3Dot(sun, right));
  const float alongUp = XMVectorGetX(XMVector3Dot(sun, up));
  const float alongForward = XMVectorGetX(XMVector3Dot(sun, forward));

  if (alongForward > 0.0f) {
    const XMVECTOR mirrored =
        XMVector3Normalize(right * -alongRight + up * -alongUp +
                           forward * alongForward);

    float alpha = (alongForward - 0.55f) / 0.35f;
    if (alpha < 0.0f) alpha = 0.0f;
    if (alpha > 1.0f) alpha = 1.0f;

    draw(mirrored, 34.0f, alpha, flareTexture_.Get());
  }

  context_->OMSetBlendState(nullptr, blendFactor, 0xffffffff);
  context_->OMSetDepthStencilState(nullptr, 0);
}

void Renderer::BindGeometry(const Camera& camera) {
  context_->IASetInputLayout(inputLayout_.Get());
  context_->VSSetShader(vertexShader_.Get(), nullptr, 0);
  context_->PSSetShader(pixelShader_.Get(), nullptr, 0);
  context_->RSSetState(rasterState_.Get());

  // The projection is uploaded as it is stored (row-major) and the shader reads
  // it as row_major, so no transpose happens anywhere.
  D3D11_MAPPED_SUBRESOURCE mapped{};
  if (SUCCEEDED(context_->Map(frameBuffer_.Get(), 0, D3D11_MAP_WRITE_DISCARD, 0,
                              &mapped))) {
    auto* frame = static_cast<FrameConstants*>(mapped.pData);
    XMStoreFloat4x4(&frame->viewProjection, camera.ViewProjection());
    context_->Unmap(frameBuffer_.Get(), 0);
  }

  ID3D11Buffer* frameBuffers[] = {frameBuffer_.Get()};
  ID3D11Buffer* objectBuffers[] = {objectBuffer_.Get()};
  context_->VSSetConstantBuffers(0, 1, frameBuffers);
  context_->PSSetConstantBuffers(0, 1, frameBuffers);
  context_->VSSetConstantBuffers(1, 1, objectBuffers);
  context_->PSSetConstantBuffers(1, 1, objectBuffers);

  ID3D11SamplerState* samplers[] = {samplerState_.Get()};
  context_->PSSetSamplers(0, 1, samplers);

  // Untextured by default; DrawHead swaps the face in for its own draw.
  ID3D11ShaderResourceView* textures[] = {whiteTexture_.Get()};
  context_->PSSetShaderResources(0, 1, textures);
}

void Renderer::SetObject(const XMFLOAT4X4& world, const XMFLOAT4& colour,
                         bool textured, const XMFLOAT3* size, bool surfaces,
                         bool billboard, bool litTexture) {
  D3D11_MAPPED_SUBRESOURCE mapped{};
  if (SUCCEEDED(context_->Map(objectBuffer_.Get(), 0, D3D11_MAP_WRITE_DISCARD, 0,
                              &mapped))) {
    auto* object = static_cast<ObjectConstants*>(mapped.pData);
    object->world = world;
    object->colour = colour;
    object->options = XMFLOAT4(textured ? 1.0f : 0.0f, surfaces ? 1.0f : 0.0f,
                               billboard ? 1.0f : 0.0f,
                               litTexture ? 1.0f : 0.0f);
    object->partSize = size ? XMFLOAT4(size->x, size->y, size->z, 0.0f)
                            : XMFLOAT4(1.0f, 1.0f, 1.0f, 0.0f);
    context_->Unmap(objectBuffer_.Get(), 0);
  }
}

void Renderer::DrawParts(const std::vector<Part>& parts, const Camera& camera,
                         bool surfaces) {
  if (!context_ || !targetView_ || !cube_.Valid()) return;

  BindGeometry(camera);

  for (const Part& part : parts) {
    const XMFLOAT4 colour(part.colour.x, part.colour.y, part.colour.z, 1.0f);

    // The head is a model and a face rather than a scaled cube, so it has its own
    // path; everything else in the world is a scaled unit shape.
    if (part.shape == PartShape::RoundedHead) {
      DrawHead(part, colour);
      continue;
    }

    // The surface strip is a brick's own faces: it is generated for a cube and
    // reads wrong on a sphere or a wedge, so those are drawn in flat colour with
    // only the light on them.
    const bool strip = surfaces && surfacesTexture_ && surfacesSampler_ &&
                       part.shape == PartShape::Cube;

    // The strip wraps, where the face and a decal clamp, so the sampler is
    // swapped for the brick and put back before anything is drawn over it.
    if (strip) {
      ID3D11SamplerState* wrap[] = {surfacesSampler_.Get()};
      context_->PSSetSamplers(0, 1, wrap);

      ID3D11ShaderResourceView* tiles[] = {surfacesTexture_.Get()};
      context_->PSSetShaderResources(2, 1, tiles);
    }

    const Mesh* body = &cube_;
    if (part.shape == PartShape::Sphere && sphere_.Valid()) body = &sphere_;
    if (part.shape == PartShape::Cylinder && cylinder_.Valid()) body = &cylinder_;
    if (part.shape == PartShape::Wedge && wedge_.Valid()) body = &wedge_;

    SetObject(part.ModelMatrix(), colour, false, &part.size, strip);
    body->Draw(context_.Get());

    if (strip) {
      ID3D11SamplerState* clamp[] = {samplerState_.Get()};
      context_->PSSetSamplers(0, 1, clamp);
    }

    // Decals, one face at a time. The part's own TextureID is the top face, which
    // is where the era put it; a Decal child naming a face overrides that face.
    // Each texture covers its whole face once, clamped, so a decal never tiles.
    for (int face = 0; face < 6; ++face) {
      std::string id = part.faceTextures[static_cast<std::size_t>(face)];
      if (id.empty() && face == 0) id = part.textureId;
      if (id.empty()) continue;

      const ID3D11ShaderResourceView* texture = FindTexture(id);
      if (!texture) continue;

      ID3D11ShaderResourceView* painted[] = {
          const_cast<ID3D11ShaderResourceView*>(texture)};
      context_->PSSetShaderResources(0, 1, painted);

      SetObject(part.ModelMatrix(), XMFLOAT4(1.0f, 1.0f, 1.0f, 1.0f), true,
                nullptr, false, false, true);
      decalFaces_[face].Draw(context_.Get());
    }

    ID3D11ShaderResourceView* plain[] = {whiteTexture_.Get()};
    context_->PSSetShaderResources(0, 1, plain);
  }
}

void Renderer::DrawAvatarStuds(const std::vector<Part>& parts,
                               const Camera& camera) {
  if (!context_ || !targetView_ || !topFace_.Valid() || !surfacesTexture_ ||
      !surfacesSampler_) {
    return;
  }

  BindGeometry(camera);

  ID3D11SamplerState* wrap[] = {surfacesSampler_.Get()};
  context_->PSSetSamplers(0, 1, wrap);

  ID3D11ShaderResourceView* tiles[] = {surfacesTexture_.Get()};
  context_->PSSetShaderResources(2, 1, tiles);

  for (const Part& part : parts) {
    // The arms are the shoulders: one stud on each, and nothing on the torso, the
    // legs or the head.
    if (part.name.find("arm") == std::string::npos) continue;

    const XMFLOAT4 colour(part.colour.x, part.colour.y, part.colour.z, 1.0f);
    SetObject(part.ModelMatrix(), colour, false, &part.size, true);
    topFace_.Draw(context_.Get());
  }

  ID3D11SamplerState* clamp[] = {samplerState_.Get()};
  context_->PSSetSamplers(0, 1, clamp);
}

void Renderer::EndFrame() {
  if (!swapChain_) return;
  // Present with vsync: the client idles at the display rate rather than
  // spinning a core flat.
  swapChain_->Present(1, 0);
}

void Renderer::WaitForGpu() {
  if (!context_) return;
  context_->Flush();
}

void Renderer::Shutdown() {
  hudSampler_.Reset();
  hudDepth_.Reset();
  hudBlend_.Reset();
  hudBuffer_.Reset();
  hudPixelShader_.Reset();
  hudVertexShader_.Reset();
  topFace_.Release();
  for (Mesh& face : decalFaces_) face.Release();
  wedge_.Release();
  cylinder_.Release();
  sphere_.Release();
  textures_.clear();
  billboard_.Release();
  flareTexture_.Reset();
  moonTexture_.Reset();
  sunTexture_.Reset();
  additiveBlend_.Reset();
  surfacesSampler_.Reset();
  surfacesTexture_.Reset();
  skySampler_.Reset();
  skyCube_.Reset();
  faceQuad_.Release();
  headModel_.Release();
  faceTexture_.Reset();
  whiteTexture_.Reset();
  samplerState_.Reset();
  head_.Release();
  cube_.Release();
  skyDepthState_.Reset();
  skyBuffer_.Reset();
  skyPixelShader_.Reset();
  skyVertexShader_.Reset();
  rasterState_.Reset();
  objectBuffer_.Reset();
  frameBuffer_.Reset();
  inputLayout_.Reset();
  pixelShader_.Reset();
  vertexShader_.Reset();
  ReleaseTargets();
  swapChain_.Reset();
  context_.Reset();
  device_.Reset();
}

}  // namespace fieldbrik
