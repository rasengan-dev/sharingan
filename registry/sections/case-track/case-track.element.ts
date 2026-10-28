import { defineDomElement } from "@/lib/sharingan";
import { createCaseTrack } from "./engine";
import type { CaseTrackConfigInput } from "./schema";

/**
 * `<sg-case-track>`: Case track for any page, no framework. Its children
 * hold a `[data-sg-stage]` with an optional `[data-sg-head]`, a
 * `[data-sg-track]` list of `[data-sg-card]` items and an optional
 * `[data-sg-foot]` with the arrows and the progress bar.
 */
export function defineCaseTrackElement(tag = "sg-case-track") {
	defineDomElement<CaseTrackConfigInput>({
		tag,
		attributes: { speed: "number", accent: "string", "accent-alt": "string" },
		create: createCaseTrack,
	});
}
