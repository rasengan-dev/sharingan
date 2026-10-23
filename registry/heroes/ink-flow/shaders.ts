import tgpu from "typegpu";
import * as d from "typegpu/data";

/**
 * Ink flow runs a "stable fluids" simulation (Stam 1999) on the GPU:
 * splats add force and ink, vorticity keeps the swirls alive, a pressure
 * solve keeps the flow incompressible, then velocity and ink are advected.
 *
 * The data shared by the CPU and the shaders is declared once with TypeGPU
 * schemas; `tgpu.resolve` writes the matching WGSL structs into each shader,
 * so both sides always agree on the memory layout. The passes themselves are
 * plain WGSL. Velocity is stored in grid cells per second; y points down, as
 * on screen.
 */

export const MAX_SPLATS = 8;

export const SimParams = d.struct({
	/** 1 / grid size. */
	texel: d.vec2f,
	dt: d.f32,
	velocityFade: d.f32,
	inkFade: d.f32,
	swirl: d.f32,
});

/** A push of force and ink. `color.w` is the radius, in squared screen units. */
export const Splat = d.struct({
	point: d.vec2f,
	force: d.vec2f,
	color: d.vec4f,
});

export const SplatList = d.struct({
	count: d.u32,
	/** width / height, so splats stay round. */
	aspect: d.f32,
	items: d.arrayOf(Splat, MAX_SPLATS),
});

export const RenderParams = d.struct({
	background: d.vec4f,
	/** Where the headline sits: centre x, y and radii, in screen units. */
	calmZone: d.vec4f,
	/** 0: ink everywhere · 1: no ink behind the headline. */
	calmStrength: d.f32,
	/** How quickly ink reaches full colour. */
	gain: d.f32,
});

const wgsl = (template: string, externals: Record<string, object> = {}) => tgpu.resolve({ template, externals });

const BOUNDS = /* wgsl */ `
  let size = vec2i(textureDimensions(dst));
  let p = vec2i(id.xy);
  if (p.x >= size.x || p.y >= size.y) { return; }
`;

/** Moves `source` along the velocity field. Used for velocity itself and for ink (INK = true). */
export const advectShader = wgsl(
	/* wgsl */ `
override INK: bool = false;
@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var velocity: texture_2d<f32>;
@group(0) @binding(2) var source: texture_2d<f32>;
@group(0) @binding(3) var dst: texture_storage_2d<rgba16float, write>;
@group(0) @binding(4) var linearSampler: sampler;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  ${BOUNDS}
  let uv = (vec2f(p) + 0.5) / vec2f(size);
  let v = textureSampleLevel(velocity, linearSampler, uv, 0.0).xy;
  let back = uv - v * params.dt * params.texel;
  let fade = select(params.velocityFade, params.inkFade, INK);
  textureStore(dst, p, textureSampleLevel(source, linearSampler, back, 0.0) / (1.0 + fade * params.dt));
}`,
	{ SimParams },
);

/** Adds the frame's splats: force to velocity, or colour to ink (INK = true). */
export const splatShader = wgsl(
	/* wgsl */ `
override INK: bool = false;
@group(0) @binding(0) var<uniform> splats: SplatList;
@group(0) @binding(1) var src: texture_2d<f32>;
@group(0) @binding(2) var dst: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  ${BOUNDS}
  let uv = (vec2f(p) + 0.5) / vec2f(size);
  var value = textureLoad(src, p, 0);
  for (var i = 0u; i < splats.count; i++) {
    let s = splats.items[i];
    var offset = uv - s.point;
    offset.x *= splats.aspect;
    let w = exp(-dot(offset, offset) / s.color.w);
    if (INK) {
      value = vec4f(value.rgb + s.color.rgb * w, 1.0);
    } else {
      value = vec4f(value.xy + s.force * w, 0.0, 1.0);
    }
  }
  textureStore(dst, p, value);
}`,
	{ SplatList },
);

const LOAD = /* wgsl */ `
fn readAt(t: texture_2d<f32>, p: vec2i) -> vec4f {
  return textureLoad(t, clamp(p, vec2i(0), vec2i(textureDimensions(t)) - 1), 0);
}`;

export const curlShader = wgsl(/* wgsl */ `
@group(0) @binding(0) var velocity: texture_2d<f32>;
@group(0) @binding(1) var dst: texture_storage_2d<rgba16float, write>;
${LOAD}
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  ${BOUNDS}
  let curl = (readAt(velocity, p + vec2i(1, 0)).y - readAt(velocity, p - vec2i(1, 0)).y)
           - (readAt(velocity, p + vec2i(0, 1)).x - readAt(velocity, p - vec2i(0, 1)).x);
  textureStore(dst, p, vec4f(0.5 * curl, 0.0, 0.0, 1.0));
}`);

