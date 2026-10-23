import { inkFlowConfigSchema, type InkFlowConfigInput } from "./schema";

/**
 * What shows without WebGPU (and before it starts): a gradient drawn by CSS
 * from the same colours as the ink, under the poster if there is one.
 * Shared by the React component and the Web Component.
 */
export function inkFlowFallbackStyle(config?: InkFlowConfigInput) {
	const { colors, background } = inkFlowConfigSchema.parse(config ?? {});
	const [a, b = a, c = b] = colors;
	return {
		backgroundColor: background,
		backgroundImage: [
			`radial-gradient(45% 55% at 22% 30%, color-mix(in oklab, ${a} 55%, transparent), transparent)`,
			`radial-gradient(40% 50% at 80% 65%, color-mix(in oklab, ${b} 45%, transparent), transparent)`,
			`radial-gradient(35% 40% at 55% 95%, color-mix(in oklab, ${c} 40%, transparent), transparent)`,
		].join(", "),
	};
}
