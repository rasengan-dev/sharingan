import tgpu from "typegpu";
import * as d from "typegpu/data";
import { wgsl } from "@/lib/sharingan/webgpu";

/**
 * Reaction-diffusion runs the Gray-Scott model on a grid of two chemicals:
 * A feeds in everywhere, B eats A to make more B, and B decays. Depending on
 * the feed and kill rates the result looks like coral, mazes or spots. The
 * grid lives in a pair of textures (A in red, B in green); the headline zone
 * raises the kill rate, so the pattern grows around it.
 */

export const SimParams = d.struct({
	/** Pointer x, y, seeding strength (0 when away), aspect ratio. */
	pointer: d.vec4f,
	calmZone: d.vec4f,
	feed: d.f32,
	kill: d.f32,
	calmStrength: d.f32,
	seed: d.f32,
});

export const DrawParams = d.struct({
	colors: d.arrayOf(d.vec4f, 2),
	background: d.vec4f,
	/** 1 / grid size, for the relief shading. */
	texel: d.vec2f,
	luminance: d.f32,
});

const BOUNDS = /* wgsl */ `
  let size = vec2i(textureDimensions(dst));
  let p = vec2i(id.xy);
  if (p.x >= size.x || p.y >= size.y) { return; }
  let uv = (vec2f(p) + 0.5) / vec2f(size);
`;

export const seedShader = tgpu.resolve({
	template: /* wgsl */ `
@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var dst: texture_storage_2d<rgba16float, write>;
${wgsl.colorFunctions}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  ${BOUNDS}
  // A few dozen drops of B scattered over the grid.
  let cell = floor(uv * vec2f(9.0, 6.0));
  let pick = hash12(cell + params.seed);
  let centre = (cell + 0.25 + 0.5 * vec2f(hash12(cell * 1.7 + params.seed), hash12(cell * 2.3 + params.seed))) / vec2f(9.0, 6.0);
  let offset = (uv - centre) * vec2f(params.pointer.w, 1.0);
  let b = select(0.0, 1.0, pick > 0.45 && length(offset) < 0.018);
  textureStore(dst, p, vec4f(1.0, b, 0.0, 1.0));
}`,
	externals: { SimParams },
});

export const stepShader = tgpu.resolve({
	template: /* wgsl */ `
@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var src: texture_2d<f32>;
@group(0) @binding(2) var dst: texture_storage_2d<rgba16float, write>;
${wgsl.colorFunctions}

fn readAt(p: vec2i, size: vec2i) -> vec2f {
  // Wrap around: the pattern has no edges to stop at.
  return textureLoad(src, (p + size) % size, 0).xy;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3u) {
  ${BOUNDS}
  let c = readAt(p, size);
  let laplacian =
      0.2 * (readAt(p + vec2i(1, 0), size) + readAt(p - vec2i(1, 0), size) + readAt(p + vec2i(0, 1), size) + readAt(p - vec2i(0, 1), size))
    + 0.05 * (readAt(p + vec2i(1, 1), size) + readAt(p - vec2i(1, 1), size) + readAt(p + vec2i(1, -1), size) + readAt(p + vec2i(-1, 1), size))
    - c;

  // The headline zone kills B faster, so the pattern steers around the text.
  let calm = 1.0 - calmMask(uv, params.calmZone, 1.0);
  let kill = params.kill + 0.025 * calm * params.calmStrength;
  let reaction = c.x * c.y * c.y;
  var a = c.x + (1.0 * laplacian.x - reaction + params.feed * (1.0 - c.x));
  var b = c.y + (0.5 * laplacian.y + reaction - (kill + params.feed) * c.y);

  // The pointer drops B where it passes.
  let toPointer = (uv - params.pointer.xy) * vec2f(params.pointer.w, 1.0);
  b += params.pointer.z * 0.5 * exp(-dot(toPointer, toPointer) / 0.0004);

  textureStore(dst, p, vec4f(clamp(a, 0.0, 1.0), clamp(b, 0.0, 1.0), 0.0, 1.0));
}`,
	externals: { SimParams },
});

export const drawShader = tgpu.resolve({
	template: /* wgsl */ `
@group(0) @binding(0) var<uniform> params: DrawParams;
@group(0) @binding(1) var grid: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;
${wgsl.fullscreenVertex}
${wgsl.colorFunctions}

fn b(uv: vec2f) -> f32 {
  return textureSample(grid, linearSampler, uv).y;
}

@fragment
fn fragmentMain(input: Varying) -> @location(0) vec4f {
  let uv = input.uv;
  let value = b(uv);
  let amount = smoothstep(0.12, 0.38, value);
  let core = smoothstep(0.3, 0.5, value);

  // A little relief from the gradient of B, lit from the top left.
  let slope = vec2f(b(uv + vec2f(params.texel.x, 0.0)) - b(uv - vec2f(params.texel.x, 0.0)), b(uv + vec2f(0.0, params.texel.y)) - b(uv - vec2f(0.0, params.texel.y)));
  let light = clamp(0.85 + dot(slope, vec2f(-1.0, -1.0)) * 3.0, 0.6, 1.25);

  let ink = mix(params.colors[0].rgb, params.colors[1].rgb, core) * light;
  let color = mix(params.background.rgb, ink, amount * mix(0.9, 0.75, params.luminance));
  return vec4f(toSrgb(color) + dither(input.position.xy), 1.0);
}`,
	externals: { DrawParams },
});
