import { fallbackGradient } from "@/lib/sharingan";
import { HeroCanvas, HeroSection } from "@/lib/sharingan/react";
import type { RefObject } from "react";
import { createGravityField } from "./engine";
import { gravityFieldExample } from "./example";
import { gravityFieldConfigSchema, type GravityFieldConfigInput, type GravityFieldContent } from "./schema";

/** CSS shown before WebGPU starts, and instead of it when unavailable. */
export const gravityFieldFallbackStyle = (config?: GravityFieldConfigInput) => {
	const { colors, background } = gravityFieldConfigSchema.parse(config ?? {});
	return fallbackGradient(colors, background);
};

export type GravityFieldBackgroundProps = {
	config?: GravityFieldConfigInput;
	hostRef?: RefObject<HTMLElement | null>;
	className?: string;
};

/** Only the particle layer, for people who bring their own hero layout. Place it in a positioned parent. */
export function GravityFieldBackground({ config, hostRef, className }: GravityFieldBackgroundProps) {
	return <HeroCanvas name="gravity-field" create={createGravityField} config={config} fallbackStyle={gravityFieldFallbackStyle} hostRef={hostRef} className={className} />;
}

export type GravityFieldHeroProps = {
	content?: GravityFieldContent;
	config?: GravityFieldConfigInput;
	id?: string;
	className?: string;
};

/** Gravity field (Sharingan). A cloud of particles falls toward the cursor and drifts along noise currents. */
export function GravityFieldHero({ content = gravityFieldExample, config, id, className }: GravityFieldHeroProps) {
	return (
		<HeroSection
			id={id}
			className={className}
			content={content}
			background={(section) => <GravityFieldBackground config={config} hostRef={section} className="absolute inset-0 -z-10" />}
		/>
	);
}