/** Vorticity confinement: pushes the flow around its curls so small eddies survive. */
export const vorticityShader = wgsl(
	/* wgsl */ `
@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var velocity: texture_2d<f32>;
@group(0) @binding(2) var curl: texture_2d<f32>;
@group(0) @binding(3) var dst: texture_storage_2d<rgba16float, write>;
${LOAD}
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  ${BOUNDS}
  let l = readAt(curl, p - vec2i(1, 0)).x;
  let r = readAt(curl, p + vec2i(1, 0)).x;
  let t = readAt(curl, p - vec2i(0, 1)).x;
  let b = readAt(curl, p + vec2i(0, 1)).x;
  let c = readAt(curl, p).x;
  var force = 0.5 * vec2f(abs(b) - abs(t), abs(r) - abs(l));
  force = force / (length(force) + 0.0001) * params.swirl * c * vec2f(1.0, -1.0);
  let v = readAt(velocity, p).xy + force * params.dt;
  textureStore(dst, p, vec4f(v, 0.0, 1.0));
}`,
	{ SimParams },
);

/** Divergence, with walls at the edges (the flow bounces instead of leaking). */
export const divergenceShader = wgsl(/* wgsl */ `
@group(0) @binding(0) var velocity: texture_2d<f32>;
@group(0) @binding(1) var dst: texture_storage_2d<rgba16float, write>;
${LOAD}
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  ${BOUNDS}
  let c = readAt(velocity, p).xy;
  var l = readAt(velocity, p - vec2i(1, 0)).x;
  var r = readAt(velocity, p + vec2i(1, 0)).x;
  var t = readAt(velocity, p - vec2i(0, 1)).y;
  var b = readAt(velocity, p + vec2i(0, 1)).y;
  if (p.x == 0) { l = -c.x; }
  if (p.x == size.x - 1) { r = -c.x; }
  if (p.y == 0) { t = -c.y; }
  if (p.y == size.y - 1) { b = -c.y; }
  textureStore(dst, p, vec4f(0.5 * (r - l + b - t), 0.0, 0.0, 1.0));
}`);

/** Scales a field; used to let last frame's pressure fade before it seeds the solve. */
export const scaleShader = wgsl(/* wgsl */ `
override FACTOR: f32 = 0.8;
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var dst: texture_storage_2d<rgba16float, write>;
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  ${BOUNDS}
  textureStore(dst, p, textureLoad(src, p, 0) * FACTOR);
}`);

/** One Jacobi iteration of the pressure Poisson equation. */
export const pressureShader = wgsl(/* wgsl */ `
@group(0) @binding(0) var pressure: texture_2d<f32>;
@group(0) @binding(1) var divergence: texture_2d<f32>;
@group(0) @binding(2) var dst: texture_storage_2d<rgba16float, write>;
${LOAD}
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  ${BOUNDS}
  let sum = readAt(pressure, p - vec2i(1, 0)).x + readAt(pressure, p + vec2i(1, 0)).x
          + readAt(pressure, p - vec2i(0, 1)).x + readAt(pressure, p + vec2i(0, 1)).x;
  textureStore(dst, p, vec4f((sum - readAt(divergence, p).x) * 0.25, 0.0, 0.0, 1.0));
}`);

/** Removes the pressure gradient: what is left is divergence-free. */
export const gradientShader = wgsl(/* wgsl */ `
@group(0) @binding(0) var pressure: texture_2d<f32>;
@group(0) @binding(1) var velocity: texture_2d<f32>;
@group(0) @binding(2) var dst: texture_storage_2d<rgba16float, write>;
${LOAD}
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  ${BOUNDS}
  let gradient = vec2f(
    readAt(pressure, p + vec2i(1, 0)).x - readAt(pressure, p - vec2i(1, 0)).x,
    readAt(pressure, p + vec2i(0, 1)).x - readAt(pressure, p - vec2i(0, 1)).x,
  );
  textureStore(dst, p, vec4f(readAt(velocity, p).xy - gradient, 0.0, 1.0));
}`);

/** Draws the ink over the page background, quieter behind the headline. */
export const renderShader = wgsl(
	/* wgsl */ `
@group(0) @binding(0) var<uniform> params: RenderParams;
@group(0) @binding(1) var ink: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;

struct Varying {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vertexMain(@builtin(vertex_index) index: u32) -> Varying {
  // One triangle that covers the screen.
  let corner = vec2f(f32((index << 1u) & 2u), f32(index & 2u));
  var out: Varying;
  out.position = vec4f(corner * 2.0 - 1.0, 0.0, 1.0);
  out.uv = vec2f(corner.x, 1.0 - corner.y);
  return out;
}

fn toSrgb(c: vec3f) -> vec3f {
  return select(1.055 * pow(c, vec3f(1.0 / 2.4)) - 0.055, c * 12.92, c <= vec3f(0.0031308));
}

fn hash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453);
}

@fragment
fn fragmentMain(input: Varying) -> @location(0) vec4f {
  let color = textureSample(ink, linearSampler, input.uv).rgb;
  let peak = max(color.r, max(color.g, color.b));
  let hue = color / max(peak, 0.0001);
  var amount = 1.0 - exp(-peak * params.gain);
  let fromCentre = length((input.uv - params.calmZone.xy) / params.calmZone.zw);
  amount *= mix(1.0 - params.calmStrength, 1.0, smoothstep(0.55, 1.25, fromCentre));
  let linear = mix(params.background.rgb, hue, clamp(amount, 0.0, 1.0));
  // A little noise hides banding in slow gradients.
  let dither = (hash(input.position.xy) - 0.5) / 255.0;
  return vec4f(toSrgb(linear) + dither, 1.0);
}`,
	{ RenderParams },
);
