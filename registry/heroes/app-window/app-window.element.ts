import { defineDomElement } from "@/lib/sharingan";
import { createAppWindow } from "./engine";
import type { AppWindowConfigInput } from "./schema";

/**
 * `<sg-app-window>`: App window for any page, no framework. Its children
 * hold the copy and a `[data-sg-window]` made of `[data-sg-panel]` parts; a
 * `[data-sg-chart]` with `data-points` is drawn for you.
 */
export function defineAppWindowElement(tag = "sg-app-window") {
	defineDomElement<AppWindowConfigInput>({
		tag,
		attributes: { accent: "string", stagger: "number", tilt: "boolean", "count-up": "boolean" },
		create: createAppWindow,
	});
}
