import type { GalleryFanContent } from "./schema";

const unsplash = (id: string) => `https://unsplash.com/photos/${id}`;

/** A made-up art marketplace. The works are from Unsplash, credited on each card (see public/sharingan/gallery/CREDITS.md). */
export const galleryFanExample: GalleryFanContent = {
	eyebrow: "Atelier Nine · art marketplace",
	headline: "A place to show the work you're proud of",
	subheadline: "Artists display their pieces, collectors discover and buy the ones that move them. No algorithm, no auction: the work, and the people behind it.",
	primaryCta: { label: "Join for $9.99/m", href: "#join" },
	secondaryCta: { label: "Read more", href: "#about" },
	artworks: [
		{ src: "/sharingan/gallery/shapes.webp", alt: "Abstract geometric shapes in orange, blue and grey", title: "Geometric study", artist: "The New York Public Library", href: unsplash("mOrJ9WCGbUo") },
		{ src: "/sharingan/gallery/faces.webp", alt: "Stylised group portrait of many faces drawn with bold lines", title: "Faces", artist: "The New York Public Library", href: unsplash("liLTVScrDo8") },
		{ src: "/sharingan/gallery/rooster.webp", alt: "A red rooster with floral patterns on a yellow background", title: "Rooster on gold", artist: "Europeana", href: unsplash("62DpZ5uJxJc") },
		{ src: "/sharingan/gallery/torn-posters.webp", alt: "Torn layers of colourful paper posters revealing a black and white hand", title: "Torn posters", artist: "Jazmin Quaynor", href: unsplash("bm9zWKi_c9Y") },
		{ src: "/sharingan/gallery/strokes.webp", alt: "Abstract painting with bold red, blue and black strokes", title: "Red, blue, black", artist: "Fons Heijnsbroek", href: unsplash("dy3z3x8Khz4") },
		{ src: "/sharingan/gallery/stripes.webp", alt: "Abstract painting of a blue square over pink and red stripes", title: "Blue square", artist: "Fons Heijnsbroek", href: unsplash("6JO92DACboQ") },
		{ src: "/sharingan/gallery/bird.webp", alt: "A colourful bird painted in loose strokes on white", title: "Bird in colour", artist: "Fons Heijnsbroek", href: unsplash("e_95AkA4A4A") },
	],
	collaborators: [
		{ name: "kofi", card: 1 },
		{ name: "ines", card: 6 },
	],
};
