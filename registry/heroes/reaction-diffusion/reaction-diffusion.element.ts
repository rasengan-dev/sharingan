import { defineHeroElement } from "@/lib/sharingan";
import { reactionDiffusionFallbackStyle } from "./reaction-diffusion";
import { createReactionDiffusion } from "./engine";
import type { ReactionDiffusionConfigInput } from "./schema";

/** `<sg-reaction-diffusion>`: Reaction-diffusion for any page, no framework. Its children are the hero's content. */
export function defineReactionDiffusionElement(tag = "sg-reaction-diffusion") {
	defineHeroElement<ReactionDiffusionConfigInput>({
		tag,
		attributes: { colors: "colors", background: "string", pattern: "string", speed: "number", pointer: "boolean", calm: "number", detail: "string", poster: "string" },
		create: createReactionDiffusion,
		fallbackStyle: reactionDiffusionFallbackStyle,
	});
}
