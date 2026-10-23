import { defineDomElement } from "@/lib/sharingan";
import { createTerminalBoot } from "./engine";
import type { TerminalBootConfigInput } from "./schema";

/**
 * `<sg-terminal-boot>`: Terminal boot for any page, no framework. Its
 * children hold the transcript: a `[data-sg-command]`, `[data-sg-line]`
 * rows (each with a `[data-sg-icon]`), an optional `[data-sg-done]`, a
 * `[data-sg-actions]` slot for the buttons and an optional `[data-sg-product]`.
 */
export function defineTerminalBootElement(tag = "sg-terminal-boot") {
	defineDomElement<TerminalBootConfigInput>({
		tag,
		attributes: { speed: "number", accent: "string", loop: "boolean", copy: "boolean" },
		create: createTerminalBoot,
	});
}
