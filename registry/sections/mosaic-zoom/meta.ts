export const meta = {
	name: "mosaic-zoom",
	title: "Mosaic zoom",
	kind: "section",
	engine: "dom",
	summary: "One image fills the screen, then shrinks back into its place at the heart of a mosaic while the other tiles gather around it.",
	useWhen: "A featured person or work among many: an artist of the month, a community, a catalogue with a hero piece.",
	avoidWhen: "Fewer than eight images, or tiles that need captions to make sense.",
	scroll: { pinned: true, length: 1.6 },
	interaction: ["scroll"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
