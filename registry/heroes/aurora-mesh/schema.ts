import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

/** What the hero says. It stays in the DOM: readable, selectable, indexable. */
export const auroraMeshContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(70).describe("The promise in one line, 4–9 words."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
});

/** How the light looks and moves. Colours are any CSS colours, CSS variables included. */
export const auroraMeshConfigSchema = z.object({
	colors: z
		.array(z.string().min(1))
		.min(1)
		.max(4)
		.default(["var(--brand, oklch(0.66 0.2 262))", "oklch(0.78 0.14 175)", "oklch(0.62 0.2 305)"])
		.describe("One colour per band of light, from top to bottom."),
	background: z.string().default("var(--background, #0b0c10)").describe("The sky behind the light."),
	speed: z.number().min(0.1).max(3).default(1).describe("How fast the bands drift."),
	intensity: z.number().min(0.2).max(2).default(0.75).describe("How bright the bands are."),
	pointer: z.boolean().default(true).describe("The cursor bends the light toward it."),
	calm: z.number().min(0).max(1).default(0.55).describe("How clear the area behind the headline stays."),
	poster: z.string().optional().describe("Image shown when WebGPU is unavailable."),
});

export type AuroraMeshContent = z.infer<typeof auroraMeshContentSchema>;
export type AuroraMeshConfig = z.infer<typeof auroraMeshConfigSchema>;
export type AuroraMeshConfigInput = z.input<typeof auroraMeshConfigSchema>;
