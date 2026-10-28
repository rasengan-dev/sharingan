import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

/** What the section says, and its people. All of it is real text and images in the DOM. */
export const portraitBurstContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(4).max(40).describe("A short headline, 2–5 words: the portraits gather around it."),
	text: z.string().max(160).optional().describe("One sentence under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
	people: z
		.array(
			z.object({
				src: z.string().min(1).describe("A portrait, 4:5, the face near the top third."),
				alt: z.string().min(4).max(160).describe("Who it is, for screen readers."),
				name: z.string().max(40).optional(),
				role: z.string().max(40).optional(),
			}),
		)
		.min(6)
		.max(12)
		.describe("The portraits, placed in this order on twelve set slots around the headline."),
	pills: z.array(z.string().min(2).max(28)).max(4).optional().describe("Short facts set between the portraits: 15+ years, 100+ clients."),
});

/** How the portraits burst. Colours are any CSS colours, CSS variables included. */
export const portraitBurstConfigSchema = z.object({
	length: z.number().min(0.8).max(3).default(1.6).describe("How long the section stays pinned, in screen heights."),
	drift: z.number().min(0).max(1).default(0.5).describe("How far the portraits drift up, each at its own speed, as the section leaves."),
	tilt: z.number().min(0).max(20).default(8).describe("How much the stacked portraits lean, in degrees."),
	accent: z.string().min(1).default("#ee8a7b").describe("The pills."),
});

export type PortraitBurstContent = z.input<typeof portraitBurstContentSchema>;
export type PortraitBurstConfig = z.infer<typeof portraitBurstConfigSchema>;
export type PortraitBurstConfigInput = z.input<typeof portraitBurstConfigSchema>;
