import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

const card = z.object({
	src: z.string().min(1).describe("The image, portrait (4:5 works best)."),
	alt: z.string().min(4).max(160).describe("What the image shows, for screen readers."),
	title: z.string().min(1).max(40),
	meta: z.string().max(40).optional().describe("A second line under the title: the artist, a price."),
	href: z.string().optional().describe("Where the card leads."),
});

const tab = z.object({
	label: z.string().min(1).max(20),
	cards: z.array(z.number().int().min(0)).optional().describe("The cards (by index) this tab shows; every card when left out."),
});

/** What the section says, and the cards that travel through it. All of it is real text and images in the DOM. */
export const cardJourneyContentSchema = z.object({
	statement: z.string().min(20).max(240).describe("The paragraph that darkens as it is read, 20–40 words."),
	aside: z
		.object({ title: z.string().min(2).max(40), text: z.string().max(140).optional() })
		.optional()
		.describe("A note that sits beside the staircase of cards."),
	eyebrow: z.string().max(48).optional().describe("A short kicker above the grid's headline."),
	headline: z.string().min(8).max(60).describe("The grid's headline, 4–9 words."),
	text: z.string().max(220).optional().describe("One or two sentences under the headline."),
	cta: cta.optional(),
	tabs: z.array(tab).min(2).max(4).optional().describe("Tabs over the grid, each showing some of the cards."),
	cards: z.array(card).min(3).max(9).describe("The cards: the deck, the staircase, then the grid (three per row)."),
});

/** How the cards travel. Colours are any CSS colours, CSS variables included. */
export const cardJourneyConfigSchema = z.object({
	length: z.number().min(1.5).max(5).default(3).describe("How long the section stays pinned, in screen heights."),
	tilt: z.number().min(0).max(14).default(6).describe("How far the deck's outer cards turn, in degrees."),
	shuffle: z.boolean().default(true).describe("The deck shuffles while the paragraph is read."),
	accent: z.string().min(1).default("var(--foreground, #111114)").describe("The selected tab's colour."),
});

export type CardJourneyContent = z.input<typeof cardJourneyContentSchema>;
export type CardJourneyConfig = z.infer<typeof cardJourneyConfigSchema>;
export type CardJourneyConfigInput = z.input<typeof cardJourneyConfigSchema>;
