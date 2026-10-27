import { z } from "zod";

const card = z.object({
	src: z.string().min(1).describe("The card's image (4:3 works best)."),
	alt: z.string().min(4).max(160).describe("What the image shows, for screen readers."),
	title: z.string().min(2).max(48),
	text: z.string().max(160).optional().describe("One or two sentences under the title."),
	href: z.string().optional().describe("Where the card leads."),
});

/** What the section says, and its cards. All of it is real text and images in the DOM. */
export const parallaxColumnsContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(60).describe("The section's headline, 3–8 words."),
	text: z.string().max(220).optional().describe("One or two sentences beside the headline."),
	cards: z.array(card).min(4).max(10).describe("The cards, alternating between the left and right columns."),
});

/** How the columns travel. */
export const parallaxColumnsConfigSchema = z.object({
	speed: z.number().min(0).max(1).default(0.5).describe("How far the columns drift apart as the page scrolls."),
	depth: z.boolean().default(true).describe("Each photo also moves inside its card."),
});

export type ParallaxColumnsContent = z.input<typeof parallaxColumnsContentSchema>;
export type ParallaxColumnsConfig = z.infer<typeof parallaxColumnsConfigSchema>;
export type ParallaxColumnsConfigInput = z.input<typeof parallaxColumnsConfigSchema>;
