export const meta = {
	name: "portrait-burst",
	title: "Portrait burst",
	kind: "section",
	engine: "dom",
	summary: "A stack of portraits rises behind a centred headline, then bursts out into a constellation around it, with short facts set between the faces.",
	useWhen: "Introducing a team, speakers or a community: six to twelve people who matter more than any one of them.",
	avoidWhen: "One person to present, or portraits that need their names read at a glance (names show on hover only).",
	scroll: { pinned: true, length: 1.6 },
	interaction: ["scroll", "pointer"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
