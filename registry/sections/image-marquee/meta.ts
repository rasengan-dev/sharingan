export const meta = {
	name: "image-marquee",
	title: "Image marquee",
	kind: "section",
	engine: "dom",
	summary: "A coloured band of oversized words with images set between them, its rows pushed sideways by the scroll.",
	useWhen: "A loud break between calmer sections: a slogan, a list of disciplines, the names of what you sell.",
	avoidWhen: "Copy people must read to act: the rows move and repeat.",
	scroll: { pinned: false, length: 0 },
	interaction: ["scroll"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
