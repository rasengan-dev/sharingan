import { fallbackGradient } from "@/lib/sharingan/webgpu";
import { HeroSection } from "@/lib/sharingan/react";
import { HeroCanvas } from "@/lib/sharingan/webgpu/react";
import type { RefObject } from "react";
import { createInkFlow } from "./engine";
import { inkFlowExample } from "./example";
import { inkFlowConfigSchema, type InkFlowConfigInput, type InkFlowContent } from "./schema";

/** CSS shown before WebGPU starts, and instead of it when unavailable. */
export const inkFlowFallbackStyle = (config?: InkFlowConfigInput) => {
	const { colors, background } = inkFlowConfigSchema.parse(config ?? {});
	return fallbackGradient(colors, background);
};

export type InkFlowBackgroundProps = {
	config?: InkFlowConfigInput;
	/** The element the pointer is followed over. Defaults to the background's parent. */
	hostRef?: RefObject<HTMLElement | null>;
	className?: string;
};

/** Only the ink layer, for people who bring their own hero layout. Place it in a positioned parent. */
export function InkFlowBackground({ config, hostRef, className }: InkFlowBackgroundProps) {
	return <HeroCanvas name="ink-flow" create={createInkFlow} config={config} fallbackStyle={inkFlowFallbackStyle} hostRef={hostRef} className={className} />;
}

export type InkFlowHeroProps = {
	content?: InkFlowContent;
	config?: InkFlowConfigInput;
	id?: string;
	className?: string;
};

/**
 * Ink flow (Sharingan). Brand-coloured ink swirls behind the headline and
 * follows the cursor. The text and buttons are ordinary DOM over the canvas.
 */
export function InkFlowHero({ content = inkFlowExample, config, id, className }: InkFlowHeroProps) {
	return (
		<HeroSection
			id={id}
			className={className}
			content={content}
			background={(section) => <InkFlowBackground config={config} hostRef={section} className="absolute inset-0 -z-10" />}
		/>
	);
}
