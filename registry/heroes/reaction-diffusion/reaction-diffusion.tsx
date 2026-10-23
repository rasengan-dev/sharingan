import { fallbackGradient } from "@/lib/sharingan/webgpu";
import { HeroSection } from "@/lib/sharingan/react";
import { HeroCanvas } from "@/lib/sharingan/webgpu/react";
import type { RefObject } from "react";
import { createReactionDiffusion } from "./engine";
import { reactionDiffusionExample } from "./example";
import { reactionDiffusionConfigSchema, type ReactionDiffusionConfigInput, type ReactionDiffusionContent } from "./schema";

/** CSS shown before WebGPU starts, and instead of it when unavailable. */
export const reactionDiffusionFallbackStyle = (config?: ReactionDiffusionConfigInput) => {
	const { colors, background } = reactionDiffusionConfigSchema.parse(config ?? {});
	return fallbackGradient(colors, background);
};

export type ReactionDiffusionBackgroundProps = {
	config?: ReactionDiffusionConfigInput;
	hostRef?: RefObject<HTMLElement | null>;
	className?: string;
};

/** Only the pattern layer, for people who bring their own hero layout. Place it in a positioned parent. */
export function ReactionDiffusionBackground({ config, hostRef, className }: ReactionDiffusionBackgroundProps) {
	return <HeroCanvas name="reaction-diffusion" create={createReactionDiffusion} config={config} fallbackStyle={reactionDiffusionFallbackStyle} hostRef={hostRef} className={className} />;
}

export type ReactionDiffusionHeroProps = {
	content?: ReactionDiffusionContent;
	config?: ReactionDiffusionConfigInput;
	id?: string;
	className?: string;
};

/** Reaction-diffusion (Sharingan). A living pattern grows across the hero and steers around the headline. */
export function ReactionDiffusionHero({ content = reactionDiffusionExample, config, id, className }: ReactionDiffusionHeroProps) {
	return (
		<HeroSection
			id={id}
			className={className}
			content={content}
			background={(section) => <ReactionDiffusionBackground config={config} hostRef={section} className="sg-hero-layer" />}
		/>
	);
}
