export const meta = {
	name: "split-headline",
	title: "Split headline",
	engine: "dom",
	summary: "The headline assembles letter by letter, then the letters near the pointer thicken, lift and take your accent colour.",
	useWhen: "Short, confident headlines: type foundries, studios, launches where the words are the product.",
	avoidWhen: "Long headlines (more than about 40 letters) or languages that do not split into letters, such as scripts with complex shaping.",
	interaction: ["pointer", "idle"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
