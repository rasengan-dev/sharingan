export const meta = {
	name: "bento-assemble",
	title: "Bento assemble",
	kind: "section",
	engine: "dom",
	summary: "Bento tiles fly in from around the grid and lock into place as the page scrolls; their figures count up as they land, and a play badge turns with the scroll.",
	useWhen: "A \"why us\" block with a few strong figures, faces and short claims: agencies, studios, SaaS.",
	avoidWhen: "Long text, or a grid that must be read before it settles: it holds the scroll for about two screens.",
	scroll: { pinned: true, length: 1.8 },
	interaction: ["scroll"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
