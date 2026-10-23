import type { DomHero } from "@/lib/sharingan";
import { useEffect, useRef } from "react";
import { createBeamGrid } from "./engine";
import { beamGridExample } from "./example";
import type { BeamGridConfigInput, BeamGridContent } from "./schema";
import { BEAM_GRID_STYLE_ID, beamGridStyles } from "./styles";

export type BeamGridHeroProps = {
	content?: BeamGridContent;
	config?: BeamGridConfigInput;
	id?: string;
	className?: string;
};

/**
 * Beam grid (Sharingan, DOM engine). Beams of light run along a fine grid
 * behind the headline; it brightens around the pointer, and a click sends
 * four beams from the nearest crossing.
 */
export function BeamGridHero({ content = beamGridExample, config, id = "hero", className }: BeamGridHeroProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<DomHero<BeamGridConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the hero.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createBeamGrid({ host: section.current, config: JSON.parse(configKey) });
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
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="beam-grid" className={["sg-bm", className].filter(Boolean).join(" ")}>
			<style href={BEAM_GRID_STYLE_ID} precedence="default">
				{beamGridStyles}
			</style>
			<div className="sg-bm-layer" data-sg-layer="" aria-hidden="true">
				<div className="sg-bm-grid" />
			</div>
			<div className="sg-bm-copy">
				{content.eyebrow && <p className="sg-bm-eyebrow">{content.eyebrow}</p>}
				<h1 id={`${id}-title`}>{content.headline}</h1>
				{content.subheadline && <p>{content.subheadline}</p>}
				{(content.primaryCta || content.secondaryCta) && (
					<div className="sg-bm-ctas">
						{content.primaryCta && (
							<a className="sg-bm-cta" href={content.primaryCta.href}>
								{content.primaryCta.label}
							</a>
						)}
						{content.secondaryCta && (
							<a className="sg-bm-cta" data-variant="secondary" href={content.secondaryCta.href}>
								{content.secondaryCta.label}
							</a>
						)}
					</div>
				)}
			</div>
		</section>
	);
}
