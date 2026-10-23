import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

/** What the hero says. The headline stays in the DOM; the particles are drawn where its letters are. */
export const particleTypeContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(4).max(40).describe("Short and bold: 2–5 words read best as particles."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
});

/** How the letters look and react. Colours are any CSS colours, CSS variables included. */
export const particleTypeConfigSchema = z.object({
	colors: z
		.array(z.string().min(1))
		.min(1)
		.max(3)
		.default(["var(--brand, oklch(0.66 0.2 262))", "oklch(0.72 0.19 330)", "oklch(0.85 0.12 95)"])
		.describe("Left and right of the headline, then the colour of fast particles."),
	background: z.string().default("var(--background, #0b0c10)").describe("The colour behind the letters."),
	scatter: z.number().min(0).max(3).default(1).describe("How hard the cursor blows particles away."),
	spring: z.number().min(0.3).max(3).default(1).describe("How quickly particles fly back to their letter."),
	gap: z.number().min(1.5).max(6).default(2.2).describe("Distance between particles, in CSS pixels."),
	size: z.number().min(0.3).max(1.2).default(0.95).describe("Particle size, as a share of the gap."),
	pointer: z.boolean().default(true).describe("The cursor scatters the letters."),
	poster: z.string().optional().describe("Image shown when WebGPU is unavailable."),
});

export type ParticleTypeContent = z.infer<typeof particleTypeContentSchema>;
export type ParticleTypeConfig = z.infer<typeof particleTypeConfigSchema>;
export type ParticleTypeConfigInput = z.input<typeof particleTypeConfigSchema>;
