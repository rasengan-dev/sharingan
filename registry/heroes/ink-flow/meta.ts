export const meta = {
	name: "ink-flow",
	title: "Ink flow",
	summary: "Brand-coloured ink that swirls behind the headline and follows the cursor: a fluid simulation in compute passes.",
	useWhen: "A bold first screen for a product with a strong brand colour; the ink carries the identity.",
	avoidWhen: "Pages where the hero must stay perfectly still, or a headline longer than two lines.",
	interaction: ["pointer", "idle"],
	gpu: { compute: true, cost: 2 },
	weight: { jsKb: 0 },
	status: "draft",
} as const;
