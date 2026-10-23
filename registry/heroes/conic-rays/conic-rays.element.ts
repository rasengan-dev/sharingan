import { defineDomElement } from "@/lib/sharingan";
import { createConicRays } from "./engine";
import type { ConicRaysConfigInput } from "./schema";

/** `<sg-conic-rays>`: Conic rays for any page, no framework. Its children are the hero's copy; the light is added behind them. */
export function defineConicRaysElement(tag = "sg-conic-rays") {
	defineDomElement<ConicRaysConfigInput>({
		tag,
		attributes: { colors: "colors", rays: "number", spread: "number", speed: "number", origin: "string", intensity: "number", pointer: "boolean", calm: "number" },
		create: createConicRays,
	});
}
