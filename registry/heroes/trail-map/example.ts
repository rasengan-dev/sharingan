import type { TrailMapContent } from "./schema";

/** A made-up trekking agency. The photos are from Unsplash, credited in public/sharingan/trail/CREDITS.md. */
export const trailMapExample: TrailMapContent = {
	eyebrow: "Basecamp · guided treks",
	headline: "Trekking & Camping",
	subheadline: "A field guide to your snow peak adventures, from the first switchback to the summit.",
	primaryCta: { label: "Book now", href: "#book" },
	secondaryCta: { label: "See all routes", href: "#routes" },
	photo: { src: "/sharingan/trail/summit.webp", alt: "A rocky mountain peak lit orange by the evening sun, under a clear sky (photo: Jeremy Mowery, Unsplash)" },
	trail: {
		points: [
			[12, 93],
			[22, 82],
			[19, 71],
			[31, 62],
			[28, 51],
			[40, 43],
			[38, 33],
			[46, 24],
			[48, 14],
		],
		stops: [2, 5],
		label: "Trekking distance",
		distance: "70 km",
		description: "A 70 km route from the valley floor, by two camps on the west face, to the summit.",
	},
	explorers: { count: "100k", label: "People have explored", initials: ["AK", "MN", "JS"] },
	destinations: [
		{ src: "/sharingan/trail/ama-dablam.webp", alt: "Ama Dablam's snowy peak above a valley in Nepal (photo: Rohit Tandon, Unsplash)", name: "Ama Dablam", duration: "14 days · 13 nights", rating: 5, reviews: 128 },
		{ src: "/sharingan/trail/cloud-ridge.webp", alt: "Two hikers on a grassy ridge above a sea of clouds (photo: Laurentiu Morariu, Unsplash)", name: "Cloud ridge", duration: "7 days · 6 nights", rating: 5, reviews: 74 },
		{ src: "/sharingan/trail/valley-lake.webp", alt: "A still lake below pine trees and grey peaks (photo: Linda Pomerantz Zhang, Unsplash)", name: "Valley lakes", duration: "5 days · 4 nights", rating: 4, reviews: 52 },
		{ src: "/sharingan/trail/forest-trail.webp", alt: "A stony path through pines toward a blue mountain (photo: Tom Jur, Unsplash)", name: "Pine trail", duration: "3 days · 2 nights", rating: 4, reviews: 31 },
	],
};
