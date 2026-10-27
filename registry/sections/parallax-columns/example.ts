import type { ParallaxColumnsContent } from "./schema";

/** Atelier Nine's journal. The images are from Unsplash and StockSnap (see public/sharingan/gallery and reel CREDITS.md). */
export const parallaxColumnsExample: ParallaxColumnsContent = {
	eyebrow: "From the journal",
	headline: "Every piece tells a story",
	text: "Studio visits, first sales and the long road to a show. Our members write about the work as it happens.",
	cards: [
		{ src: "/sharingan/gallery/torn-posters.webp", alt: "Torn layers of colourful paper posters revealing a black and white hand", title: "Connect, create, collect", text: "How a wall of torn posters became a series of forty collages.", href: "#journal-posters" },
		{ src: "/sharingan/gallery/bird.webp", alt: "A colourful bird painted in loose strokes on white", title: "Where art meets its buyers", text: "Fons Heijnsbroek on selling a painting to someone he could talk to.", href: "#journal-bird" },
		{ src: "/sharingan/reel/flatlay.webp", alt: "An open black handbag with a watch, a phone and sunglasses laid out on white", title: "What's in a studio bag", text: "Five artists empty their bags before a day of drawing outdoors.", href: "#journal-bag" },
		{ src: "/sharingan/gallery/rooster.webp", alt: "A red rooster with floral patterns on a yellow background", title: "Old prints, new homes", text: "Why public-domain prints are finding their way back onto walls.", href: "#journal-prints" },
		{ src: "/sharingan/reel/teapot.webp", alt: "A turquoise teapot pouring a twisted red candy rope into a white cup", title: "Objects worth keeping", text: "Ceramicists join the marketplace in May, starting with tableware.", href: "#journal-ceramics" },
		{ src: "/sharingan/gallery/shapes.webp", alt: "Abstract geometric shapes in orange, blue and grey", title: "A first show in six weeks", text: "From an empty profile to a sold-out wall: one member's diary.", href: "#journal-show" },
	],
};
