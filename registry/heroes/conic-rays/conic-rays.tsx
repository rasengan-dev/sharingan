import type { DomHero } from "@/lib/sharingan";
import { useEffect, useRef } from "react";
import { createConicRays } from "./engine";
import { conicRaysExample } from "./example";
import type { ConicRaysConfigInput, ConicRaysContent } from "./schema";
import { CONIC_RAYS_STYLE_ID, conicRaysStyles } from "./styles";

export type ConicRaysHeroProps = {
	content?: ConicRaysContent;
	config?: ConicRaysConfigInput;
	id?: string;
	className?: string;
};

/**
 * Conic rays (Sharingan, DOM engine). Soft rays of coloured light turn
 * slowly from above the headline and lean toward the pointer. The universal
 * counterpart of `aurora-mesh`: CSS only, every browser.
 */
export function ConicRaysHero({ content = conicRaysExample, config, id = "hero", className }: ConicRaysHeroProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<DomHero<ConicRaysConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the hero.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createConicRays({ host: section.current, config: JSON.parse(configKey) });
		return () => {
			engine.current?.destroy();
			engine.current = null;
		};
		// The engine starts once; config changes go through setConfig below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		engine.current?.setConfig(JSON.parse(configKey));
	}, [configKey]);

	return (
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="conic-rays" className={["sg-cr", className].filter(Boolean).join(" ")}>
			<style href={CONIC_RAYS_STYLE_ID} precedence="default">
				{conicRaysStyles}
			</style>
			<div className="sg-cr-layer" data-sg-layer="" aria-hidden="true">
				<div className="sg-cr-source">
					<div className="sg-cr-rays" />
					<div className="sg-cr-rays" />
					<div className="sg-cr-rays" />
				</div>
				<div className="sg-cr-grain" />
			</div>
			<div className="sg-cr-copy">
				{content.eyebrow && <p className="sg-cr-eyebrow">{content.eyebrow}</p>}
				<h1 id={`${id}-title`}>{content.headline}</h1>
				{content.subheadline && <p>{content.subheadline}</p>}
				{(content.primaryCta || content.secondaryCta) && (
					<div className="sg-cr-ctas">
						{content.primaryCta && (
							<a className="sg-cr-cta" href={content.primaryCta.href}>
								{content.primaryCta.label}
							</a>
						)}
						{content.secondaryCta && (
							<a className="sg-cr-cta" data-variant="secondary" href={content.secondaryCta.href}>
								{content.secondaryCta.label}
							</a>
						)}
					</div>
				)}
			</div>
		</section>
	);
}
