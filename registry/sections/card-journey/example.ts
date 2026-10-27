import type { CardJourneyContent } from "./schema";

/** The made-up art marketplace of the gallery-fan hero. The works are from Unsplash (see public/sharingan/gallery/CREDITS.md). */
export const cardJourneyExample: CardJourneyContent = {
	statement:
		"Whether you're an artist looking for a home for your work, or a collector looking for the piece that stops you, Atelier Nine connects you to the people who make it.",
	aside: { title: "Where art meets its people", text: "Every work is shown by the artist who made it, with the story behind it." },
	eyebrow: "Collections",
	headline: "Our vision for any kind of art",
	text: "Painters, printmakers, collagists: each shows the work as they see it, and collectors find it without an algorithm in the way.",
	cta: { label: "Read more", href: "#about" },
	tabs: [{ label: "All works" }, { label: "Originals", cards: [0, 2, 4] }, { label: "Prints", cards: [1, 3, 5] }],
	cards: [
		{ src: "/sharingan/gallery/shapes.webp", alt: "Abstract geometric shapes in orange, blue and grey", title: "Geometric study", meta: "NYPL" },
		{ src: "/sharingan/gallery/faces.webp", alt: "Stylised group portrait of many faces drawn with bold lines", title: "Faces", meta: "NYPL" },
		{ src: "/sharingan/gallery/rooster.webp", alt: "A red rooster with floral patterns on a yellow background", title: "Rooster on gold", meta: "Europeana" },
		{ src: "/sharingan/gallery/torn-posters.webp", alt: "Torn layers of colourful paper posters revealing a black and white hand", title: "Torn posters", meta: "Jazmin Quaynor" },
		{ src: "/sharingan/gallery/strokes.webp", alt: "Abstract painting with bold red, blue and black strokes", title: "Red, blue, black", meta: "Fons Heijnsbroek" },
		{ src: "/sharingan/gallery/stripes.webp", alt: "Abstract painting of a blue square over pink and red stripes", title: "Blue square", meta: "Fons Heijnsbroek" },
	],
};
