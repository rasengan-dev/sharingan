import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

const point = z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]).describe("[x, y] in percent of the photo, y pointing down.");

/** What the hero says, the photo and the route drawn on it. All of it is real text and images in the DOM. */
export const trailMapContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(48).describe("Two to five big words."),
	subheadline: z.string().max(140).optional().describe("One sentence under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
	photo: z.object({ src: z.string().min(1), alt: z.string().min(4).max(200) }).describe("A landscape photo the route climbs; it is cropped to fill the frame."),
	trail: z.object({
		points: z.array(point).min(2).max(24).describe("The route, from the start to the end, over the photo."),
		stops: z.array(z.number().int().min(0)).max(8).default([]).describe("Indices of points marked as stops along the way."),
		label: z.string().max(28).default("Trekking distance"),
		distance: z.string().max(12).describe("Counted up when the route reaches its end, e.g. “70 km”."),
		description: z.string().max(200).describe("The route in words, for screen readers."),
	}),
	explorers: z
		.object({
			count: z.string().max(8).describe("e.g. “100k”."),
			label: z.string().max(40),
			initials: z.array(z.string().min(1).max(2)).max(4).default([]).describe("Shown as avatars; no photos of real people needed."),
		})
		.optional(),
	destinations: z
		.array(
			z.object({
				src: z.string().min(1),
				alt: z.string().min(4).max(160),
				name: z.string().min(2).max(28),
				duration: z.string().max(24).describe("e.g. “7 days · 6 nights”."),
				rating: z.number().min(0).max(5),
				reviews: z.number().int().min(0),
				href: z.string().optional(),
			}),
		)
		.max(8)
		.optional()
		.describe("A scrolling strip of routes under the hero."),
});

/** How the route draws and the scene moves. Colours are any CSS colours, CSS variables included. */
export const trailMapConfigSchema = z.object({
	accent: z.string().default("oklch(0.68 0.19 42)").describe("The start pin, the walker, the main button and the stars."),
	intro: z.boolean().default(true).describe("The route draws itself from the start to the end, stops lighting up as it passes."),
	walker: z.boolean().default(true).describe("A glowing dot walks the route, over and over."),
	parallax: z.boolean().default(true).describe("Photo, route and clouds shift at different depths with the pointer."),
	clouds: z.boolean().default(true).describe("Soft clouds drift over the edges of the frame."),
});

export type TrailMapContent = z.input<typeof trailMapContentSchema>;
export type TrailMapConfig = z.infer<typeof trailMapConfigSchema>;
export type TrailMapConfigInput = z.input<typeof trailMapConfigSchema>;
