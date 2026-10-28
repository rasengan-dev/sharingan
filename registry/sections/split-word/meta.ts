export const meta = {
	name: "split-word",
	title: "Split word",
	kind: "section",
	engine: "dom",
	summary: "A giant word pulls its letters together, then parts at one letter so a card can rise into the gap; a contact form fades in below.",
	useWhen: "The last block of a page: a contact, a sign-up or a newsletter, under a word short enough to set very large.",
	avoidWhen: "Long words or sentences, or a form that is the page's main job (it waits for the word to settle).",
	scroll: { pinned: true, length: 1.5 },
	interaction: ["scroll"],
	weight: { jsKb: 0 },
	status: "draft",
} as const;
