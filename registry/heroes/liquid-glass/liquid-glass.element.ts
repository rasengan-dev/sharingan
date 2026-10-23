import { defineHeroElement } from "@/lib/sharingan";
import { createLiquidGlass } from "./engine";
import { liquidGlassFallbackStyle } from "./liquid-glass";
import type { LiquidGlassConfigInput } from "./schema";

/** `<sg-liquid-glass image="/shot.png">`: Liquid glass for any page, no framework. Describe the image in its content for screen readers. */
export function defineLiquidGlassElement(tag = "sg-liquid-glass") {
	defineHeroElement<LiquidGlassConfigInput>({
		tag,
		attributes: { colors: "colors", background: "string", image: "string", refraction: "number", drops: "number", pointer: "boolean", poster: "string" },
		create: createLiquidGlass,
		fallbackStyle: liquidGlassFallbackStyle,
	});
}
