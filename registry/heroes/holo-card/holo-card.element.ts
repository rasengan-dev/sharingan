import { defineDomElement } from "@/lib/sharingan";
import { createHoloCard } from "./engine";
import type { HoloCardConfigInput } from "./schema";

/**
 * `<sg-holo-card>`: Holo card for any page, no framework. Its children hold
 * the copy and a `[data-sg-card]` with a `[data-sg-front]` and an optional
 * `[data-sg-back]`; the foil and the turn-over button are added.
 */
export function defineHoloCardElement(tag = "sg-holo-card") {
	defineDomElement<HoloCardConfigInput>({
		tag,
		attributes: { colors: "colors", surface: "string", pattern: "string", tilt: "boolean", gyro: "boolean", flip: "boolean" },
		create: createHoloCard,
	});
}
