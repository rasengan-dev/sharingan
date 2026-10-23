export const meta = {
	name: "gallery-fan",
	title: "Gallery fan",
	engine: "dom",
	summary: "A fan of artwork cards opens under the headline; the card nearest the pointer rises while its neighbours make room, and collaborator cursors drift between them.",
	useWhen: "Marketplaces, portfolios, collectives and galleries: when the work itself is the promise and you have six or seven strong images.",
	avoidWhen: "Products without visuals to show, or images that must be seen whole (cards overlap and turn).",
	interaction: ["pointer", "keyboard", "touch", "idle"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
