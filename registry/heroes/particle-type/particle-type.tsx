import { fallbackGradient } from "@/lib/sharingan/webgpu";
import { HeroSection } from "@/lib/sharingan/react";
import { HeroCanvas } from "@/lib/sharingan/webgpu/react";
import type { RefObject } from "react";
import { createParticleType } from "./engine";
import { particleTypeExample } from "./example";
import { particleTypeConfigSchema, type ParticleTypeConfigInput, type ParticleTypeContent } from "./schema";

/** CSS shown before WebGPU starts, and instead of it when unavailable. */
export const particleTypeFallbackStyle = (config?: ParticleTypeConfigInput) => {
	const { colors, background } = particleTypeConfigSchema.parse(config ?? {});
	return fallbackGradient(colors, background);
};

export type ParticleTypeBackgroundProps = {
	config?: ParticleTypeConfigInput;
	hostRef?: RefObject<HTMLElement | null>;
	className?: string;
};

/** Only the particle layer, for people who bring their own hero layout. Place it in a positioned parent. */
export function ParticleTypeBackground({ config, hostRef, className }: ParticleTypeBackgroundProps) {
	return <HeroCanvas name="particle-type" create={createParticleType} config={config} fallbackStyle={particleTypeFallbackStyle} hostRef={hostRef} className={className} />;
}

export type ParticleTypeHeroProps = {
	content?: ParticleTypeContent;
	config?: ParticleTypeConfigInput;
	id?: string;
	className?: string;
};

/** Particle type (Sharingan). The headline, drawn in particles that scatter under the cursor. The real text stays in the DOM. */
export function ParticleTypeHero({ content = particleTypeExample, config, id, className }: ParticleTypeHeroProps) {
	return (
		<HeroSection
			id={id}
			className={className}
			content={content}
			background={(section) => <ParticleTypeBackground config={config} hostRef={section} className="sg-hero-layer" />}
		/>
	);
}
