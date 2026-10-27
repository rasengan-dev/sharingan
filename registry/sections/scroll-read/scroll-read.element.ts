import { defineDomElement } from "@/lib/sharingan";
import { createScrollRead } from "./engine";
import type { ScrollReadConfigInput } from "./schema";

/**
 * `<sg-scroll-read>`: Scroll read for any page, no framework. Its children
 * hold a `[data-sg-read]` paragraph of plain text, with `<img>` elements
 * placed inside it where the images go.
 */
export function defineScrollReadElement(tag = "sg-scroll-read") {
	defineDomElement<ScrollReadConfigInput>({
		tag,
		attributes: { from: "number", pop: "boolean" },
		create: createScrollRead,
	});
}
