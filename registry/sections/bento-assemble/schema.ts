import { z } from "zod";

const image = z.object({
	src: z.string().min(1),
	alt: z.string().min(4).max(160).describe("What the image shows, for screen readers."),
});

/** One tile of the bento. Every field is optional: a tile shows what it is given. */
const tile = z.object({
	size: z.enum(["small", "wide", "tall", "large"]).default("small").describe("small 1×1, wide 2×1, tall 1×2, large 2×2, on a four-column grid."),
	tone: z.enum(["paper", "accent", "accent-2", "photo"]).default("paper").describe("The tile's colour; `photo` fills it with its image."),
	figure: z.string().max(12).optional().describe("A figure that counts up as the tile lands: 40, 82%, $1.2M, 1,001."),
	title: z.string().max(60).optional(),
	text: z.string().max(140).optional(),
	label: z.string().max(32).optional().describe("A small pill over the tile's corner."),
	image: image.optional().describe("The tile's photo (tone `photo`), or a small picture beside its text."),
	avatars: z.array(image).max(6).optional().describe("Faces set in a row of overlapping circles."),
});

/** What the section says, and its tiles. All of it is real text and images in the DOM. */
export const bentoAssembleContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(4).max(60).describe("The section's headline, 2–8 words."),
	text: z.string().max(200).optional().describe("One or two sentences beside the headline."),
	badge: z
		.object({ label: z.string().min(4).max(40).describe("Set in a circle around the play button."), href: z.string().min(1) })
		.optional()
		.describe("A round play button, ringed by its label, that turns with the scroll."),
	tiles: z.array(tile).min(3).max(10).describe("The tiles, in reading order. Seven fill a 4 × 3 grid with one large, one tall and two wide tiles."),
});

/** How the tiles assemble. Colours are any CSS colours, CSS variables included. */
export const bentoAssembleConfigSchema = z.object({
	length: z.number().min(0.8).max(3).default(1.8).describe("How long the section stays pinned, in screen heights."),
	spread: z.number().min(0).max(1.2).default(0.55).describe("How far out the tiles start, as a share of their distance from the grid's centre."),
	count: z.boolean().default(true).describe("Figures count up as their tile lands."),
	accent: z.string().min(1).default("#ee8a7b").describe("The `accent` tiles, the pills and the badge."),
	accentAlt: z.string().min(1).default("#b9ccb1").describe("The `accent-2` tiles."),
});

export type BentoAssembleContent = z.input<typeof bentoAssembleContentSchema>;
export type BentoAssembleTile = z.input<typeof tile>;
export type BentoAssembleConfig = z.infer<typeof bentoAssembleConfigSchema>;
export type BentoAssembleConfigInput = z.input<typeof bentoAssembleConfigSchema>;
