export const meta = {
	name: "terminal-boot",
	title: "Terminal boot",
	engine: "dom",
	summary: "A terminal types your install command, prints its output line by line, and your product rises from it when it is done. The command can be copied.",
	useWhen: "Developer tools, CLIs, SDKs and frameworks: products whose first step really is a command.",
	avoidWhen: "Audiences who never open a terminal; there the command reads as noise, not a promise.",
	interaction: ["idle", "pointer"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
