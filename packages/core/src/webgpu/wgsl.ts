/**
 * WGSL shared by the heroes, pasted into their shaders. Plain strings: a
 * hero's shader reads top to bottom, and nothing needs a build step.
 */

/** A triangle that covers the screen, with `uv` from 0 to 1 and y pointing down. */
export const fullscreenVertex = /* wgsl */ `
struct Varying {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vertexMain(@builtin(vertex_index) index: u32) -> Varying {
  let corner = vec2f(f32((index << 1u) & 2u), f32(index & 2u));
  var out: Varying;
  out.position = vec4f(corner * 2.0 - 1.0, 0.0, 1.0);
  out.uv = vec2f(corner.x, 1.0 - corner.y);
  return out;
}
`;

/** Linear to sRGB, a cheap hash and dithering against banding. */
export const colorFunctions = /* wgsl */ `
fn toSrgb(c: vec3f) -> vec3f {
  return select(1.055 * pow(c, vec3f(1.0 / 2.4)) - 0.055, c * 12.92, c <= vec3f(0.0031308));
}

fn hash12(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453);
}

fn dither(position: vec2f) -> f32 {
  return (hash12(position) - 0.5) / 255.0;
}

/** How much of an effect to keep at uv, given the area to keep calm (centre xy, radii zw) and its strength. */
fn calmMask(uv: vec2f, zone: vec4f, strength: f32) -> f32 {
  let d = length((uv - zone.xy) / zone.zw);
  return mix(1.0 - strength, 1.0, smoothstep(0.55, 1.25, d));
}
`;

/** Value noise and fractal noise, smooth enough for light and flow fields. */
export const noiseFunctions = /* wgsl */ `
fn hash22(p: vec2f) -> vec2f {
  let q = vec2f(dot(p, vec2f(127.1, 311.7)), dot(p, vec2f(269.5, 183.3)));
  return fract(sin(q) * 43758.5453) * 2.0 - 1.0;
}

fn gradientNoise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = dot(hash22(i), f);
  let b = dot(hash22(i + vec2f(1.0, 0.0)), f - vec2f(1.0, 0.0));
  let c = dot(hash22(i + vec2f(0.0, 1.0)), f - vec2f(0.0, 1.0));
  let d = dot(hash22(i + vec2f(1.0, 1.0)), f - vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(p: vec2f) -> f32 {
  var value = 0.0;
  var amplitude = 0.5;
  var q = p;
  for (var i = 0; i < 5; i++) {
    value += amplitude * gradientNoise(q);
    q = q * 2.03 + vec2f(1.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

/** Three octaves: about half the cost of fbm, enough for soft, blurry shapes. */
fn fbmLite(p: vec2f) -> f32 {
  return 0.5 * gradientNoise(p) + 0.25 * gradientNoise(p * 2.03 + vec2f(1.7, 9.2)) + 0.125 * gradientNoise(p * 4.1 + vec2f(5.3, 2.8));
}

/** A divergence-free flow: particles follow it without bunching up. */
fn curlNoise(p: vec2f) -> vec2f {
  let e = 0.01;
  let dx = gradientNoise(p + vec2f(e, 0.0)) - gradientNoise(p - vec2f(e, 0.0));
  let dy = gradientNoise(p + vec2f(0.0, e)) - gradientNoise(p - vec2f(0.0, e));
  return vec2f(dy, -dx) / (2.0 * e);
}
`;
