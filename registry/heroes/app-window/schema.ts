import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

/** The product screen, drawn in HTML. It is a picture of the product: read as one description, not as data. */
const app = z.object({
	label: z.string().min(8).max(200).describe("What the screen shows, read by screen readers instead of its parts."),
	name: z.string().min(2).max(20).describe("The product's name, top of the sidebar."),
	nav: z.array(z.string().min(2).max(18)).min(2).max(6).describe("Sidebar items; the first is the current page."),
	title: z.string().min(2).max(32).describe("The page's title."),
	stats: z
		.array(z.object({ label: z.string().min(2).max(20), value: z.string().min(1).max(10), delta: z.string().max(8).optional() }))
		.min(2)
		.max(4)
		.describe("Key numbers. Values starting with a number count up when the screen builds."),
	chart: z.object({
		label: z.string().min(2).max(40),
		points: z.array(z.number()).min(6).max(32).describe("The series, left to right; scaled to fit."),
	}),
	columns: z.array(z.string().min(1).max(14)).min(2).max(5),
	rows: z
		.array(z.object({ cells: z.array(z.string().max(24)).min(2).max(5), status: z.enum(["ok", "warn", "error", "neutral"]).default("neutral") }))
		.min(2)
		.max(5)
		.describe("Table rows; `status` colours the second cell as a badge."),
});

export const appWindowContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(70).describe("The promise in one line, 4–9 words."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
	app,
});

/** How the screen builds and moves. Colours are any CSS colours, CSS variables included. */
export const appWindowConfigSchema = z.object({
	accent: z.string().default("var(--brand, oklch(0.62 0.2 262))").describe("The chart, the current page and the highlights."),
	stagger: z.number().min(0).max(300).default(110).describe("Milliseconds between two panels as the screen builds."),
	tilt: z.boolean().default(true).describe("The window leans toward the pointer and its panels shift at different depths."),
	countUp: z.boolean().default(true).describe("Numbers count up from zero as their card appears."),
});

export type AppWindowContent = z.input<typeof appWindowContentSchema>;
export type AppWindowConfig = z.infer<typeof appWindowConfigSchema>;
export type AppWindowConfigInput = z.input<typeof appWindowConfigSchema>;
