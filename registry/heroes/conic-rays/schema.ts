import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

/** What the hero says. The rays are decoration. */
export const conicRaysContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(70).describe("The promise in one line, 4–9 words."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
});

/** How the light looks and moves. Colours are any CSS colours, CSS variables included. */
export const conicRaysConfigSchema = z.object({
	colors: z
		.array(z.string().min(1))
		.min(1)
		.max(3)
		.default(["var(--brand, oklch(0.66 0.2 262))", "oklch(0.78 0.14 175)", "oklch(0.7 0.18 305)"])
		.describe("One colour per layer of rays."),
	rays: z.number().int().min(4).max(24).default(10).describe("How many rays go round the circle, per layer."),
	spread: z.number().min(0.15).max(0.85).default(0.42).describe("How wide a ray is, from a thin beam to a broad fan."),
	speed: z.number().min(0.1).max(3).default(1).describe("How fast the rays turn."),
	origin: z.enum(["top", "center", "bottom"]).default("top").describe("Where the light comes from."),
	intensity: z.number().min(0.2).max(1.5).default(0.8).describe("How strong the light is."),
	pointer: z.boolean().default(true).describe("The rays lean toward the pointer."),
	calm: z.number().min(0).max(1).default(0.45).describe("How clear the area behind the headline stays."),
});

export type ConicRaysContent = z.input<typeof conicRaysContentSchema>;
export type ConicRaysConfig = z.infer<typeof conicRaysConfigSchema>;
export type ConicRaysConfigInput = z.input<typeof conicRaysConfigSchema>;
