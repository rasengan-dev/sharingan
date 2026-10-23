import tgpu from "typegpu";
import * as d from "typegpu/data";
import { wgsl } from "@/lib/sharingan";

/**
 * Aurora mesh is one fragment shader: up to four soft bands of light, bent
 * by domain-warped noise and gathered into vertical curtains, drawn over the
 * background. On dark pages the light adds up; on light pages it tints.
 */

export const AuroraParams = d.struct({
	colors: d.arrayOf(d.vec4f, 4),
	background: d.vec4f,
	calmZone: d.vec4f,
	/** Pointer x, y, strength (0 when away) and the canvas aspect ratio. */
	pointer: d.vec4f,
	time: d.f32,
	intensity: d.f32,
	calmStrength: d.f32,
	luminance: d.f32,
	count: d.u32,
});

export const auroraShader = tgpu.resolve({
	template: /* wgsl */ `
@group(0) @binding(0) var<uniform> params: AuroraParams;
${wgsl.fullscreenVertex}
${wgsl.colorFunctions}
${wgsl.noiseFunctions}

@fragment
fn fragmentMain(input: Varying) -> @location(0) vec4f {
  let uv = input.uv;
  let aspect = params.pointer.w;
  let p = vec2f(uv.x * aspect, uv.y);
  let t = params.time;

  // Domain warp: the bands bend as if blown by a slow wind.
  let warp = vec2f(fbmLite(p * 1.2 + vec2f(t * 0.05, -t * 0.03)), fbmLite(p * 1.2 + vec2f(-t * 0.04, t * 0.06) + 4.0));
  let toPointer = vec2f((params.pointer.x - uv.x) * aspect, params.pointer.y - uv.y);
  let pull = params.pointer.z * exp(-dot(toPointer, toPointer) * 5.0);

  var light = vec3f(0.0);
  var total = 0.0;
  for (var i = 0u; i < params.count; i++) {
    let fi = f32(i);
    let centre = 0.22 + fi * 0.17
      + 0.09 * sin(p.x * (1.3 + fi * 0.35) + t * 0.18 * (1.0 + fi * 0.2) + fi * 2.1)
      + 0.14 * warp.y
      + pull * 0.18 * sign(toPointer.y);
    let width = 0.07 + 0.03 * sin(t * 0.11 + fi * 1.7);
    let offset = uv.y - centre;
    let band = exp(-(offset * offset) / (width * width));
    let texture = 0.55 + 0.45 * gradientNoise(vec2f(p.x * 2.6 + fi * 7.0, t * 0.12) + warp) * 1.6;
    // Fine vertical rays, broken up by the warp so they never read as a regular pattern.
    let curtain = 0.88 + 0.12 * sin(p.x * 70.0 + warp.x * 24.0 + fi * 3.0 + t * 0.3);
    let amount = band * texture * curtain * (1.0 + pull);
    light += params.colors[i].rgb * amount;
    total += amount;
  }

  let calm = calmMask(uv, params.calmZone, params.calmStrength);
  light *= params.intensity * calm;
  total *= params.intensity * calm;

  // Dark backgrounds: light adds up. Light backgrounds: it tints toward the band colour.
  let glow = params.background.rgb + light;
  let tint = mix(params.background.rgb, light / max(total, 0.0001), clamp(total * 0.9, 0.0, 1.0));
  let color = mix(glow, tint, params.luminance);
  return vec4f(toSrgb(color) + dither(input.position.xy), 1.0);
}`,
	externals: { AuroraParams },
});
