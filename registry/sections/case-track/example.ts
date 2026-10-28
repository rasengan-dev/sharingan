import type { CaseTrackContent } from "./schema";

/** Upwind's case studies, all made up. Photos from Unsplash (see public/sharingan/people and reel CREDITS.md). */
export const caseTrackExample: CaseTrackContent = {
	eyebrow: "Case studies",
	headline: "Explore our case studies",
	text: "From a two-person app to a public company: what we tried, what failed, and what moved the number.",
	cta: { label: "All case studies", href: "#cases" },
	cases: [
		{
			title: "Clinic booking for the over-sixties",
			text: "Calmly built a booking app for older patients. We rewrote onboarding around a phone call instead of a form, and sign-ups tripled in a quarter.",
			tag: "Health",
			figure: "+212% sign-ups",
			image: { src: "/sharingan/people/person-03.webp", alt: "A smiling woman with long brown hair, her hand at her chin" },
			href: "#calmly",
		},
		{ title: "From dorm room to boardroom", tag: "Fintech", image: { src: "/sharingan/people/person-10.webp", alt: "A young man in a peach polo shirt smiling" }, href: "#ledgerly" },
		{ title: "Refills that sell themselves", tag: "Retail", image: { src: "/sharingan/reel/soda.webp", alt: "A glass of sparkling soda with a striped straw beside a green bottle" }, href: "#fizz" },
		{ title: "A newsletter that pays rent", tag: "Media", image: { src: "/sharingan/people/person-07.webp", alt: "A smiling woman with a short dark bob" }, href: "#weekly" },
		{ title: "Headphones for the commute", tag: "Hardware", image: { src: "/sharingan/reel/headphones.webp", alt: "Mint earphones on a mint and pink background" }, href: "#hush" },
		{ title: "Hiring without job boards", tag: "HR", image: { src: "/sharingan/people/person-12.webp", alt: "A person with shoulder-length brown hair laughing" }, href: "#crew" },
	],
};
