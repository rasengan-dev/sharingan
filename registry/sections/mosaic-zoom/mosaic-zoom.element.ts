import { defineDomElement } from "@/lib/sharingan";
import { createMosaicZoom } from "./engine";
import type { MosaicZoomConfigInput } from "./schema";

/**
 * `<sg-mosaic-zoom>`: Mosaic zoom for any page, no framework. Its children
 * hold an optional `[data-sg-head]` and a `[data-sg-stage]` with a
 * `[data-sg-mosaic]` list: one `[data-sg-feature]` and the `[data-sg-tile]` items.
 */
export function defineMosaicZoomElement(tag = "sg-mosaic-zoom") {
	defineDomElement<MosaicZoomConfigInput>({
		tag,
		attributes: { length: "number", spread: "number" },
		create: createMosaicZoom,
	});
}
