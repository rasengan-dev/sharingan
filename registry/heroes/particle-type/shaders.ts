import tgpu from "typegpu";
import * as d from "typegpu/data";
import { wgsl } from "@/lib/sharingan";

/**
 * Particle type gives every particle a home: a point inside a letter of the
 * headline, sampled on the CPU from the real DOM text. A compute pass pulls
 * each particle home with a spring, pushes it away from the pointer, and
 * adds a faint shimmer; a render pass draws one small square per particle.
 *
 * Particle is 32 bytes (three vec2f and an f32, padded to the vec2f
 * alignment); the engine writes the homes with that same stride.
 */

export const Particle = d.struct({
	position: d.vec2f,
	velocity: d.vec2f,
	home: d.vec2f,
	phase: d.f32,
});

export const SimParams = d.struct({
	/** Pointer x, y, strength (0 when away), aspect ratio. */
	pointer: d.vec4f,
	time: d.f32,
	dt: d.f32,
	scatter: d.f32,
	spring: d.f32,
	count: d.u32,
});

export const DrawParams = d.struct({
	colors: d.arrayOf(d.vec4f, 3),
	/** Particle half-size in clip space. */
	size: d.vec2f,
});

export const simulateShader = tgpu.resolve({
	template: /* wgsl */ `
@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read_write> particles: array<Particle>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= params.count) { return; }
  var particle = particles[i];
  let aspect = vec2f(params.pointer.w, 1.0);

  var force = (particle.home - particle.position) * 60.0 * params.spring;

  // The pointer blows particles outward, strongest at its centre.
  let away = (particle.position - params.pointer.xy) * aspect;
  let distance2 = dot(away, away);
  force += normalize(away + vec2f(0.00001)) / aspect * params.pointer.z * params.scatter * exp(-distance2 / 0.003) * 9.0;

  // A faint shimmer, so the letters breathe when nothing happens.
  force += vec2f(sin(params.time * 1.7 + particle.phase * 6.2831), cos(params.time * 1.3 + particle.phase * 6.2831)) * 0.004;

  var velocity = (particle.velocity + force * params.dt) * exp(-11.0 * sqrt(params.spring) * params.dt);
  particle.velocity = velocity;
  particle.position += velocity * params.dt;
  particles[i] = particle;
}`,
	externals: { SimParams, Particle },
});

export const drawShader = tgpu.resolve({
	template: /* wgsl */ `
@group(0) @binding(0) var<uniform> params: DrawParams;
@group(0) @binding(1) var<storage, read> particles: array<Particle>;
${wgsl.colorFunctions}

struct Dot {
  @builtin(position) position: vec4f,
  @location(0) color: vec3f,
}

@vertex
fn vertexMain(@builtin(vertex_index) vertex: u32, @builtin(instance_index) instance: u32) -> Dot {
  let particle = particles[instance];
  var corners = array<vec2f, 6>(vec2f(-1, -1), vec2f(1, -1), vec2f(-1, 1), vec2f(-1, 1), vec2f(1, -1), vec2f(1, 1));
  let centre = vec2f(particle.position.x * 2.0 - 1.0, 1.0 - particle.position.y * 2.0);

  // Colour runs across the headline; particles in flight glow toward the third colour.
  let across = mix(params.colors[0].rgb, params.colors[1].rgb, clamp(particle.home.x * 1.6 - 0.3, 0.0, 1.0));
  let flight = clamp(length(particle.velocity) * 3.0, 0.0, 1.0);

  var out: Dot;
  out.position = vec4f(centre + corners[vertex] * params.size, 0.0, 1.0);
  out.color = toSrgb(mix(across, params.colors[2].rgb, flight));
  return out;
}

@fragment
fn fragmentMain(input: Dot) -> @location(0) vec4f {
  return vec4f(input.color, 1.0);
}`,
	externals: { DrawParams, Particle },
});
