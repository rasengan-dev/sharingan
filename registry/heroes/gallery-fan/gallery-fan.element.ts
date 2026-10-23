import { defineDomElement } from "@/lib/sharingan";
import { createGalleryFan } from "./engine";
import type { GalleryFanConfigInput } from "./schema";

/**
 * `<sg-gallery-fan>`: Gallery fan for any page, no framework. Its children
 * hold the copy and a `[data-sg-fan]` with one `[data-sg-card]` per work (a
 * link or a focusable element with an image), and optional `[data-sg-cursor]`.
 */
export function defineGalleryFanElement(tag = "sg-gallery-fan") {
	defineDomElement<GalleryFanConfigInput>({
		tag,
		attributes: { spread: "number", angle: "number", depth: "number", colors: "colors", intro: "boolean", pointer: "boolean", cursors: "boolean" },
		create: createGalleryFan,
	});
}
