import { defineDomElement } from "@/lib/sharingan";
import { createMarqueeType } from "./engine";
import type { MarqueeTypeConfigInput } from "./schema";

/**
 * `<sg-marquee-type>`: Marquee type for any page, no framework. Its children
 * hold the copy and a `[data-sg-rows]` with one `[data-sg-row]` per row,
 * each holding a `<ul>` of words.
 */
export function defineMarqueeTypeElement(tag = "sg-marquee-type") {
	defineDomElement<MarqueeTypeConfigInput>({
		tag,
		attributes: { speed: "number", direction: "string", look: "string", tilt: "number", accent: "string", separator: "string", pointer: "boolean", scroll: "boolean" },
		create: createMarqueeType,
	});
}
