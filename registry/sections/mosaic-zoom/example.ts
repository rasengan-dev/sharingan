import type { MosaicZoomContent } from "./schema";

/** Atelier Nine's members. The images are from Unsplash and StockSnap (see public/sharingan/bento, gallery and reel CREDITS.md). */
export const mosaicZoomExample: MosaicZoomContent = {
	eyebrow: "Members",
	headline: "You will find yourself among us",
	text: "Painters, printmakers, photographers and makers: four thousand members, and room for one more.",
	cta: { label: "Become a member", href: "#join" },
	feature: { src: "/sharingan/bento/portrait.webp", alt: "Black and white portrait of a man with a shaved head", title: "Artist of the month", meta: "Collage and print" },
	tiles: [
		{ src: "/sharingan/gallery/shapes.webp", alt: "Abstract geometric shapes in orange, blue and grey" },
		{ src: "/sharingan/reel/headphones.webp", alt: "Mint earphones on a mint and pink background" },
		{ src: "/sharingan/gallery/faces.webp", alt: "Stylised group portrait of many faces drawn with bold lines" },
		{ src: "/sharingan/reel/camera.webp", alt: "A hand holding a small black camera against a pink wall" },
		{ src: "/sharingan/gallery/rooster.webp", alt: "A red rooster with floral patterns on a yellow background" },
		{ src: "/sharingan/reel/purple-soda.webp", alt: "A silhouette holding a bottle against purple and pink light" },
		{ src: "/sharingan/gallery/torn-posters.webp", alt: "Torn layers of colourful paper posters revealing a black and white hand" },
		{ src: "/sharingan/reel/iced-tea.webp", alt: "A glass of iced tea with mint leaves" },
		{ src: "/sharingan/gallery/strokes.webp", alt: "Abstract painting with bold red, blue and black strokes" },
		{ src: "/sharingan/reel/jam.webp", alt: "Jars of strawberry jam beside fresh strawberries" },
		{ src: "/sharingan/gallery/stripes.webp", alt: "Abstract painting of a blue square over pink and red stripes" },
		{ src: "/sharingan/gallery/bird.webp", alt: "A colourful bird painted in loose strokes on white" },
	],
};
