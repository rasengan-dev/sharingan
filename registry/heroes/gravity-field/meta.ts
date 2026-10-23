export const meta = {
	name: "gravity-field",
	title: "Gravity field",
	engine: "webgpu",
	summary: "A cloud of particles, coloured by speed, that falls toward the cursor and drifts along noise currents.",
	useWhen: "Data, analytics, infrastructure or AI products: many small things moving with intent.",
	avoidWhen: "Low-end mobile audiences first; use detail \"low\" there, or a lighter hero.",
	interaction: ["pointer", "idle"],
	gpu: { compute: true, cost: 2 },
	weight: { jsKb: 0 },
	status: "draft",
} as const;
