import { defineHeroElement } from "@/lib/sharingan/webgpu";
import { particleTypeFallbackStyle } from "./particle-type";
import { createParticleType } from "./engine";
import type { ParticleTypeConfigInput } from "./schema";

/** `<sg-particle-type>`: Particle type for any page, no framework. Its children are the hero's content. */
export function defineParticleTypeElement(tag = "sg-particle-type") {
	defineHeroElement<ParticleTypeConfigInput>({
		tag,
		attributes: { colors: "colors", background: "string", scatter: "number", spring: "number", gap: "number", size: "number", pointer: "boolean", poster: "string" },
		create: createParticleType,
		fallbackStyle: particleTypeFallbackStyle,
	});
}
