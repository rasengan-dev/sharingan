import type { BentoAssembleContent } from "./schema";

/** Upwind, the made-up growth studio. Portraits from Unsplash (see public/sharingan/people/CREDITS.md). */
export const bentoAssembleExample: BentoAssembleContent = {
	eyebrow: "Why Upwind",
	headline: "Why founders pick us",
	text: "A small senior team, one plan across every channel, and numbers you can check every Monday.",
	badge: { label: "Watch the studio tour", href: "#tour" },
	tiles: [
		{
			size: "wide",
			figure: "40",
			title: "growth specialists",
			text: "Paid, lifecycle, product and SEO, all in one room.",
			avatars: [
				{ src: "/sharingan/people/person-01.webp", alt: "Maya, lifecycle lead" },
				{ src: "/sharingan/people/person-08.webp", alt: "Kofi, paid media" },
				{ src: "/sharingan/people/person-13.webp", alt: "Priya, product analytics" },
				{ src: "/sharingan/people/person-06.webp", alt: "Jonas, SEO" },
			],
		},
		{
			size: "tall",
			tone: "photo",
			label: "Weekly calls",
			image: { src: "/sharingan/people/person-11.webp", alt: "A smiling man in a white t-shirt resting his chin on his hand" },
		},
		{ size: "small", tone: "accent", figure: "1,001", text: "experiments run" },
		{ size: "small", tone: "accent-2", figure: "82%", text: "of clients grow within a quarter" },
		{ size: "tall", tone: "accent", title: "One plan, every channel", text: "Ads, emails and onboarding pull the same way, with one owner for each number." },
		{ size: "small", tone: "photo", image: { src: "/sharingan/people/person-03.webp", alt: "A smiling woman with long brown hair, her hand at her chin" } },
		{ size: "wide", title: "A dashboard you can read", text: "Every test, its cost and what it brought in, updated each morning.", label: "Live" },
		{ size: "small", figure: "$4.2M", text: "raised by clients last year" },
	],
};
