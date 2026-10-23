import { fallbackGradient } from "@/lib/sharingan";
import { HeroCanvas, HeroSection } from "@/lib/sharingan/react";
import type { RefObject } from "react";
import { createLiquidGlass } from "./engine";
import { liquidGlassExample } from "./example";
import { liquidGlassConfigSchema, type LiquidGlassConfigInput, type LiquidGlassContent } from "./schema";

/** CSS shown before WebGPU starts, and instead of it when unavailable: the screenshot, as a plain image. */
export const liquidGlassFallbackStyle = (config?: LiquidGlassConfigInput) => {
	const { colors, background, image } = liquidGlassConfigSchema.parse(config ?? {});
	const gradient = fallbackGradient(colors, background);
	return {
		...gradient,
		backgroundImage: `url("${image}"), ${gradient.backgroundImage}`,
		backgroundRepeat: "no-repeat",
		backgroundSize: "min(72%, 900px) auto, cover",
		backgroundPosition: "50% calc(100% + 18%), center",
	};
};

export type LiquidGlassBackgroundProps = {
	config?: LiquidGlassConfigInput;
	hostRef?: RefObject<HTMLElement | null>;
	className?: string;
};

/** Only the glass layer, for people who bring their own hero layout. Place it in a positioned parent. */
export function LiquidGlassBackground({ config, hostRef, className }: LiquidGlassBackgroundProps) {
	return <HeroCanvas name="liquid-glass" create={createLiquidGlass} config={config} fallbackStyle={liquidGlassFallbackStyle} hostRef={hostRef} className={className} />;
}

export type LiquidGlassHeroProps = {
	content?: LiquidGlassContent;
	config?: LiquidGlassConfigInput;
	id?: string;
	className?: string;
};

/**
 * Liquid glass (Sharingan). Drops of glass drift over the product
 * screenshot; one follows the cursor. The screenshot is drawn on the canvas,
 * so its description is given to screen readers here.
 */
export function LiquidGlassHero({ content = liquidGlassExample, config, id, className }: LiquidGlassHeroProps) {
	return (
		<HeroSection
			id={id}
			className={["min-h-[820px] items-start pt-32", className].filter(Boolean).join(" ")}
			content={content}
			background={(section) => <LiquidGlassBackground config={{ image: content.media.src, ...config }} hostRef={section} className="absolute inset-0 -z-10" />}
		>
			<p className="sr-only">{content.media.alt}</p>
		</HeroSection>
	);
}
