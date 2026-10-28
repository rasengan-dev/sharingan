import { z } from "zod";

/** What the section says, and its cases. All of it is real text, images and links in the DOM. */
export const caseTrackContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(4).max(60).describe("The section's headline, 2–8 words."),
	text: z.string().max(200).optional().describe("One or two sentences beside the headline."),
	cta: z.object({ label: z.string().min(2).max(28), href: z.string().min(1) }).optional(),
	cases: z
		.array(
			z.object({
				title: z.string().min(4).max(70),
				text: z.string().max(220).optional().describe("Shown on the first, wider card; the others show their title only."),
				tag: z.string().max(24).optional().describe("A small pill: the sector, the year."),
				figure: z.string().max(24).optional().describe("One result, set large on the first card: +212% sign-ups."),
				image: z.object({
					src: z.string().min(1).describe("Portrait or square images fit the cards best."),
					alt: z.string().min(4).max(160).describe("What the image shows, for screen readers."),
				}),
				href: z.string().min(1),
			}),
		)
		.min(3)
		.max(8)
		.describe("The cases, in order. The first is the wider one, with its story."),
});

/** How the row moves. Colours are any CSS colours, CSS variables included. */
export const caseTrackConfigSchema = z.object({
	speed: z.number().min(0.5).max(2).default(1).describe("How far the page scrolls for each pixel the row moves: higher holds the row longer."),
	accent: z.string().min(1).default("#ee8a7b").describe("Every third card, the arrows and the progress bar."),
	accentAlt: z.string().min(1).default("#b9ccb1").describe("The first card and every third card after the second."),
});

export type CaseTrackContent = z.input<typeof caseTrackContentSchema>;
export type CaseTrackConfig = z.infer<typeof caseTrackConfigSchema>;
export type CaseTrackConfigInput = z.input<typeof caseTrackConfigSchema>;
