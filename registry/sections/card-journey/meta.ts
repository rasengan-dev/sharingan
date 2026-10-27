export const meta = {
	name: "card-journey",
	title: "Card journey",
	kind: "section",
	engine: "dom",
	summary: "A paragraph darkens word by word while a deck of cards shuffles beside it; the deck deals out into a staircase, then lands in a tabbed grid.",
	useWhen: "Right under a visual hero, to bridge a statement and a collection: marketplaces, portfolios, catalogues with six strong images.",
	avoidWhen: "Pages that must be skimmed fast: the section holds the scroll for about three screens.",
	scroll: { pinned: true, length: 3 },
	interaction: ["scroll", "pointer", "keyboard"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
