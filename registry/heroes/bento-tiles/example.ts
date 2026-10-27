import type { BentoTilesContent } from "./schema";

/** A made-up AI support product. Photos from Unsplash, logos from Simple Icons (see public/sharingan/bento/CREDITS.md). */
export const bentoTilesExample: BentoTilesContent = {
	nav: {
		brand: "Samfund",
		links: [
			{ label: "Features", href: "#features" },
			{ label: "How it works", href: "#how" },
			{ label: "Pricing", href: "#pricing" },
			{ label: "FAQ", href: "#faq" },
		],
		cta: { label: "Log in", href: "#login" },
	},
	headline: "AI Solutions That Propel Your Business Forward",
	subheadline: "Built to help service leaders scale efficiency and deliver exceptional support through intelligent AI automation, 24/7.",
	cta: { label: "Book a Demo", href: "#demo" },
	integrations: {
		title: "Integrations",
		description: "Plug into the tools your team already answers from.",
		apps: [
			{ name: "Zendesk", icon: "/sharingan/bento/zendesk.svg" },
			{ name: "Slack", icon: "/sharingan/bento/slack.svg" },
			{ name: "Gmail", icon: "/sharingan/bento/gmail.svg" },
		],
	},
	stat: { value: "2.5B+", label: "Customer messages answered by our agents last year." },
	portrait: { src: "/sharingan/bento/portrait.webp", alt: "Black and white portrait of a man with a shaved head looking at the camera" },
	highlight: { value: "83%", label: "Up to 83% of conversations autonomously resolved" },
	folder: { label: "projects" },
	orbit: {
		title: "Automation Driven Support Excellence",
		people: [
			{ src: "/sharingan/bento/avatar-1.webp", alt: "A support agent" },
			{ src: "/sharingan/bento/avatar-2.webp", alt: "A customer" },
			{ src: "/sharingan/bento/avatar-3.webp", alt: "A team lead" },
			{ src: "/sharingan/bento/avatar-4.webp", alt: "A customer" },
		],
	},
};
