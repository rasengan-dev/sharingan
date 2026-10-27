export const meta = {
	name: "pinned-reveal",
	title: "Pinned reveal",
	kind: "section",
	engine: "dom",
	summary: "A headline stays pinned and darkens while a rounded image rises under it and grows to the full width.",
	useWhen: "One strong wide image that deserves the whole screen: a place, a product in use, an event.",
	avoidWhen: "Images that must be seen whole from the start, or portrait images (it is built for wide ones).",
	scroll: { pinned: true, length: 1.2 },
	interaction: ["scroll"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
