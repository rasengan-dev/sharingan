export const meta = {
	name: "scroll-read",
	title: "Scroll read",
	kind: "section",
	engine: "dom",
	summary: "A large paragraph that darkens word by word as it is scrolled, with small images that grow inside the text.",
	useWhen: "A manifesto, a mission or a long promise that deserves to be read slowly, between two visual sections.",
	avoidWhen: "Short copy (under 15 words looks empty) or text people need to read before scrolling.",
	scroll: { pinned: false, length: 0 },
	interaction: ["scroll"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
