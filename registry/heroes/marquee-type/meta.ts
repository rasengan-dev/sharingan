export const meta = {
	name: "marquee-type",
	title: "Marquee type",
	engine: "dom",
	summary: "Oversized words slide in opposite rows under the headline; a row slows under the pointer and scrolling pushes them faster.",
	useWhen: "Studios, agencies, festivals and brands with a short list to shout: services, places, values, lineups.",
	avoidWhen: "Calm or premium pages, and long phrases: words longer than two or three syllables read poorly at speed.",
	interaction: ["pointer", "scroll", "idle"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
