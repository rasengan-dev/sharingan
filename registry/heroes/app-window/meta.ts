export const meta = {
	name: "app-window",
	title: "App window",
	engine: "dom",
	summary: "Your product's screen, drawn in HTML, builds itself panel by panel (numbers count up, the chart draws), then leans toward the pointer in light 3D.",
	useWhen: "SaaS and dashboards: when the product screen is the promise and a static screenshot feels flat.",
	avoidWhen: "Products whose interface is not a dashboard-like screen, or when a real screenshot must show exact, current UI.",
	interaction: ["pointer", "idle"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
