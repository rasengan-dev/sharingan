import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

/** What the hero says. The sky, the sun, the clouds and the rocket are decoration. */
export const skyLaunchContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short line above the headline."),
	headline: z.string().min(8).max(70).describe("The promise in one or two lines, 4–10 words; it arrives word by word."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
});

/** How the sky looks and moves. Colours are any CSS colours, CSS variables included. */
export const skyLaunchConfigSchema = z.object({
	sun: z.string().min(1).default("#f3a39b").describe("The sun, and the rocket's window."),
	sky: z.string().min(1).default("#dfe9da").describe("The sky at the top, and the back clouds."),
	clouds: z.string().min(1).default("#f6cdc6").describe("The middle clouds; the front ones take the page's background."),
	rocket: z.boolean().default(true).describe("A rocket takes off through the sun, leaving a trail."),
	launch: z.number().min(1).max(6).default(2.6).describe("How long the rocket takes to climb, in seconds."),
	exit: z.boolean().default(true).describe("The clouds rise to cover the hero as the page scrolls past it."),
});

export type SkyLaunchContent = z.input<typeof skyLaunchContentSchema>;
export type SkyLaunchConfig = z.infer<typeof skyLaunchConfigSchema>;
export type SkyLaunchConfigInput = z.input<typeof skyLaunchConfigSchema>;
