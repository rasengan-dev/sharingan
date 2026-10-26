import type { CurveReelContent } from "./schema";

/** A made-up product studio. The photos are CC0, from StockSnap (see public/sharingan/reel/CREDITS.md). */
export const curveReelExample: CurveReelContent = {
	eyebrow: "Behind the work",
	headline: "Curious what else we've made?",
	subheadline: "Brand identities, packaging and product shoots from the studio, for small makers and the shelves they want to win.",
	cta: { label: "See all projects", href: "#projects" },
	projects: [
		{ src: "/sharingan/reel/camera.webp", alt: "A hand holds a small black camera against a pink wall", title: "Pocket camera launch" },
		{ src: "/sharingan/reel/soda.webp", alt: "A glass of soda with ice and a striped straw next to a green bottle", title: "Corner bar soda" },
		{ src: "/sharingan/reel/teapot.webp", alt: "A turquoise teapot pours red tea into a white cup on blue", title: "Red tea, blue set" },
		{ src: "/sharingan/reel/jam.webp", alt: "Jars of strawberry jam behind fresh strawberries on a green background", title: "Strawberry jam label" },
		{ src: "/sharingan/reel/headphones.webp", alt: "Mint headphones lying across a mint and pink background", title: "Pastel headphones" },
		{ src: "/sharingan/reel/iced-tea.webp", alt: "A glass of iced tea with mint and lemon on a café table", title: "Iced tea menu" },
		{ src: "/sharingan/reel/purple-soda.webp", alt: "The silhouette of a person holding a soda bottle against a purple sky", title: "Night soda campaign" },
		{ src: "/sharingan/reel/flatlay.webp", alt: "A black quilted bag, sunglasses, a watch and lipstick laid out on white", title: "Accessories catalogue" },
		{ src: "/sharingan/reel/watch.webp", alt: "A black watch with a white face on a wrist", title: "Minimal watch" },
	],
	steps: [
		{ label: "Strategy & planning", card: 0 },
		{ label: "Design & development", card: 3 },
		{ label: "Launch & growth", card: 5 },
		{ label: "Ongoing support", card: 7 },
	],
};
