export const meta = {
	name: "iso-deck",
	title: "Iso deck",
	engine: "dom",
	summary: "A macro pad in isometric line art: a cursor selects the floating tile, a tooltip types the tagline and the keys spell a word. Hover the keys to press them, type the word to connect the deck.",
	useWhen: "Developer tools, APIs, wallets and infrastructure that want a crafted, playful object instead of a screenshot: one action, made tangible.",
	avoidWhen: "Products whose story is a screen or a photo, or pages that need the hero to show real data.",
	interaction: ["pointer", "keyboard", "touch", "idle"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
