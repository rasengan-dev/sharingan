import type { GamepadContent } from "./schema";

export const gamepadExample: GamepadContent = {
	eyebrow: "Product designer · free from January",
	headline: "I design interfaces you want to play with",
	sections: [
		{
			label: "Work",
			title: "Three products, shipped and still in use",
			items: ["Ledger · invoicing for studios", "Tidepool · swim coaching app", "Kumo · weather for small-plane pilots"],
		},
		{
			label: "Achievements",
			title: "Talks, juries and one very proud mother",
			body: "Spoke at four design meetups in Douala, Lagos and Abidjan. Jury member for a student design award, two years running.",
		},
		{
			label: "Client feedback",
			title: "What clients say",
			quote: { text: "Noa turned a forty-page spec into a prototype we could play with in a week.", cite: "Ama K., product lead at Tidepool" },
		},
		{
			label: "FAQ",
			title: "Short answers before you book",
			body: "Freelance from January, two clients at a time. I work from Douala on WAT (UTC+1) and overlap with Europe all day. Projects start at four weeks.",
		},
	],
	wordmark: { title: "NOA·PAD", tagline: "MADE FOR CLICKING" },
	collaborators: ["Ama", "Sina"],
};
