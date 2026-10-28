import { defineDomElement } from "@/lib/sharingan";
import { createIsoDeck } from "./engine";
import type { IsoDeckConfigInput } from "./schema";

/**
 * `<sg-iso-deck>`: Iso deck for any page, no framework. Its children are the hero's copy; an
 * `a[data-sg-key]` among them becomes the deck's front key. The tooltip reads `data-tagline` and
 * `data-connected-label` on the element. The deck is drawn after the copy.
 */
export function defineIsoDeckElement(tag = "sg-iso-deck") {
	defineDomElement<IsoDeckConfigInput>({
		tag,
		attributes: {
			keys: "string",
			"wide-key": "string",
			rows: "number",
			knob: "boolean",
			screen: "boolean",
			cable: "string",
			accent: "string",
			"accent-alt": "string",
			loop: "boolean",
			keyboard: "boolean",
		},
		create: createIsoDeck,
	});
}
