import { defineDomElement } from "@/lib/sharingan";
import { createSplitWord } from "./engine";
import type { SplitWordConfigInput } from "./schema";

/**
 * `<sg-split-word>`: Split word for any page, no framework. Its children
 * hold a `[data-sg-stage]` with a `[data-sg-line]` (two `[data-sg-half]`
 * elements around a `[data-sg-card]`; their letters are split here) and an
 * optional `[data-sg-below]`.
 */
export function defineSplitWordElement(tag = "sg-split-word") {
	defineDomElement<SplitWordConfigInput>({
		tag,
		attributes: { length: "number", spread: "number", tilt: "number", accent: "string" },
		create: createSplitWord,
	});
}
