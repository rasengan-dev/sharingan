import { defineHeroElement } from "@/lib/sharingan";
import { createInkFlow } from "./engine";
import { inkFlowFallbackStyle } from "./ink-flow";
import type { InkFlowConfigInput } from "./schema";

/**
 * `<sg-ink-flow>`: Ink flow for any page, no framework. Its children are the
 * hero's content and stay in the page's DOM; the ink is drawn behind them.
 *
 *   <sg-ink-flow colors="var(--brand), oklch(0.72 0.19 330)" swirl="30">
 *     <h1>Get paid before your morning coffee</h1>
 *   </sg-ink-flow>
 */
export function defineInkFlowElement(tag = "sg-ink-flow") {
	defineHeroElement<InkFlowConfigInput>({
		tag,
		attributes: {
			colors: "colors",
			background: "string",
			swirl: "number",
			"ink-fade": "number",
			"flow-fade": "number",
			ambient: "boolean",
			pointer: "boolean",
			calm: "number",
			detail: "string",
			poster: "string",
		},
		create: createInkFlow,
		fallbackStyle: inkFlowFallbackStyle,
	});
}
