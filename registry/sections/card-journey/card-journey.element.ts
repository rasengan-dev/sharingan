import { defineDomElement } from "@/lib/sharingan";
import { createCardJourney } from "./engine";
import type { CardJourneyConfigInput } from "./schema";

/**
 * `<sg-card-journey>`: Card journey for any page, no framework. Its children
 * hold a `[data-sg-statement]` paragraph, an optional `[data-sg-aside]` note,
 * and a `[data-sg-grid]` with `[data-sg-copy]` and a `[data-sg-panel]` of
 * `[data-sg-card]` items (and optional `[data-sg-tab]` buttons).
 */
export function defineCardJourneyElement(tag = "sg-card-journey") {
	defineDomElement<CardJourneyConfigInput>({
		tag,
		attributes: { length: "number", tilt: "number", shuffle: "boolean", accent: "string" },
		create: createCardJourney,
	});
}
