import { z } from "zod";

const image = z.object({
	src: z.string().min(1).describe("A small image, shown about two letters wide inside the text."),
	alt: z.string().min(2).max(120).describe("What it shows; leave it empty in markup when it only decorates."),
});

/** What the section says. Real text and images in the DOM. */
export const scrollReadContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the paragraph."),
	text: z
		.string()
		.min(20)
		.max(400)
		.describe("The paragraph, 20–60 words. `{0}`, `{1}`… place the images inside it, between words."),
	images: z.array(image).max(6).optional().describe("The images the text places with `{0}`, `{1}`…"),
	cta: z.object({ label: z.string().min(2).max(28), href: z.string().min(1) }).optional(),
});

/** How the text is read. */
export const scrollReadConfigSchema = z.object({
	from: z.number().min(0.4).max(0.9).default(0.45).describe("How dark unread words are (their opacity); 0.4 keeps 3:1 contrast."),
	pop: z.boolean().default(true).describe("Images inside the text grow in when they are reached."),
});

export type ScrollReadContent = z.input<typeof scrollReadContentSchema>;
export type ScrollReadConfig = z.infer<typeof scrollReadConfigSchema>;
export type ScrollReadConfigInput = z.input<typeof scrollReadConfigSchema>;
