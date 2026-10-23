import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

/** What the hero says. It stays in the DOM: readable, selectable, indexable. */
export const gravityFieldContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(70).describe("The promise in one line, 4–9 words."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
});

/** How the particles look and move. Colours are any CSS colours, CSS variables included. */
export const gravityFieldConfigSchema = z.object({
	colors: z
		.array(z.string().min(1))
		.min(1)
		.max(3)
		.default(["var(--brand, oklch(0.66 0.2 262))", "oklch(0.75 0.16 220)", "oklch(0.85 0.12 95)"])
		.describe("Slow, medium and fast particles, in that order."),
	background: z.string().default("var(--background, #0b0c10)").describe("The colour the particles float on."),
	gravity: z.number().min(0).max(3).default(1).describe("How strongly particles fall toward the pointer."),
	flow: z.number().min(0).max(3).default(1).describe("How much they drift along the noise currents."),
	size: z.number().min(0.5).max(4).default(1.4).describe("Particle size, in CSS pixels."),
	pointer: z.boolean().default(true).describe("Particles fall toward the cursor; otherwise toward a slow orbit."),
	calm: z.number().min(0).max(1).default(0.6).describe("How clear the area behind the headline stays."),
	detail: z.enum(["low", "medium", "high"]).default("medium").describe("Particle count: 40k, 120k or 240k."),
	poster: z.string().optional().describe("Image shown when WebGPU is unavailable."),
});

export type GravityFieldContent = z.infer<typeof gravityFieldContentSchema>;
export type GravityFieldConfig = z.infer<typeof gravityFieldConfigSchema>;
export type GravityFieldConfigInput = z.input<typeof gravityFieldConfigSchema>;
