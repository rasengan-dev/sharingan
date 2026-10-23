import { defineHeroElement } from "@/lib/sharingan";
import { gravityFieldFallbackStyle } from "./gravity-field";
import { createGravityField } from "./engine";
import type { GravityFieldConfigInput } from "./schema";

/** `<sg-gravity-field>`: Gravity field for any page, no framework. Its children are the hero's content. */
export function defineGravityFieldElement(tag = "sg-gravity-field") {
	defineHeroElement<GravityFieldConfigInput>({
		tag,
		attributes: { colors: "colors", background: "string", gravity: "number", flow: "number", size: "number", pointer: "boolean", calm: "number", detail: "string", poster: "string" },
		create: createGravityField,
		fallbackStyle: gravityFieldFallbackStyle,
	});
}
