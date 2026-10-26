import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

const project = z.object({
	src: z.string().min(1).describe("The image, portrait (10:13 or 4:5 work best)."),
	alt: z.string().min(4).max(160).describe("What the image shows, for screen readers."),
	title: z.string().min(1).max(40).describe("The project's name, read with the card."),
	href: z.string().optional().describe("Where the card leads: the case study."),
});

const step = z.object({
	label: z.string().min(2).max(32),
	card: z.number().int().min(0).optional().describe("The card (by index) that lights this step when it passes the middle. Spread evenly when left out."),
});

/** What the hero says, and the projects it shows. All of it is real text and images in the DOM. */
export const curveReelContentSchema = z.object({
	eyebrow: z.string().max(40).optional().describe("A short kicker in the accent colour."),
	headline: z.string().min(8).max(60).describe("The promise in one or two lines, 3–8 words."),
	subheadline: z.string().max(160).optional().describe("One sentence under the headline."),
	cta: cta.optional(),
	projects: z.array(project).min(4).max(16).describe("The cards of the reel, in the order they pass. When they are too few to close the loop, the reel repeats them."),
	steps: z.array(step).max(5).optional().describe("Numbered steps under the reel (#01, #02…); each lights up while its cards pass the middle."),
});

/** How the reel bends and turns. Colours are any CSS colours, CSS variables included. */
export const curveReelConfigSchema = z.object({
	curvature: z.number().min(0).max(1).default(0.7).describe("0 is a flat strip, 1 a deep curved wall: the middle sinks back, the edges come forward."),
	speed: z.number().min(0).max(120).default(24).describe("How fast the reel turns, in cards per minute; 0 holds it still."),
	visible: z.number().int().min(5).max(11).default(7).describe("How many cards fit on the arc; more are cut at the edges."),
	drag: z.boolean().default(true).describe("Drag or swipe the reel to turn it; it keeps its momentum."),
	tilt: z.number().min(0).max(8).default(3).describe("How far the view leans toward the pointer, in degrees."),
	accent: z.string().default("oklch(0.68 0.2 45)").describe("The eyebrow, the step numbers, the button's arrow and the step progress."),
	steps: z.boolean().default(true).describe("Show the numbered steps and light them as the reel turns."),
	intro: z.boolean().default(true).describe("The cards start stacked in the middle and open onto the curve."),
});

export type CurveReelContent = z.input<typeof curveReelContentSchema>;
export type CurveReelConfig = z.infer<typeof curveReelConfigSchema>;
export type CurveReelConfigInput = z.input<typeof curveReelConfigSchema>;
