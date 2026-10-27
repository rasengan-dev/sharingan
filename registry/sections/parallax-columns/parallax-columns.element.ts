import { defineDomElement } from "@/lib/sharingan";
import { createParallaxColumns } from "./engine";
import type { ParallaxColumnsConfigInput } from "./schema";

/**
 * `<sg-parallax-columns>`: Parallax columns for any page, no framework. Its
 * children hold a `[data-sg-grid]` with two `[data-sg-column]` elements of
 * `[data-sg-card]` items, each photo inside a `[data-sg-media]`.
 */
export function defineParallaxColumnsElement(tag = "sg-parallax-columns") {
	defineDomElement<ParallaxColumnsConfigInput>({
		tag,
		attributes: { speed: "number", depth: "boolean" },
		create: createParallaxColumns,
	});
}
