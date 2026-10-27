export const meta = {
	name: "parallax-columns",
	title: "Parallax columns",
	kind: "section",
	engine: "dom",
	summary: "A staggered two-column grid of cards whose columns travel at different speeds as the page scrolls.",
	useWhen: "Four to eight stories, features or works of equal weight that read well as a magazine spread.",
	avoidWhen: "Cards that must be compared side by side in order (the columns drift apart).",
	scroll: { pinned: false, length: 0 },
	interaction: ["scroll"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
