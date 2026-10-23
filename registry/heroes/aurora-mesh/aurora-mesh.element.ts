import { defineHeroElement } from "@/lib/sharingan/webgpu";
import { auroraMeshFallbackStyle } from "./aurora-mesh";
import { createAuroraMesh } from "./engine";
import type { AuroraMeshConfigInput } from "./schema";

/** `<sg-aurora-mesh>`: Aurora mesh for any page, no framework. Its children are the hero's content. */
export function defineAuroraMeshElement(tag = "sg-aurora-mesh") {
	defineHeroElement<AuroraMeshConfigInput>({
		tag,
		attributes: { colors: "colors", background: "string", speed: "number", intensity: "number", pointer: "boolean", calm: "number", poster: "string" },
		create: createAuroraMesh,
		fallbackStyle: auroraMeshFallbackStyle,
	});
}
