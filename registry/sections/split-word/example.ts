import type { SplitWordContent } from "./schema";

/** Upwind's contact block. The address, phone and email are made up. */
export const splitWordExample: SplitWordContent = {
	eyebrow: "Contact",
	word: "Contact us",
	split: 3,
	card: { title: "Upwind studio", lines: ["(555) 014-2290", "hello@upwind.example", "48 Harbour Lane, Lisbon"], href: "mailto:hello@upwind.example" },
	form: { action: "#contact", submit: "Send" },
};
