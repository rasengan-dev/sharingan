import { defineDomElement } from "@/lib/sharingan";
import { createImageMarquee } from "./engine";
import type { ImageMarqueeConfigInput } from "./schema";

/**
 * `<sg-image-marquee>`: Image marquee for any page, no framework. Its
 * children hold one or two `[data-sg-row]` elements (the second one
 * `aria-hidden`), each with a `[data-sg-track]` list of words and images.
 */
export function defineImageMarqueeElement(tag = "sg-image-marquee") {
	defineDomElement<ImageMarqueeConfigInput>({
		tag,
		attributes: { background: "string", ink: "string", rows: "number", distance: "number" },
		create: createImageMarquee,
	});
}
