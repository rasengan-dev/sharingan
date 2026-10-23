import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

const artwork = z.object({
	src: z.string().min(1).describe("The image, portrait (4:5 works best)."),
	alt: z.string().min(4).max(160).describe("What the work shows, for screen readers."),
	title: z.string().min(1).max(40),
	artist: z.string().min(1).max(40).describe("Shown under the title when the card is raised. Credit people here."),
	href: z.string().optional().describe("Where the card leads: the work's page, its source."),
});

/** What the hero says, and the works it shows. All of it is real text and images in the DOM. */
export const galleryFanContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(60).describe("The promise in one or two lines, 4–9 words."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the fan."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
	artworks: z.array(artwork).min(3).max(9).describe("The cards of the fan, left to right."),
	collaborators: z
		.array(z.object({ name: z.string().min(1).max(16), card: z.number().int().min(0).optional() }))
		.max(2)
		.optional()
		.describe("Live cursors resting over a card (by index), as in a shared canvas."),
});

/** How the fan opens and moves. Colours are any CSS colours, CSS variables included. */
export const galleryFanConfigSchema = z.object({
	spread: z.number().min(0.3).max(1).default(0.86).describe("How wide the fan opens, as a share of the hero's width."),
	angle: z.number().min(0).max(40).default(22).describe("How far the outer cards turn, in degrees."),
	depth: z.number().min(0).max(500).default(240).describe("How far the outer cards sink back, in pixels."),
	colors: z
		.array(z.string().min(1))
		.max(2)
		.default(["oklch(0.6 0.2 262)", "oklch(0.62 0.14 160)"])
		.describe("The collaborators' cursor colours."),
	intro: z.boolean().default(true).describe("The cards start stacked and open into the fan."),
	pointer: z.boolean().default(true).describe("The card nearest the pointer rises and its neighbours make room."),
	cursors: z.boolean().default(true).describe("Collaborator cursors float over the cards and move from one to another."),
});

export type GalleryFanContent = z.input<typeof galleryFanContentSchema>;
export type GalleryFanConfig = z.infer<typeof galleryFanConfigSchema>;
export type GalleryFanConfigInput = z.input<typeof galleryFanConfigSchema>;
