import type { SectionEngine } from "@/lib/sharingan/scroll";
import { wordsOf } from "@/lib/sharingan/scroll";
import { Fragment, useEffect, useRef } from "react";
import { createCardJourney } from "./engine";
import { cardJourneyExample } from "./example";
import type { CardJourneyConfigInput, CardJourneyContent } from "./schema";
import { CARD_JOURNEY_STYLE_ID, cardJourneyStyles } from "./styles";

export type CardJourneySectionProps = {
	content?: CardJourneyContent;
	config?: CardJourneyConfigInput;
	id?: string;
	className?: string;
};

/**
 * Card journey (Sharingan section, GSAP). A paragraph read on scroll with a
 * deck shuffling beside it, a staircase of cards beside a note, then a tabbed
 * grid. Without motion it is that grid, under the paragraph.
 */
export function CardJourneySection({ content = cardJourneyExample, config, id = "card-journey", className }: CardJourneySectionProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<SectionEngine<CardJourneyConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the section.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createCardJourney({ host: section.current, config: JSON.parse(configKey) });
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
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="card-journey" className={["sg-cj", className].filter(Boolean).join(" ")}>
			<style href={CARD_JOURNEY_STYLE_ID} precedence="default">
				{cardJourneyStyles}
			</style>
			<div className="sg-cj-stage" data-sg-stage="">
				<p className="sg-cj-statement" data-sg-statement="">
					{wordsOf(content.statement).map((word, index) => (
						<Fragment key={index}>
							{index > 0 && " "}
							<span data-sg-word="">{word}</span>
						</Fragment>
					))}
				</p>

				{content.aside && (
					<div className="sg-cj-aside" data-sg-aside="">
						<h3>{content.aside.title}</h3>
						{content.aside.text && <p>{content.aside.text}</p>}
					</div>
				)}

				<div className="sg-cj-grid" data-sg-grid="">
					<div className="sg-cj-copy" data-sg-copy="">
						{content.eyebrow && <p className="sg-cj-eyebrow">{content.eyebrow}</p>}
						<h2 id={`${id}-title`}>{content.headline}</h2>
						{content.text && <p>{content.text}</p>}
						{content.cta && (
							<a className="sg-cj-cta" href={content.cta.href}>
								{content.cta.label}
							</a>
						)}
					</div>

					<div className="sg-cj-panel" data-sg-panel="">
						<div className="sg-cj-panel-bg" aria-hidden="true" />
						{content.tabs && (
							<div className="sg-cj-tabs" role="tablist" aria-label="Filter the works">
								{content.tabs.map((tab, index) => (
									<button
										key={tab.label}
										type="button"
										role="tab"
										className="sg-cj-tab"
										data-sg-tab=""
										data-cards={tab.cards?.join(",")}
										aria-selected={index === 0}
										aria-controls={`${id}-cards`}
										tabIndex={index === 0 ? 0 : -1}
									>
										{tab.label}
									</button>
								))}
							</div>
						)}
						<ul id={`${id}-cards`} className="sg-cj-cards">
							{content.cards.map((card) => {
								const inner = (
									<>
										<img src={card.src} alt={card.alt} loading="lazy" draggable={false} />
										<span className="sg-cj-caption">
											<b>{card.title}</b>
											{card.meta && <span>{card.meta}</span>}
										</span>
									</>
								);
								return (
									<li key={card.src} className="sg-cj-card" data-sg-card="">
										{card.href ? <a href={card.href}>{inner}</a> : <div>{inner}</div>}
									</li>
								);
							})}
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}
