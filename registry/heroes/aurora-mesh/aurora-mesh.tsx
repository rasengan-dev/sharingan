import { fallbackGradient } from "@/lib/sharingan";
import { HeroCanvas, HeroSection } from "@/lib/sharingan/react";
import type { RefObject } from "react";
import { createAuroraMesh } from "./engine";
import { auroraMeshExample } from "./example";
import { auroraMeshConfigSchema, type AuroraMeshConfigInput, type AuroraMeshContent } from "./schema";

/** CSS shown before WebGPU starts, and instead of it when unavailable. */
export const auroraMeshFallbackStyle = (config?: AuroraMeshConfigInput) => {
	const { colors, background } = auroraMeshConfigSchema.parse(config ?? {});
	return fallbackGradient(colors, background);
};

export type AuroraMeshBackgroundProps = {
	config?: AuroraMeshConfigInput;
	hostRef?: RefObject<HTMLElement | null>;
	className?: string;
};

/** Only the light layer, for people who bring their own hero layout. Place it in a positioned parent. */
export function AuroraMeshBackground({ config, hostRef, className }: AuroraMeshBackgroundProps) {
	return <HeroCanvas name="aurora-mesh" create={createAuroraMesh} config={config} fallbackStyle={auroraMeshFallbackStyle} hostRef={hostRef} className={className} />;
}

export type AuroraMeshHeroProps = {
	content?: AuroraMeshContent;
	config?: AuroraMeshConfigInput;
	id?: string;
	className?: string;
};

/** Aurora mesh (Sharingan). Slow bands of coloured light drift behind the headline. */
export function AuroraMeshHero({ content = auroraMeshExample, config, id, className }: AuroraMeshHeroProps) {
	return (
		<HeroSection
			id={id}
			className={className}
			content={content}
			background={(section) => <AuroraMeshBackground config={config} hostRef={section} className="absolute inset-0 -z-10" />}
		/>
	);
}
