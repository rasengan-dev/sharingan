import tgpu from "typegpu";
import * as d from "typegpu/data";
import { wgsl } from "@/lib/sharingan";

/**
 * Gravity field keeps its particles in one storage buffer. A compute pass
 * pulls each one toward an attractor (the pointer, or a slow orbit), adds a
 * curl-noise drift and some drag; a render pass draws them as small squares,
 * one instance each, coloured by speed.
 */

export const Particle = d.struct({
	position: d.vec2f,
	velocity: d.vec2f,
});

export const SimParams = d.struct({
	/** Pointer x, y, how much it attracts (0 when away), aspect ratio. */
	pointer: d.vec4f,
	/** The idle attractor, when nobody points. */
	attractor: d.vec2f,
	time: d.f32,
	dt: d.f32,
	gravity: d.f32,
	flow: d.f32,
	count: d.u32,
	/** Seeds the starting positions; changes per still frame are not wanted. */
	seed: d.f32,
});

export const DrawParams = d.struct({
	colors: d.arrayOf(d.vec4f, 3),
	calmZone: d.vec4f,
	/** Particle size in clip space, x and y. */
	size: d.vec2f,
	calmStrength: d.f32,
	alpha: d.f32,
});

const simulationCommon = /* wgsl */ `
@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage, read_write> particles: array<Particle>;
${wgsl.noiseFunctions}
`;

/** Scatters the particles over the screen. */
const pcg = /* wgsl */ `
fn pcg(value: u32) -> u32 {
  let state = value * 747796405u + 2891336453u;
  let word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}`;

export const seedShader = tgpu.resolve({
	template: /* wgsl */ `
${simulationCommon}
${pcg}
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= params.count) { return; }
  // PCG hashes of the index: sin-based hashes leave a visible lattice at this many particles.
  let a = pcg(i ^ u32(params.seed * 1000.0));
  let b = pcg(a);
  let position = vec2f(f32(a), f32(b)) / 4294967295.0;
  particles[i] = Particle(position, hash22(position * 91.7) * 0.02);
}`,
	externals: { SimParams, Particle },
});

export const simulateShader = tgpu.resolve({
	template: /* wgsl */ `
${simulationCommon}
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= params.count) { return; }
  var particle = particles[i];
  let aspect = vec2f(params.pointer.w, 1.0);

  // Pull toward the attractor, softened so particles slingshot instead of collapsing.
  let goal = mix(params.attractor, params.pointer.xy, params.pointer.z);
  let toGoal = (goal - particle.position) * aspect;
  let pull = toGoal / (dot(toGoal, toGoal) + 0.01) * 0.012 * params.gravity;
  let drift = curlNoise(particle.position * aspect * 2.2 + vec2f(params.time * 0.04, 0.0)) * 0.05 * params.flow;

  var velocity = particle.velocity + (pull + drift) * params.dt;
  velocity *= exp(-0.9 * params.dt);
  let speed = length(velocity);
  if (speed > 0.6) { velocity *= 0.6 / speed; }

  particle.velocity = velocity;
  particle.position = fract(particle.position + velocity / aspect * params.dt);
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
  @location(0) color: vec4f,
}

@vertex
fn vertexMain(@builtin(vertex_index) vertex: u32, @builtin(instance_index) instance: u32) -> Dot {
  let particle = particles[instance];
  // Two triangles per particle.
  var corners = array<vec2f, 6>(vec2f(-1, -1), vec2f(1, -1), vec2f(-1, 1), vec2f(-1, 1), vec2f(1, -1), vec2f(1, 1));
  let centre = vec2f(particle.position.x * 2.0 - 1.0, 1.0 - particle.position.y * 2.0);

  let speed = clamp(length(particle.velocity) * 6.0, 0.0, 2.0);
  let color = select(mix(params.colors[1].rgb, params.colors[2].rgb, speed - 1.0), mix(params.colors[0].rgb, params.colors[1].rgb, speed), speed < 1.0);
  let alpha = params.alpha * calmMask(particle.position, params.calmZone, params.calmStrength);

  var out: Dot;
  out.position = vec4f(centre + corners[vertex] * params.size, 0.0, 1.0);
  out.color = vec4f(toSrgb(color), alpha);
  return out;
}

@fragment
fn fragmentMain(input: Dot) -> @location(0) vec4f {
  return input.color;
}`,
	externals: { DrawParams, Particle },
});
