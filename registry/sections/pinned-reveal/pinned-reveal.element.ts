import { defineDomElement } from "@/lib/sharingan";
import { createPinnedReveal } from "./engine";
import type { PinnedRevealConfigInput } from "./schema";

/**
 * `<sg-pinned-reveal>`: Pinned reveal for any page, no framework. Its children
 * hold a `[data-sg-headline]` (inside an optional `[data-sg-head]`) and a
 * `[data-sg-frame]` with the image and an optional `[data-sg-caption]`.
 */
export function definePinnedRevealElement(tag = "sg-pinned-reveal") {
	defineDomElement<PinnedRevealConfigInput>({
		tag,
		attributes: { length: "number", start: "number", radius: "number", parallax: "boolean" },
		create: createPinnedReveal,
	});
}
