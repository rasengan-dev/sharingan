import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

/** What the hero says. It stays in the DOM: readable, selectable, indexable. */
export const inkFlowContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(70).describe("The promise in one line, 4–9 words."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
});

/** How the ink looks and moves. Colours are any CSS colours, CSS variables included. */
export const inkFlowConfigSchema = z.object({
	colors: z
		.array(z.string().min(1))
		.min(1)
		.max(4)
		.default(["var(--brand, oklch(0.66 0.2 262))", "oklch(0.72 0.19 330)", "oklch(0.8 0.15 200)"])
		.describe("Ink colours, cycled by the cursor and the ambient currents."),
	background: z.string().default("var(--background, #0b0c10)").describe("The colour the ink is drawn on."),
	swirl: z.number().min(0).max(60).default(24).describe("How strongly eddies are kept alive."),
	inkFade: z.number().min(0.05).max(4).default(0.7).describe("How fast ink fades, per second."),
	flowFade: z.number().min(0).max(4).default(0.25).describe("How fast the flow calms down, per second."),
	ambient: z.boolean().default(true).describe("Slow currents that keep the ink moving when nobody touches it."),
	pointer: z.boolean().default(true).describe("The cursor stirs the ink."),
	calm: z.number().min(0).max(1).default(0.7).describe("How clear the area behind the headline stays."),
	detail: z.enum(["low", "medium", "high"]).default("medium").describe("Simulation resolution: lower is lighter on the GPU."),
	poster: z.string().optional().describe("Image shown when WebGPU is unavailable."),
});

export type InkFlowContent = z.infer<typeof inkFlowContentSchema>;
export type InkFlowConfig = z.infer<typeof inkFlowConfigSchema>;
export type InkFlowConfigInput = z.input<typeof inkFlowConfigSchema>;
