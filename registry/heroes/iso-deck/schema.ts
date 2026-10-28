import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

/** What the hero says. The deck is decoration, but for its front key, which is a real link. */
export const isoDeckContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short line above the headline."),
	headline: z.string().min(8).max(60).describe("The promise in two short lines, 3–8 words."),
	subheadline: z.string().max(160).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
	keyCta: z
		.object({ label: z.string().min(2).max(14).describe("Printed on the deck's big front key: 1–2 short words."), href: z.string().min(1) })
		.optional()
		.describe("The deck's front key, a link of its own (for example to a demo or the docs)."),
	tagline: z.string().max(60).optional().describe("Typed in the tooltip beside the floating tile: one short sentence."),
	connectedLabel: z.string().max(32).optional().describe("Shown in the tooltip once the visitor spells the deck's word."),
});

/** How the deck is laid out and coloured. Colours are any CSS colours, CSS variables included. */
export const isoDeckConfigSchema = z.object({
	keys: z
		.string()
		.regex(/^[A-Za-z0-9]{3,6}$/)
		.default("START")
		.describe("The word on the keys, 3–6 letters or digits. Typing it on the page (or pressing the keys in order) connects the deck."),
	wideKey: z.string().max(10).default("Connect").describe("The label of the wide key under the letters; empty for none."),
	rows: z.number().int().min(1).max(2).default(2).describe("One row of keys, or two (with the wide key)."),
	knob: z.boolean().default(true).describe("A knob beside the keys; its dial follows the meter."),
	screen: z.boolean().default(true).describe("A screen with a level meter that jumps with each key."),
	cable: z.enum(["right", "left", "none"]).default("right").describe("Where the coiled cable leaves the deck."),
	accent: z.string().min(1).default("var(--brand, oklch(0.84 0.17 145))").describe("The brand colour: the front key, the meter's top and the connected state."),
	accentAlt: z
		.string()
		.min(1)
		.optional()
		.describe("The second tone (the floating tile, the meter's low end). By default it is derived from the accent."),
	loop: z.boolean().default(true).describe("While nobody plays with it, the deck tells its story: select, explain, spell."),
	keyboard: z.boolean().default(true).describe("Typing the word on the page presses the keys, while the hero is on screen."),
});

export type IsoDeckContent = z.input<typeof isoDeckContentSchema>;
export type IsoDeckConfig = z.infer<typeof isoDeckConfigSchema>;
export type IsoDeckConfigInput = z.input<typeof isoDeckConfigSchema>;
