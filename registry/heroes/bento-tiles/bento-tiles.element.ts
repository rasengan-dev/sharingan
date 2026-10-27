import { defineDomElement } from "@/lib/sharingan";
import { createBentoTiles } from "./engine";
import type { BentoTilesConfigInput } from "./schema";

/**
 * `<sg-bento-tiles>`: Bento tiles for any page, no framework. Its children
 * hold the copy (an optional `[data-sg-nav]`, an `h1`) and a `[data-sg-bento]`
 * with the six `[data-sg-card]`; see engine.ts for what each card holds.
 */
export function defineBentoTilesElement(tag = "sg-bento-tiles") {
	defineDomElement<BentoTilesConfigInput>({
		tag,
		attributes: {
			accent: "string",
			marks: "string",
			gradient: "colors",
			tiles: "boolean",
			"tile-size": "number",
			pointer: "boolean",
			idle: "boolean",
			intro: "boolean",
			"show-nav": "boolean",
		},
		create: createBentoTiles,
	});
}
