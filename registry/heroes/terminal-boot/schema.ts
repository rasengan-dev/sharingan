import { z } from "zod";

const cta = z.object({
	label: z.string().min(2).max(28).describe("Action verb first, 1–4 words."),
	href: z.string().min(1),
});

const line = z.object({
	text: z.string().min(1).max(72),
	status: z.enum(["ok", "info", "warn", "muted"]).default("ok").describe("`ok` lines spin, then tick."),
});

/** What the hero says, and what the terminal prints. All of it is real text in the DOM. */
export const terminalBootContentSchema = z.object({
	eyebrow: z.string().max(48).optional().describe("A short kicker above the headline."),
	headline: z.string().min(8).max(70).describe("The promise in one line, 4–9 words."),
	subheadline: z.string().max(180).optional().describe("One or two sentences under the headline."),
	primaryCta: cta.optional(),
	secondaryCta: cta.optional(),
	terminal: z.object({
		title: z.string().max(32).default("~/projects").describe("The window's title."),
		command: z.string().min(2).max(64).describe("The real command people should run. A copy button copies it."),
		output: z.array(line).min(1).max(8).describe("What the command prints, line by line."),
		done: z.string().max(72).optional().describe("The last line, e.g. where the app is running."),
	}),
	media: z
		.object({
			src: z.string().min(1),
			alt: z.string().min(4).max(200),
			address: z.string().max(48).optional().describe("Shown in the window's address bar, e.g. your-app.example.com."),
		})
		.optional()
		.describe("The product, revealed when the command has finished."),
});

/** How fast it types and what it does at the end. Colours are any CSS colours, CSS variables included. */
export const terminalBootConfigSchema = z.object({
	speed: z.number().min(5).max(80).default(24).describe("Characters typed per second."),
	accent: z.string().default("var(--brand, oklch(0.68 0.17 262))").describe("The prompt and the links in the output."),
	loop: z.boolean().default(false).describe("Run the whole sequence again a few seconds after it ends."),
	copy: z.boolean().default(true).describe("Show a button that copies the command."),
});

export type TerminalBootContent = z.input<typeof terminalBootContentSchema>;
export type TerminalBootConfig = z.infer<typeof terminalBootConfigSchema>;
export type TerminalBootConfigInput = z.input<typeof terminalBootConfigSchema>;
