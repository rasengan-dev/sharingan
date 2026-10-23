import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

/** What the hero says. It stays in the DOM: readable, selectable, indexable. */
export const reactionDiffusionContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(70).describe("The promise in one line, 4–9 words."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
});

/** How the pattern looks and grows. Colours are any CSS colours, CSS variables included. */
export const reactionDiffusionConfigSchema = z.object({
	colors: z
		.array(z.string().min(1))
		.min(1)
		.max(2)
		.default(["var(--brand, oklch(0.66 0.2 262))", "oklch(0.8 0.15 160)"])
		.describe("The pattern's colour, from its edges to its core."),
	background: z.string().default("var(--background, #0b0c10)").describe("The colour the pattern grows on."),
	pattern: z.enum(["coral", "maze", "spots"]).default("coral").describe("Which family of shapes grows."),
	speed: z.number().int().min(2).max(24).default(10).describe("Simulation steps per frame."),
	pointer: z.boolean().default(true).describe("The cursor seeds new growth where it passes."),
	calm: z.number().min(0).max(1).default(0.8).describe("How strongly the pattern avoids the headline."),
	detail: z.enum(["low", "medium", "high"]).default("medium").describe("Grid resolution: lower is lighter on the GPU."),
	poster: z.string().optional().describe("Image shown when WebGPU is unavailable."),
});

export type ReactionDiffusionContent = z.infer<typeof reactionDiffusionContentSchema>;
export type ReactionDiffusionConfig = z.infer<typeof reactionDiffusionConfigSchema>;
export type ReactionDiffusionConfigInput = z.input<typeof reactionDiffusionConfigSchema>;
