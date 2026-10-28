import { defineDomElement } from "@/lib/sharingan";
import { createPortraitBurst } from "./engine";
import type { PortraitBurstConfigInput } from "./schema";

/**
 * `<sg-portrait-burst>`: Portrait burst for any page, no framework. Its
 * children hold a `[data-sg-stage]` with a `[data-sg-head]`, a list of
 * `[data-sg-person]` portraits and an optional list of `[data-sg-pill]` facts.
 */
export function definePortraitBurstElement(tag = "sg-portrait-burst") {
	defineDomElement<PortraitBurstConfigInput>({
		tag,
		attributes: { length: "number", drift: "number", tilt: "number", accent: "string" },
		create: createPortraitBurst,
	});
}
