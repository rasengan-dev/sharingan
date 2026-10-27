import { z } from "zod";

const image = z.object({
	src: z.string().min(1).describe("Portrait images (4:5) fit the tiles best."),
	alt: z.string().min(4).max(160).describe("What the image shows, for screen readers."),
});

/** What the section says, and its images. All of it is real text and images in the DOM. */
export const mosaicZoomContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(60).describe("The section's headline, 3–8 words."),
	text: z.string().max(200).optional().describe("One or two sentences under the headline."),
	cta: z.object({ label: z.string().min(2).max(28), href: z.string().min(1) }).optional(),
	feature: image
		.extend({ title: z.string().min(2).max(40), meta: z.string().max(40).optional().describe("A second line: a role, a place.") })
		.describe("The image that fills the screen first, then takes the mosaic's centre."),
	tiles: z.array(image).min(8).max(16).describe("The tiles around it, four per row beside the feature (twelve fill three rows)."),
});

/** How the mosaic gathers. */
export const mosaicZoomConfigSchema = z.object({
	length: z.number().min(0.8).max(3).default(1.6).describe("How long the section stays pinned, in screen heights."),
	spread: z.number().min(0).max(1.5).default(0.7).describe("How far out the tiles start, as a share of their distance from the centre."),
});

export type MosaicZoomContent = z.input<typeof mosaicZoomContentSchema>;
export type MosaicZoomConfig = z.infer<typeof mosaicZoomConfigSchema>;
export type MosaicZoomConfigInput = z.input<typeof mosaicZoomConfigSchema>;
