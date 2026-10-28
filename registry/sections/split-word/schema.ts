import { z } from "zod";

/** What the section says. All of it is real text, links and form fields in the DOM. */
export const splitWordContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the word."),
	word: z.string().min(3).max(14).describe("The giant word, 1–2 short words: Contact us, Say hello, Join."),
	split: z.number().int().min(1).optional().describe("The letter the word parts before (counting spaces); the middle by default."),
	card: z
		.object({
			title: z.string().min(2).max(40),
			lines: z.array(z.string().min(1).max(48)).min(1).max(4).describe("An address, a phone, an email: one per line."),
			href: z.string().optional().describe("Where the card links to: a mailto:, a map."),
		})
		.describe("The card that rises into the word."),
	form: z
		.object({
			action: z.string().min(1).describe("Where the form posts."),
			submit: z.string().min(2).max(20).default("Send"),
			subject: z.boolean().default(true).describe("A subject field beside the name and the email."),
		})
		.optional()
		.describe("A contact form under the word: name, email, subject and message."),
});

/** How the word comes together and parts. Colours are any CSS colours, CSS variables included. */
export const splitWordConfigSchema = z.object({
	length: z.number().min(0.8).max(3).default(1.5).describe("How long the section stays pinned, in screen heights."),
	spread: z.number().min(0).max(1.5).default(0.8).describe("How wide the letters start apart, in letter widths."),
	tilt: z.number().min(-15).max(15).default(-4).describe("The card's final lean, in degrees."),
	accent: z.string().min(1).default("#ee8a7b").describe("The card and the send button."),
});

export type SplitWordContent = z.input<typeof splitWordContentSchema>;
export type SplitWordConfig = z.infer<typeof splitWordConfigSchema>;
export type SplitWordConfigInput = z.input<typeof splitWordConfigSchema>;
