import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

/** What the hero says. Every word in the rows is real text, read once as a list. */
export const marqueeTypeContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(70).describe("The promise in one line, 4–9 words."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
	rows: z
		.array(z.array(z.string().min(1).max(28)).min(3).max(10))
		.min(2)
		.max(4)
		.describe("Two to four rows of short words: services, places, values. Each row slides on its own."),
	rowsLabel: z.string().max(40).optional().describe("What the rows list, for assistive technology, e.g. “What we do”."),
});

/** How the rows look and move. Colours are any CSS colours, CSS variables included. */
export const marqueeTypeConfigSchema = z.object({
	speed: z.number().min(0.1).max(4).default(1).describe("How fast the rows slide."),
	direction: z.enum(["alternate", "left", "right"]).default("alternate").describe("Which way the rows slide; `alternate` flips every other row."),
	// Not `style`: as an attribute it would clash with the element's own style.
	look: z.enum(["mixed", "solid", "outline"]).default("mixed").describe("Filled letters, outlined letters, or one of each in turn."),
	tilt: z.number().min(-8).max(8).default(-3).describe("The band's angle, in degrees."),
	accent: z.string().default("var(--brand, oklch(0.62 0.2 262))").describe("The colour of the separators and of a word under the pointer."),
	separator: z.string().max(3).default("✦").describe("Between two words."),
	pointer: z.boolean().default(true).describe("A row slows down under the pointer, and stops while pressed."),
	scroll: z.boolean().default(true).describe("Scrolling the page pushes the rows faster for a moment."),
});

export type MarqueeTypeContent = z.input<typeof marqueeTypeContentSchema>;
export type MarqueeTypeConfig = z.infer<typeof marqueeTypeConfigSchema>;
export type MarqueeTypeConfigInput = z.input<typeof marqueeTypeConfigSchema>;
