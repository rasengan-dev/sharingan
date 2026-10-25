import { defineDomElement } from "@/lib/sharingan";
import { createTrailMap } from "./engine";
import type { TrailMapConfigInput } from "./schema";

/**
 * `<sg-trail-map>`: Trail map for any page, no framework. Its children hold
 * the copy and a `[data-sg-visual]` with a `[data-sg-frame data-trail='…']`
 * around a `[data-sg-scene]` and its photo; see engine.ts for the optional parts.
 */
export function defineTrailMapElement(tag = "sg-trail-map") {
	defineDomElement<TrailMapConfigInput>({
		tag,
		attributes: { accent: "string", intro: "boolean", walker: "boolean", parallax: "boolean", clouds: "boolean" },
		create: createTrailMap,
	});
}
