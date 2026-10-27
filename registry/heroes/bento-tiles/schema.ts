import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

const link = z.object({
	label: z.string().min(1).max(24),
	href: z.string().min(1),
});

const image = z.object({
	src: z.string().min(1),
	alt: z.string().min(4).max(160).describe("What the image shows, for screen readers."),
});

const figure = z.object({
	value: z.string().min(1).max(8).describe("The figure as it reads, e.g. 2.5B+ or 83%. It counts up from zero; prefix and suffix stay."),
	label: z.string().min(4).max(90).describe("What the figure means, one short sentence."),
});

/** What the hero says, and what its six cards show. All of it is real text and images in the DOM. */
export const bentoTilesContentSchema = z.object({
	nav: z
		.object({
			brand: z.string().min(1).max(24).describe("The product's name, at the top left."),
			links: z.array(link).max(5).describe("Page links, in the middle; hidden on phones."),
			cta: cta.optional().describe("The button at the top right, e.g. Log in."),
		})
		.optional()
		.describe("A top bar inside the hero, for pages without their own header. Leave it out when the site has one."),
	headline: z.string().min(8).max(70).describe("The promise in two lines, 5–9 words."),
	subheadline: z.string().max(160).optional().describe("One or two sentences under the headline."),
	cta: cta.optional(),
	integrations: z.object({
		title: z.string().min(2).max(28),
		description: z.string().max(90),
		apps: z.array(z.object({ name: z.string().min(1).max(32), icon: z.string().min(1).describe("A square logo, SVG or image.") })).min(1).max(4),
	}),
	stat: figure.describe("The figure under the integrations."),
	portrait: image
		.extend({
			focus: z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]).optional().describe("Where the face is in the card, in percent from the top left. Default 50, 56."),
		})
		.describe("The tall card: a portrait, black and white works best. Red crosses cover the face and scan it."),
	highlight: figure.describe("The figure on the accent card; a bar fills to it when it is a percentage."),
	folder: z.object({ label: z.string().min(1).max(20).describe("The folder's name on the dark card, over the world map.") }),
	orbit: z.object({
		title: z.string().min(4).max(60).describe("The wide card's statement, three short lines."),
		people: z.array(image).min(1).max(6).describe("Avatars placed on the orbits; they turn when the card is pointed at."),
	}),
});

/** How the tiles and the cards behave. Colours are any CSS colours, CSS variables included. */
export const bentoTilesConfigSchema = z.object({
	accent: z.string().default("oklch(0.88 0.12 125)").describe("The figure card's colour."),
	marks: z.string().default("oklch(0.62 0.23 27)").describe("The crosses scanning the portrait."),
	gradient: z
		.array(z.string().min(1))
		.min(2)
		.max(3)
		.default(["oklch(0.86 0.09 225)", "oklch(0.94 0.03 250)", "oklch(0.91 0.06 40)"])
		.describe("The wide card's gradient, from left to right."),
	tiles: z.boolean().default(true).describe("The wall of raised tiles behind the headline."),
	tileSize: z.number().min(48).max(160).default(104).describe("The tiles' size, in pixels."),
	pointer: z.boolean().default(true).describe("Tiles rise and catch the light under the pointer; the crosses follow it."),
	idle: z.boolean().default(true).describe("Now and then a tile presses in, like a key."),
	intro: z.boolean().default(true).describe("Tiles, headline and cards arrive in turn; the figures count up."),
	showNav: z.boolean().default(true).describe("Show the top bar when the content has one."),
});

export type BentoTilesContent = z.input<typeof bentoTilesContentSchema>;
export type BentoTilesConfig = z.infer<typeof bentoTilesConfigSchema>;
export type BentoTilesConfigInput = z.input<typeof bentoTilesConfigSchema>;
