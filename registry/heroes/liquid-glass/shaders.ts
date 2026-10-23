import tgpu from "typegpu";
import * as d from "typegpu/data";
import { wgsl } from "@/lib/sharingan";

/**
 * Liquid glass is one fragment shader. The scene under the glass is the
 * background plus the product screenshot in a rounded frame. The glass is a
 * field of metaballs: where the field passes 1 there is glass, and its
 * gradient gives the surface normal. The scene is sampled through that
 * normal (refraction), one colour channel at a time (dispersion), then lit
 * with a rim and a specular highlight.
 */

export const MAX_DROPS = 6;

export const GlassParams = d.struct({
	/** x, y, radius (in screen-height units), unused. */
	drops: d.arrayOf(d.vec4f, MAX_DROPS),
	background: d.vec4f,
	/** Glass tint rgb, and its strength. */
	tint: d.vec4f,
	rim: d.vec4f,
	/** The screenshot's frame: centre x, y and half-size x, y, in uv. */
	media: d.vec4f,
	aspect: d.f32,
	refraction: d.f32,
	count: d.u32,
	luminance: d.f32,
});

export const glassShader = tgpu.resolve({
	template: /* wgsl */ `
@group(0) @binding(0) var<uniform> params: GlassParams;
@group(0) @binding(1) var screenshot: texture_2d<f32>;
@group(0) @binding(2) var linearSampler: sampler;
${wgsl.fullscreenVertex}
${wgsl.colorFunctions}

fn roundedBox(p: vec2f, half: vec2f, radius: f32) -> f32 {
  let q = abs(p) - half + radius;
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - radius;
}

/** What is under the glass at uv: the background, and the screenshot in its frame. */
fn scene(uv: vec2f) -> vec3f {
  let aspect = vec2f(params.aspect, 1.0);
  let local = (uv - params.media.xy) * aspect;
  let half = params.media.zw * aspect;
  let distance = roundedBox(local, half, 0.02);
  let mediaUv = (uv - params.media.xy) / (2.0 * params.media.zw) + 0.5;
  let picture = textureSampleLevel(screenshot, linearSampler, clamp(mediaUv, vec2f(0.0), vec2f(1.0)), 0.0).rgb;
  // A soft shadow under the frame, darker on light pages.
  let shadow = (1.0 - smoothstep(0.0, 0.08, distance)) * mix(0.25, 0.35, params.luminance);
  let ground = params.background.rgb * (1.0 - shadow);
  return mix(ground, picture, 1.0 - smoothstep(-0.001, 0.001, distance));
}

@fragment
fn fragmentMain(input: Varying) -> @location(0) vec4f {
  let uv = input.uv;
  let aspect = vec2f(params.aspect, 1.0);

  var field = 0.0;
  var gradient = vec2f(0.0);
  for (var i = 0u; i < params.count; i++) {
    let drop = params.drops[i];
    let offset = (uv - drop.xy) * aspect;
    let q = dot(offset, offset) + 0.00001;
    let f = drop.z * drop.z / q;
    field += f;
    gradient -= 2.0 * f / q * offset;
  }

  let outside = scene(uv);
  let glass = smoothstep(0.96, 1.04, field);
  if (glass <= 0.0) {
    return vec4f(toSrgb(outside) + dither(input.position.xy), 1.0);
  }

  // Thin at the edge, thick in the middle: the edge bends light the most.
  let normal = -normalize(gradient + vec2f(0.00001));
  let depth = clamp((field - 1.0) * 0.5, 0.0, 1.0);
  let bend = normal * params.refraction * 0.05 * (1.0 - depth * 0.7) / aspect;
  let refracted = vec3f(
    scene(uv + bend * 1.06).r,
    scene(uv + bend).g,
    scene(uv + bend * 0.94).b,
  );

  let tinted = mix(refracted, refracted * params.tint.rgb * 1.6, params.tint.w);
  let rim = (1.0 - smoothstep(1.0, 1.35, field)) * 0.7;
  let specular = pow(max(dot(normal, normalize(vec2f(-0.6, -0.8))), 0.0), 6.0) * (1.0 - depth) * 0.8;
  let lit = tinted + params.rim.rgb * (rim * 0.5 + specular);
  let color = mix(outside, lit, glass);
  return vec4f(toSrgb(color) + dither(input.position.xy), 1.0);
}`,
	externals: { GlassParams },
});
