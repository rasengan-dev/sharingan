import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

/** What the hero says, and what is printed on the card. All of it stays in the DOM. */
export const holoCardContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(70).describe("The promise in one line, 4–9 words."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
	card: z.object({
		issuer: z.string().min(2).max(24).describe("Who issues the card: an event, a club, your product. Never a real bank or card network."),
		name: z.string().min(2).max(32).describe("The holder's name, the largest line."),
		role: z.string().max(40).optional().describe("Under the name: a role, a tier, a plan."),
		detail: z.string().max(48).optional().describe("Bottom line: a date, a place, a validity."),
		number: z.string().max(20).optional().describe("An identifier in mono type, e.g. SPK-0142."),
	}),
	back: z
		.object({
			title: z.string().min(2).max(32),
			items: z.array(z.string().min(2).max(48)).max(4).optional(),
			link: cta.optional(),
		})
		.optional()
		.describe("The reverse side, shown when the card is turned over."),
});

/** How the card looks and moves. Colours are any CSS colours, CSS variables included. */
export const holoCardConfigSchema = z.object({
	colors: z
		.array(z.string().min(1))
		.min(2)
		.max(4)
		.default(["oklch(0.82 0.14 210)", "oklch(0.78 0.17 320)", "oklch(0.9 0.15 95)", "oklch(0.82 0.15 155)"])
		.describe("The holographic foil, in the order the rainbow runs."),
	surface: z.enum(["dark", "light"]).default("dark").describe("The card's base under the foil."),
	pattern: z.enum(["guilloche", "lines", "none"]).default("guilloche").describe("What the foil is engraved with."),
	tilt: z.boolean().default(true).describe("The card leans toward the mouse, and drifts slowly when nobody touches it."),
	gyro: z.boolean().default(true).describe("On phones, the card follows the device's tilt (iOS asks permission on the first touch)."),
	flip: z.boolean().default(true).describe("A button (and a click on the card) turns it over to show the back."),
});

export type HoloCardContent = z.input<typeof holoCardContentSchema>;
export type HoloCardConfig = z.infer<typeof holoCardConfigSchema>;
export type HoloCardConfigInput = z.input<typeof holoCardConfigSchema>;
