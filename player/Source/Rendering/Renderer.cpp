#include "Rendering/Renderer.h"

#include <windows.h>

#include <d3d11.h>
#include <d3dcompiler.h>
#include <dxgi1_2.h>

#include <DirectXMath.h>

#include <vector>

#include "Camera/Camera.h"
#include "World/Part.h"

using namespace DirectX;

namespace fieldbrik {
namespace {

constexpr D3D_FEATURE_LEVEL kFeatureLevels[] = {D3D_FEATURE_LEVEL_11_0,
                                                D3D_FEATURE_LEVEL_10_1,
                                                D3D_FEATURE_LEVEL_10_0};

// One directional light, fixed in the world, and no shadows. Enough to tell the
// faces of a brick apart, which is all a 2004-era client needs.
//
// The sky is a separate entry point pair in the same source: a fullscreen
// triangle that reads the view direction out of the inverse view-projection and
// picks a colour between the horizon and the zenith.
constexpr char kShaderSource[] = R"hlsl(
cbuffer FrameConstants : register(b0)
{
    row_major float4x4 viewProjection;
};

cbuffer ObjectConstants : register(b1)
{
    row_major float4x4 world;
    float4 colour;
};

cbuffer SkyConstants : register(b0)
{
    row_major float4x4 inverseViewProjection;
    float4 zenithColour;
    float4 horizonColour;
};

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
};

VertexOut VSMain(VertexIn input)
{
    VertexOut output;
    float4 worldPosition = mul(float4(input.position, 1.0f), world);
    output.position = mul(worldPosition, viewProjection);
    output.normal = normalize(mul(float4(input.normal, 0.0f), world).xyz);
    output.colour = colour * float4(input.tint, 1.0f);
    return output;
}

float4 PSMain(VertexOut input) : SV_TARGET
{
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
    // w = 0 turns the clip point into a direction: the ray this pixel looks
    // along, in world space.
    float3 direction = normalize(mul(float4(input.ndc, 1.0f, 0.0f),
                                    inverseViewProjection).xyz);

    float height = saturate(direction.y * 1.5f + 0.06f);
    float3 sky = lerp(horizonColour.rgb, zenithColour.rgb, pow(height, 0.65f));
    return float4(sky, 1.0f);
}
)hlsl";

// The era's sky: a pale blue at the horizon deepening towards the top, which is
// what the old client's sky texture did before there were clouds in it.
constexpr XMFLOAT4 kZenithColour{0.33f, 0.58f, 0.88f, 1.0f};
constexpr XMFLOAT4 kHorizonColour{0.72f, 0.87f, 0.97f, 1.0f};

struct FrameConstants {
  XMFLOAT4X4 viewProjection;
};

struct ObjectConstants {
  XMFLOAT4X4 world;
  XMFLOAT4 colour;
};

struct SkyConstants {
  XMFLOAT4X4 inverseViewProjection;
  XMFLOAT4 zenith;
  XMFLOAT4 horizon;
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

  BuildHead(vertices, indices);
  if (!head_.Create(device_.Get(), vertices, indices)) {
    lastError_ = L"The head geometry could not be uploaded.";
    return false;
  }

  if (!avatarStuds_.CreateDynamic(device_.Get(), kAvatarStudVertices,
                                  kAvatarStudIndices)) {
    lastError_ = L"The stud buffer could not be created.";
    return false;
  }

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
  if (!context_ || !targetView_ || !skyVertexShader_ || !skyPixelShader_) return;

  D3D11_MAPPED_SUBRESOURCE mapped{};
  if (FAILED(context_->Map(skyBuffer_.Get(), 0, D3D11_MAP_WRITE_DISCARD, 0,
                           &mapped))) {
    return;
  }

  auto* sky = static_cast<SkyConstants*>(mapped.pData);
  XMVECTOR determinant{};
  XMStoreFloat4x4(&sky->inverseViewProjection,
                  XMMatrixInverse(&determinant, camera.ViewProjection()));
  sky->zenith = kZenithColour;
  sky->horizon = kHorizonColour;
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

  context_->Draw(3, 0);

  // Put the depth buffer back in charge for everything drawn over the sky.
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
}

void Renderer::SetObject(const XMFLOAT4X4& world, const XMFLOAT4& colour) {
  D3D11_MAPPED_SUBRESOURCE mapped{};
  if (SUCCEEDED(context_->Map(objectBuffer_.Get(), 0, D3D11_MAP_WRITE_DISCARD, 0,
                              &mapped))) {
    auto* object = static_cast<ObjectConstants*>(mapped.pData);
    object->world = world;
    object->colour = colour;
    context_->Unmap(objectBuffer_.Get(), 0);
  }
}

void Renderer::DrawParts(const std::vector<Part>& parts, const Camera& camera) {
  if (!context_ || !targetView_ || !cube_.Valid()) return;

  BindGeometry(camera);

  for (const Part& part : parts) {
    SetObject(part.ModelMatrix(),
              XMFLOAT4(part.colour.x, part.colour.y, part.colour.z, 1.0f));

    if (part.shape == PartShape::RoundedHead && head_.Valid()) {
      head_.Draw(context_.Get());
    } else {
      cube_.Draw(context_.Get());
    }
  }
}

void Renderer::BuildWorldStuds(const std::vector<Part>& parts) {
  if (!device_) return;

  std::vector<Vertex> vertices;
  std::vector<unsigned int> indices;

  for (const Part& part : parts) AppendStuds(part, vertices, indices);

  if (vertices.empty()) {
    worldStuds_.Release();
    return;
  }

  if (!worldStuds_.Create(device_.Get(), vertices, indices)) {
    lastError_ = L"The world's studs could not be uploaded.";
  }
}

void Renderer::DrawWorldStuds(const Camera& camera) {
  if (!context_ || !targetView_ || !worldStuds_.Valid()) return;

  BindGeometry(camera);

  // The studs are already in the world, so the matrix is the identity and the
  // colour comes from the vertices.
  XMFLOAT4X4 identity{};
  XMStoreFloat4x4(&identity, XMMatrixIdentity());
  SetObject(identity, XMFLOAT4(1.0f, 1.0f, 1.0f, 1.0f));

  worldStuds_.Draw(context_.Get());
}

void Renderer::DrawStuds(const std::vector<Part>& parts, const Camera& camera) {
  if (!context_ || !targetView_ || !avatarStuds_.Valid()) return;

  std::vector<Vertex> vertices;
  std::vector<unsigned int> indices;
  for (const Part& part : parts) AppendStuds(part, vertices, indices);

  if (vertices.empty()) return;
  if (!avatarStuds_.Update(context_.Get(), vertices, indices)) return;

  BindGeometry(camera);

  XMFLOAT4X4 identity{};
  XMStoreFloat4x4(&identity, XMMatrixIdentity());
  SetObject(identity, XMFLOAT4(1.0f, 1.0f, 1.0f, 1.0f));

  avatarStuds_.Draw(context_.Get());
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
  avatarStuds_.Release();
  worldStuds_.Release();
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
