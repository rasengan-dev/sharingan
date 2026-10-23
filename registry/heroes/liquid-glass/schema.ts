import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

/** What the hero says. Text stays in the DOM; the image's description is read by screen readers. */
export const liquidGlassContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(70).describe("The promise in one line, 4–9 words."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
	media: z.object({
		src: z.string().min(1).describe("Product screenshot, about 16:10, at least 1600 px wide. Same origin, or served with CORS."),
		alt: z.string().max(140).describe("What the screenshot shows."),
	}),
});

/** How the glass looks and moves. Colours are any CSS colours, CSS variables included. */
export const liquidGlassConfigSchema = z.object({
	colors: z
		.array(z.string().min(1))
		.min(1)
		.max(2)
		.default(["var(--brand, oklch(0.66 0.2 262))", "oklch(0.97 0.02 250)"])
		.describe("The glass tint, then the colour of its rim light."),
	background: z.string().default("var(--background, #0b0c10)").describe("The colour around the screenshot."),
	image: z.string().default("/sharingan/product.png").describe("The image under the glass; the hero component passes `content.media.src`."),
	refraction: z.number().min(0).max(2).default(1).describe("How strongly the glass bends what is under it."),
	drops: z.number().int().min(0).max(5).default(4).describe("Drops of glass drifting on their own."),
	pointer: z.boolean().default(true).describe("A drop follows the cursor."),
	poster: z.string().optional().describe("Image shown when WebGPU is unavailable."),
});

export type LiquidGlassContent = z.infer<typeof liquidGlassContentSchema>;
export type LiquidGlassConfig = z.infer<typeof liquidGlassConfigSchema>;
export type LiquidGlassConfigInput = z.input<typeof liquidGlassConfigSchema>;
