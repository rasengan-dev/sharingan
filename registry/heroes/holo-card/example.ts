import type { HoloCardContent } from "./schema";

export const holoCardExample: HoloCardContent = {
	eyebrow: "Lagoon Conf · Douala, 12–13 March",
	headline: "Your badge is ready. The talks are even better.",
	subheadline: "Two days of design systems, web platform and craft, by the water. Speakers, workshops and a closing dinner nobody forgets.",
	primaryCta: { label: "Get your pass", href: "#tickets" },
	secondaryCta: { label: "See the schedule", href: "#schedule" },
	card: {
		issuer: "LAGOON/26",
		name: "Adaeze Okafor",
		role: "Speaker · Design systems",
		detail: "Douala · 12–13 Mar 2026",
		number: "SPK-0142",
	},
	back: {
		title: "Speaker access",
		items: ["Main hall and workshops", "Speaker lounge", "Closing dinner, Friday"],
		link: { label: "Add to calendar", href: "#calendar" },
	},
};
