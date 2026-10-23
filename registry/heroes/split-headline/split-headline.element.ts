import { defineDomElement } from "@/lib/sharingan";
import { createSplitHeadline } from "./engine";
import type { SplitHeadlineConfigInput } from "./schema";

/**
 * `<sg-split-headline>`: Split headline for any page, no framework. Mark the
 * heading among its children with `data-sg-split`, and what should follow it
 * in (subheadline, buttons) with `data-sg-after`.
 */
export function defineSplitHeadlineElement(tag = "sg-split-headline") {
	defineDomElement<SplitHeadlineConfigInput>({
		tag,
		attributes: { intro: "string", stagger: "number", accent: "string", radius: "number", strength: "number", pointer: "boolean", idle: "boolean" },
		create: createSplitHeadline,
	});
}
