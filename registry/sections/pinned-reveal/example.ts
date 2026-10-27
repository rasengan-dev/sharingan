import type { PinnedRevealContent } from "./schema";

/** Atelier Nine's plein-air week. The photo is from Unsplash (see public/sharingan/trail/CREDITS.md). */
export const pinnedRevealExample: PinnedRevealContent = {
	eyebrow: "Plein-air week · June",
	headline: "Paint where the light is",
	image: { src: "/sharingan/trail/summit.webp", alt: "A rocky mountain face lit orange by the setting sun under a pale blue sky (photo: Jeremy Mowery, Unsplash)" },
	caption: { title: "Twelve painters, one mountain", text: "Seven days outdoors, then a show of everything they made." },
	cta: { label: "Join the week", href: "#plein-air" },
};
