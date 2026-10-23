import type { DomHero } from "@/lib/sharingan";
import { useEffect, useRef } from "react";
import { createHoloCard } from "./engine";
import { holoCardExample } from "./example";
import type { HoloCardConfigInput, HoloCardContent } from "./schema";
import { HOLO_CARD_STYLE_ID, holoCardStyles } from "./styles";

export type HoloCardHeroProps = {
	content?: HoloCardContent;
	config?: HoloCardConfigInput;
	id?: string;
	className?: string;
};

const Foil = () => (
	<>
		<span className="sg-hc-foil sg-hc-sheen" aria-hidden="true" />
		<span className="sg-hc-foil sg-hc-etch" aria-hidden="true" />
		<span className="sg-hc-foil sg-hc-glare" aria-hidden="true" />
	</>
);

/** A small foil emblem, drawn in the card's own colours. */
const Emblem = () => (
	<svg className="sg-hc-emblem" viewBox="0 0 32 32" aria-hidden="true">
		<circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeOpacity=".5" />
		<path d="M16 5 19 13l8 3-8 3-3 8-3-8-8-3 8-3z" fill="currentColor" fillOpacity=".85" />
	</svg>
);

/**
 * Holo card (Sharingan, DOM engine). A card with a holographic foil leans
 * toward the cursor or the phone's tilt, and turns over to show its back.
 * Everything printed on it is real text in the DOM.
 */
export function HoloCardHero({ content = holoCardExample, config, id = "hero", className }: HoloCardHeroProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<DomHero<HoloCardConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the hero.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createHoloCard({ host: section.current, config: JSON.parse(configKey) });
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

	const { card, back } = content;

	return (
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="holo-card" className={["sg-hc", className].filter(Boolean).join(" ")}>
			<style href={HOLO_CARD_STYLE_ID} precedence="default">
				{holoCardStyles}
			</style>
			<div className="sg-hc-copy">
				{content.eyebrow && <p className="sg-hc-eyebrow">{content.eyebrow}</p>}
				<h1 id={`${id}-title`}>{content.headline}</h1>
				{content.subheadline && <p>{content.subheadline}</p>}
				{(content.primaryCta || content.secondaryCta) && (
					<div className="sg-hc-ctas">
						{content.primaryCta && (
							<a className="sg-hc-cta" href={content.primaryCta.href}>
								{content.primaryCta.label}
							</a>
						)}
						{content.secondaryCta && (
							<a className="sg-hc-cta" data-variant="secondary" href={content.secondaryCta.href}>
								{content.secondaryCta.label}
							</a>
						)}
					</div>
				)}
			</div>

			<div className="sg-hc-stage">
				<div className="sg-hc-card" data-sg-card="" role="group" aria-label={`${card.issuer} card`}>
					<div className="sg-hc-face sg-hc-front" data-sg-front="">
						<Foil />
						<div className="sg-hc-row">
							<span className="sg-hc-issuer">{card.issuer}</span>
							<Emblem />
						</div>
						<div>
							<p className="sg-hc-name">{card.name}</p>
							{card.role && <p className="sg-hc-role">{card.role}</p>}
						</div>
						<div className="sg-hc-row">
							{card.detail && <span className="sg-hc-detail">{card.detail}</span>}
							{card.number && <span className="sg-hc-number">{card.number}</span>}
						</div>
					</div>
					{back && (
						<div className="sg-hc-face sg-hc-back" data-sg-back="">
							<Foil />
							<div>
								<h2>{back.title}</h2>
								{back.items && (
									<ul>
										{back.items.map((item) => (
											<li key={item}>{item}</li>
										))}
									</ul>
								)}
							</div>
							{back.link && <a href={back.link.href}>{back.link.label}</a>}
						</div>
					)}
				</div>
				{back && (
					<button type="button" className="sg-hc-flip" data-sg-flip="">
						<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<path d="M2.5 8a5.5 5.5 0 0 1 9.6-3.7M13.5 8a5.5 5.5 0 0 1-9.6 3.7" />
							<path d="M12.5 1.8v2.8H9.7M3.5 14.2v-2.8h2.8" />
						</svg>
						<span>Turn over</span>
					</button>
				)}
			</div>
		</section>
	);
}
