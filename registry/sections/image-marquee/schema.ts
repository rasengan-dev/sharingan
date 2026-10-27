import { z } from "zod";

/** What the band says, and the images set between its words. Real text in the DOM, read once. */
export const imageMarqueeContentSchema = z.object({
	label: z.string().min(2).max(60).optional().describe("What the band is, for screen readers (it is a list)."),
	phrases: z.array(z.string().min(2).max(32)).min(2).max(8).describe("Short phrases, 1–4 words each, shown in order."),
	images: z
		.array(z.object({ src: z.string().min(1), alt: z.string().max(120).describe("Empty when the image only decorates.") }))
		.min(1)
		.max(8)
		.describe("Images set after each phrase, in turn."),
});

/** How the band looks and moves. Colours are any CSS colours, CSS variables included. */
export const imageMarqueeConfigSchema = z.object({
	background: z.string().min(1).default("oklch(0.93 0.19 122)").describe("The band's colour."),
	ink: z.string().min(1).default("#111114").describe("The words' colour; keep 4.5:1 contrast with the band."),
	rows: z.number().int().min(1).max(2).default(2).describe("One row, or two moving in opposite directions."),
	distance: z.number().min(5).max(60).default(25).describe("How far the rows travel while the band crosses the screen, in % of its width."),
});

export type ImageMarqueeContent = z.input<typeof imageMarqueeContentSchema>;
export type ImageMarqueeConfig = z.infer<typeof imageMarqueeConfigSchema>;
export type ImageMarqueeConfigInput = z.input<typeof imageMarqueeConfigSchema>;
