import { defineDomElement } from "@/lib/sharingan";
import { createGamepad } from "./engine";
import type { GamepadConfigInput } from "./schema";

/**
 * `<sg-gamepad>`: Gamepad for any page, no framework. Its children are the
 * sections: one `data-sg-slide="home"`, then up to four
 * `data-sg-slide data-label="…"`. `data-wordmark` and `data-collaborators`
 * name the controller and the cursors.
 */
export function defineGamepadElement(tag = "sg-gamepad") {
	defineDomElement<GamepadConfigInput>({
		tag,
		attributes: { colors: "colors", shell: "string", tilt: "boolean", keyboard: "boolean", gamepad: "boolean", "easter-egg": "boolean" },
		create: createGamepad,
	});
}
