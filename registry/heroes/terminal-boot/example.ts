import type { TerminalBootContent } from "./schema";

/** The real Hiraiship CLI, as hiraiship.com shows it. */
export const terminalBootExample: TerminalBootContent = {
	eyebrow: "Hiraiship · edge hosting",
	headline: "From a folder to a live URL in one command",
	subheadline: "Push a Vite, Rasengan.js, Astro or Next.js app. Hiraiship detects the framework, builds it in a sandbox and serves it from Cloudflare's global network.",
	primaryCta: { label: "Start for free", href: "https://hiraiship.com" },
	secondaryCta: { label: "Read the docs", href: "https://docs.hiraiship.com" },
	terminal: {
		title: "~/acme/storefront",
		command: "npx hiraiship deploy",
		output: [
			{ text: "Packing 214 files · 1.8 MB", status: "muted" },
			{ text: "Framework  vite, detected", status: "ok" },
			{ text: "Install    pnpm install · 6.2s", status: "ok" },
			{ text: "Build      vite build · 4.1s", status: "ok" },
			{ text: "Package    32 assets · 3 changed · 0.9s", status: "ok" },
			{ text: "Publish    production · 1.3s", status: "ok" },
		],
		done: "Ready → https://storefront.hiraiship.app",
	},
	media: {
		src: "/sharingan/hiraiship.png",
		alt: "Hiraiship home page: “Ship to the edge in a flash”, with the deploy command under the buttons",
		address: "hiraiship.com",
	},
};
