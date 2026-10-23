import { defineDomElement } from "@/lib/sharingan";
import { createBeamGrid } from "./engine";
import type { BeamGridConfigInput } from "./schema";

/** `<sg-beam-grid>`: Beam grid for any page, no framework. Its children are the hero's copy; the grid is added behind them. */
export function defineBeamGridElement(tag = "sg-beam-grid") {
	defineDomElement<BeamGridConfigInput>({
		tag,
		attributes: { colors: "colors", cell: "number", beams: "number", speed: "number", length: "number", pointer: "boolean", calm: "number" },
		create: createBeamGrid,
	});
}
