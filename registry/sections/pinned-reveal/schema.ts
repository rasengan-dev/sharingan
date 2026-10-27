import { z } from "zod";

/** What the section says, and the image it reveals. All of it is real text and images in the DOM. */
export const pinnedRevealContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(60).describe("Darkens as the image grows, 3–8 words."),
	image: z.object({
		src: z.string().min(1).describe("A wide image (16:10 or wider)."),
		alt: z.string().min(4).max(160).describe("What the image shows, for screen readers."),
	}),
	caption: z
		.object({ title: z.string().min(2).max(40), text: z.string().max(120).optional() })
		.optional()
		.describe("A card over the image's corner once it is full width."),
	cta: z.object({ label: z.string().min(2).max(28), href: z.string().min(1) }).optional(),
});

/** How the image grows. */
export const pinnedRevealConfigSchema = z.object({
	length: z.number().min(0.5).max(3).default(1.2).describe("How long the section stays pinned, in screen heights."),
	start: z.number().min(0.3).max(0.9).default(0.55).describe("The image's starting size, as a share of its full width."),
	radius: z.number().min(0).max(48).default(28).describe("The image's corner radius, in pixels."),
	parallax: z.boolean().default(true).describe("The photo also settles inside its frame as it grows."),
});

export type PinnedRevealContent = z.input<typeof pinnedRevealContentSchema>;
export type PinnedRevealConfig = z.infer<typeof pinnedRevealConfigSchema>;
export type PinnedRevealConfigInput = z.input<typeof pinnedRevealConfigSchema>;
