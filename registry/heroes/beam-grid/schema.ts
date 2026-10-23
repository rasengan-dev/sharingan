import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

/** What the hero says. The grid and its beams are decoration. */
export const beamGridContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(70).describe("The promise in one line, 4–9 words."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
});

/** How the grid looks and how the light runs. Colours are any CSS colours, CSS variables included. */
export const beamGridConfigSchema = z.object({
	colors: z
		.array(z.string().min(1))
		.min(1)
		.max(3)
		.default(["var(--brand, oklch(0.62 0.2 262))", "oklch(0.78 0.14 200)"])
		.describe("The beams' colours; each beam takes one."),
	cell: z.number().min(24).max(160).default(64).describe("The grid's cell size, in pixels."),
	beams: z.number().int().min(0).max(16).default(6).describe("How many beams run at once."),
	speed: z.number().min(0.3).max(3).default(1).describe("How fast the beams run."),
	length: z.number().min(40).max(480).default(160).describe("A beam's length, in pixels."),
	pointer: z.boolean().default(true).describe("The grid brightens around the pointer; a click sends four beams from the nearest crossing."),
	calm: z.number().min(0).max(1).default(0.6).describe("How clear the grid stays behind the headline."),
});

export type BeamGridContent = z.input<typeof beamGridContentSchema>;
export type BeamGridConfig = z.infer<typeof beamGridConfigSchema>;
export type BeamGridConfigInput = z.input<typeof beamGridConfigSchema>;
