import type { ScrollReadContent } from "./schema";

/** Atelier Nine's promise. The images are from Unsplash and StockSnap (see public/sharingan/gallery and reel CREDITS.md). */
export const scrollReadExample: ScrollReadContent = {
	eyebrow: "Every piece tells a story",
	text: "We started Atelier Nine for the painter {0} who never showed her work, the printmaker {1} who sold only to friends, and the collector {2} who wanted to know the hand behind the piece on her wall.",
	images: [
		{ src: "/sharingan/gallery/strokes.webp", alt: "A painting of red, blue and black strokes" },
		{ src: "/sharingan/gallery/faces.webp", alt: "A print of many faces drawn in bold lines" },
		{ src: "/sharingan/reel/camera.webp", alt: "A hand holding a small black camera against a pink wall" },
	],
	cta: { label: "Our story", href: "#story" },
};
