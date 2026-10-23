export const meta = {
	name: "holo-card",
	title: "Holo card",
	engine: "dom",
	summary: "A card with a holographic foil that leans toward the cursor (or the phone's tilt) and turns over to show its back: a badge, a pass, a membership.",
	useWhen: "Events, memberships, fintech and launches where the product is something people hold: a pass, a badge, a card.",
	avoidWhen: "Products with nothing card-like to show, or pages that already have a heavy visual next to the headline.",
	interaction: ["pointer", "gyroscope", "keyboard", "idle"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
