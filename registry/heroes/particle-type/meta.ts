export const meta = {
	name: "particle-type",
	title: "Particle type",
	summary: "The headline is drawn in thousands of particles that scatter under the cursor and spring back; the real text stays in the DOM.",
	useWhen: "A short, bold headline that is the brand: type foundries, creative studios, launches.",
	avoidWhen: "Headlines longer than five words, or text that must be read at a glance on small screens.",
	interaction: ["pointer", "idle"],
	gpu: { compute: true, cost: 2 },
	weight: { jsKb: 0 },
	status: "draft",
} as const;
