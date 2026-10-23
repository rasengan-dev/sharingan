import type { DomHero } from "@/lib/sharingan";
import { useEffect, useRef } from "react";
import { createMarqueeType } from "./engine";
import { marqueeTypeExample } from "./example";
import type { MarqueeTypeConfigInput, MarqueeTypeContent } from "./schema";
import { MARQUEE_TYPE_STYLE_ID, marqueeTypeStyles } from "./styles";

export type MarqueeTypeHeroProps = {
	content?: MarqueeTypeContent;
	config?: MarqueeTypeConfigInput;
	id?: string;
	className?: string;
};

/**
 * Marquee type (Sharingan, DOM engine). Oversized words slide in opposite
 * rows under the headline. Each row is rendered once as a real list; the
 * engine adds the hidden repeats that make it loop.
 */
export function MarqueeTypeHero({ content = marqueeTypeExample, config, id = "hero", className }: MarqueeTypeHeroProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<DomHero<MarqueeTypeConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the hero.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createMarqueeType({ host: section.current, config: JSON.parse(configKey) });
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
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="marquee-type" className={["sg-mq", className].filter(Boolean).join(" ")}>
			<style href={MARQUEE_TYPE_STYLE_ID} precedence="default">
				{marqueeTypeStyles}
			</style>
			<div className="sg-mq-copy">
				{content.eyebrow && <p className="sg-mq-eyebrow">{content.eyebrow}</p>}
				<h1 id={`${id}-title`}>{content.headline}</h1>
				{content.subheadline && <p>{content.subheadline}</p>}
				{(content.primaryCta || content.secondaryCta) && (
					<div className="sg-mq-ctas">
						{content.primaryCta && (
							<a className="sg-mq-cta" href={content.primaryCta.href}>
								{content.primaryCta.label}
							</a>
						)}
						{content.secondaryCta && (
							<a className="sg-mq-cta" data-variant="secondary" href={content.secondaryCta.href}>
								{content.secondaryCta.label}
							</a>
						)}
					</div>
				)}
			</div>
			<div className="sg-mq-band" data-sg-rows="" role="group" aria-label={content.rowsLabel}>
				{content.rows.map((row, index) => (
					<div key={index} className="sg-mq-row" data-sg-row="">
						<div className="sg-mq-track" data-sg-track="">
							<ul>
								{row.map((word, position) => (
									<li key={`${word}-${position}`}>{word}</li>
								))}
							</ul>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
