import { defineDomElement } from "@/lib/sharingan";
import { createBentoAssemble } from "./engine";
import type { BentoAssembleConfigInput } from "./schema";

/**
 * `<sg-bento-assemble>`: Bento assemble for any page, no framework. Its
 * children hold an optional `[data-sg-head]` (with a `[data-sg-badge]` link)
 * and a `[data-sg-grid]` of `[data-sg-tile]` items, their figures in `[data-sg-count]`.
 */
export function defineBentoAssembleElement(tag = "sg-bento-assemble") {
	defineDomElement<BentoAssembleConfigInput>({
		tag,
		attributes: { length: "number", spread: "number", count: "boolean", accent: "string", "accent-alt": "string" },
		create: createBentoAssemble,
	});
}
