export const meta = {
	name: "liquid-glass",
	title: "Liquid glass",
	engine: "webgpu",
	summary: "Drops of glass drift over your product screenshot, bending and splitting the light under them; one follows the cursor.",
	useWhen: "A product with a strong screenshot that deserves a showcase moment, on a page that can afford a heavier hero.",
	avoidWhen: "No product visual yet, or pages that must stay light on low-end phones.",
	interaction: ["pointer", "idle"],
	gpu: { compute: false, cost: 3 },
	weight: { jsKb: 0 },
	status: "draft",
} as const;
