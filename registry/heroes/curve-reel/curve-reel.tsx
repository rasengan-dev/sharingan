import type { DomHero } from "@/lib/sharingan";
import { useEffect, useRef } from "react";
import { createCurveReel } from "./engine";
import { curveReelExample } from "./example";
import type { CurveReelConfigInput, CurveReelContent } from "./schema";
import { CURVE_REEL_STYLE_ID, curveReelStyles } from "./styles";

export type CurveReelHeroProps = {
	content?: CurveReelContent;
	config?: CurveReelConfigInput;
	id?: string;
	className?: string;
};

/**
 * Curve reel (Sharingan, DOM engine). A full-screen hero: the headline, a
 * reel of project cards on the inside of a curved wall that turns slowly,
 * and numbered steps that light up as the cards pass. Every project is a
 * real image with its description.
 */
export function CurveReelHero({ content = curveReelExample, config, id = "hero", className }: CurveReelHeroProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<DomHero<CurveReelConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the hero.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createCurveReel({ host: section.current, config: JSON.parse(configKey) });
		return () => {
			engine.current?.destroy();
			engine.current = null;
		};
		// The engine starts once per content; config changes go through setConfig below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [content]);

	useEffect(() => {
		engine.current?.setConfig(JSON.parse(configKey));
	}, [configKey]);

	return (
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="curve-reel" className={["sg-cr", className].filter(Boolean).join(" ")}>
			<style href={CURVE_REEL_STYLE_ID} precedence="default">
				{curveReelStyles}
			</style>
			{content.eyebrow && <p className="sg-cr-eyebrow">{content.eyebrow}</p>}
			<h1 id={`${id}-title`}>{content.headline}</h1>
			{content.subheadline && <p className="sg-cr-sub">{content.subheadline}</p>}
			{content.cta && (
				<a className="sg-cr-cta" href={content.cta.href}>
					{content.cta.label}
					<span className="sg-cr-cta-arrow" aria-hidden="true">
						<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
							<path d="M3 8h10M9 4l4 4-4 4" />
						</svg>
					</span>
				</a>
			)}

			<div className="sg-cr-reel" data-sg-reel="" role="list" aria-label="Projects">
				{content.projects.map((project) => {
					const inner = (
						<>
							<img src={project.src} alt={project.alt} loading="eager" draggable={false} />
							<span className="sg-cr-caption" aria-hidden="true">
								{project.title}
							</span>
						</>
					);
					return project.href ? (
						<a key={project.src} role="listitem" className="sg-cr-card" data-sg-card="" href={project.href} aria-label={project.title}>
							{inner}
						</a>
					) : (
						<div key={project.src} role="listitem" tabIndex={0} className="sg-cr-card" data-sg-card="" aria-label={project.title}>
							{inner}
						</div>
					);
				})}
			</div>

			{content.steps && content.steps.length > 0 && (
				<ol className="sg-cr-steps">
					{content.steps.map((step, index) => (
						<li key={step.label} className="sg-cr-step" data-sg-step="" data-card={step.card}>
							<b>
								<span>#</span>
								{String(index + 1).padStart(2, "0")}
							</b>
							{step.label}
						</li>
					))}
				</ol>
			)}
		</section>
	);
}
