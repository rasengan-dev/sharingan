import { defineDomElement } from "@/lib/sharingan";
import { createCurveReel } from "./engine";
import type { CurveReelConfigInput } from "./schema";

/**
 * `<sg-curve-reel>`: Curve reel for any page, no framework. Its children
 * hold the copy, a `[data-sg-reel]` with one `[data-sg-card]` per project (a
 * link or a focusable element with an image), and optional `[data-sg-step]`.
 */
export function defineCurveReelElement(tag = "sg-curve-reel") {
	defineDomElement<CurveReelConfigInput>({
		tag,
		attributes: { curvature: "number", speed: "number", visible: "number", drag: "boolean", tilt: "number", accent: "string", steps: "boolean", intro: "boolean" },
		create: createCurveReel,
	});
}
