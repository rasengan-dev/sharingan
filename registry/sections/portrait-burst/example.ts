import type { PortraitBurstContent } from "./schema";

/** Upwind's team. The names are made up; the portraits are from Unsplash (see public/sharingan/people/CREDITS.md). */
export const portraitBurstExample: PortraitBurstContent = {
	eyebrow: "The team",
	headline: "Meet the growth team",
	text: "Fourteen specialists who have scaled products from the first hundred users to the first million.",
	primaryCta: { label: "Book a call", href: "#call" },
	secondaryCta: { label: "See their work", href: "#cases" },
	people: [
		{ src: "/sharingan/people/person-04.webp", alt: "Daniel Okafor, founder", name: "Daniel Okafor", role: "Founder" },
		{ src: "/sharingan/people/person-01.webp", alt: "Maya Lindqvist, lifecycle lead", name: "Maya Lindqvist", role: "Lifecycle" },
		{ src: "/sharingan/people/person-08.webp", alt: "Kofi Mensah, paid media", name: "Kofi Mensah", role: "Paid media" },
		{ src: "/sharingan/people/person-05.webp", alt: "Lena Brandt, brand and content", name: "Lena Brandt", role: "Content" },
		{ src: "/sharingan/people/person-09.webp", alt: "Ravi Desai, data", name: "Ravi Desai", role: "Data" },
		{ src: "/sharingan/people/person-13.webp", alt: "Priya Nair, product analytics", name: "Priya Nair", role: "Analytics" },
		{ src: "/sharingan/people/person-06.webp", alt: "Jonas Weber, SEO", name: "Jonas Weber", role: "SEO" },
		{ src: "/sharingan/people/person-14.webp", alt: "Mei Tan, onboarding", name: "Mei Tan", role: "Onboarding" },
		{ src: "/sharingan/people/person-10.webp", alt: "Tom Ellis, experiments", name: "Tom Ellis", role: "Experiments" },
		{ src: "/sharingan/people/person-07.webp", alt: "Ana Ruiz, design", name: "Ana Ruiz", role: "Design" },
		{ src: "/sharingan/people/person-02.webp", alt: "Sam Novak, engineering", name: "Sam Novak", role: "Engineering" },
		{ src: "/sharingan/people/person-12.webp", alt: "Alex Moreau, research", name: "Alex Moreau", role: "Research" },
	],
	pills: ["15+ years of growth", "120+ startups", "3 exits", "Remote · 9 countries"],
};
