export const meta = {
	name: "reaction-diffusion",
	title: "Reaction-diffusion",
	engine: "webgpu",
	summary: "A living Gray-Scott pattern grows across the hero, steers around the headline, and sprouts where the cursor passes.",
	useWhen: "Biotech, materials, climate or generative-design brands: something organic that keeps growing.",
	avoidWhen: "Tight, corporate layouts; the pattern is busy by nature.",
	interaction: ["pointer", "idle"],
	gpu: { compute: true, cost: 2 },
	weight: { jsKb: 0 },
	status: "draft",
} as const;
