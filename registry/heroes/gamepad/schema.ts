import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

const section = z.object({
	label: z.string().min(2).max(24).describe("The section's name on its button and in the legend, 1–2 words."),
	title: z.string().min(8).max(70).describe("What the section shows, one line."),
	body: z.string().max(260).optional().describe("A short paragraph."),
	items: z.array(z.string().min(2).max(60)).max(5).optional().describe("Short chips, e.g. projects or skills."),
	quote: z.object({ text: z.string().min(10).max(180), cite: z.string().min(2).max(60) }).optional().describe("A testimonial."),
});

/** What the hero says. Every section stays in the DOM: readable, selectable, indexable. */
export const gamepadContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(70).describe("The promise in one line, 4–9 words."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
	sections: z
		.array(section)
		.min(1)
		.max(4)
		.describe("Up to four screens, on the Y, X, B and A buttons in that order (the D-pad reaches them too)."),
	wordmark: z
		.object({ title: z.string().min(2).max(12), tagline: z.string().max(24).optional() })
		.default({ title: "SG·PAD", tagline: "MADE FOR CLICKING" })
		.describe("Printed on the controller. Your own name, never a console maker's."),
	collaborators: z.array(z.string().min(1).max(16)).max(2).optional().describe("Names on the live cursors floating around the controller."),
});

/** How the controller looks and listens. Colours are any CSS colours, CSS variables included. */
export const gamepadConfigSchema = z.object({
	colors: z
		.array(z.string().min(1))
		.length(4)
		.default(["#2f9d5c", "#2f4bc4", "#e5b41d", "#d23538"])
		.describe("The Y, X, B and A buttons, in that order."),
	shell: z
		.enum(["auto", "clay", "graphite", "translucent"])
		.default("auto")
		.describe("The controller's plastic. `auto` picks clay on light pages and graphite on dark ones."),
	tilt: z.boolean().default(true).describe("The controller leans toward the mouse."),
	keyboard: z.boolean().default(true).describe("Arrows, A B X Y and Esc drive it (arrows only once focus is inside)."),
	gamepad: z.boolean().default(true).describe("A real controller plugged into the computer drives it."),
	easterEgg: z.boolean().default(true).describe("The Konami code swaps in a translucent shell."),
});

export type GamepadContent = z.input<typeof gamepadContentSchema>;
export type GamepadConfig = z.infer<typeof gamepadConfigSchema>;
export type GamepadConfigInput = z.input<typeof gamepadConfigSchema>;
