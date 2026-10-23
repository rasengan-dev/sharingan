import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

/** What the hero says. The headline stays one real heading; its letters are only a presentation of it. */
export const splitHeadlineContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(60).describe("The promise in one line, 3–8 words. Shorter lines make a stronger entrance."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
});

/** How the letters arrive and answer the pointer. Colours are any CSS colours, CSS variables included. */
export const splitHeadlineConfigSchema = z.object({
	intro: z.enum(["rise", "scatter", "type"]).default("scatter").describe("How the letters arrive: from below, from all around, or one after another."),
	stagger: z.number().min(0).max(120).default(28).describe("Milliseconds between two letters during the entrance."),
	accent: z.string().default("var(--brand, oklch(0.62 0.2 262))").describe("The colour letters take under the pointer."),
	radius: z.number().min(0.5).max(6).default(1.4).describe("How far the pointer reaches, in letter heights."),
	strength: z.number().min(0).max(1.5).default(1).describe("How much a letter thickens, lifts and takes the accent."),
	pointer: z.boolean().default(true).describe("Letters near the pointer thicken and lift."),
	idle: z.boolean().default(true).describe("Now and then a wave runs through the headline when nobody points at it."),
});

export type SplitHeadlineContent = z.input<typeof splitHeadlineContentSchema>;
export type SplitHeadlineConfig = z.infer<typeof splitHeadlineConfigSchema>;
export type SplitHeadlineConfigInput = z.input<typeof splitHeadlineConfigSchema>;
