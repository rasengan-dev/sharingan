import type { ImageMarqueeContent } from "./schema";

/** Atelier Nine's disciplines. The images are from Unsplash (see public/sharingan/gallery/CREDITS.md). */
export const imageMarqueeExample: ImageMarqueeContent = {
	label: "What our members make",
	phrases: ["Inspired by people", "New art every week", "Prints and originals", "Made by hand"],
	images: [
		{ src: "/sharingan/gallery/rooster.webp", alt: "" },
		{ src: "/sharingan/gallery/stripes.webp", alt: "" },
		{ src: "/sharingan/gallery/faces.webp", alt: "" },
		{ src: "/sharingan/gallery/bird.webp", alt: "" },
	],
};
