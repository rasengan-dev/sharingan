import type { MarqueeTypeContent } from "./schema";

export const marqueeTypeExample: MarqueeTypeContent = {
	eyebrow: "Okra · design studio",
	headline: "A studio for brands that refuse to sit still",
	subheadline: "Identity, motion and websites for founders across Lagos, Accra and Nairobi. Small team, senior hands, fast answers.",
	primaryCta: { label: "Start a project", href: "#contact" },
	secondaryCta: { label: "See the work", href: "#work" },
	rowsLabel: "What we do and where",
	rows: [
		["Brand identity", "Motion", "Websites", "Type", "Packaging"],
		["Campaigns", "3D", "Editorial", "Art direction", "Sound"],
		["Lagos", "Accra", "Nairobi", "Paris", "Anywhere"],
	],
};
