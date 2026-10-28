export const meta = {
	name: "case-track",
	title: "Case track",
	kind: "section",
	engine: "dom",
	summary: "A row of case cards, the first wider with its story, moves sideways as the page scrolls, with a progress bar and arrows; on phones it is a row you swipe.",
	useWhen: "Four to eight case studies, articles or products that read as a series: agencies, studios, editorial pages.",
	avoidWhen: "Items that must all be seen at once to compare them, or a single case.",
	scroll: { pinned: true, length: 1.5 },
	interaction: ["scroll", "pointer", "keyboard", "touch"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
