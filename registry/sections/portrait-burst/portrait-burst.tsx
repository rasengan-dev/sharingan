import type { SectionEngine } from "@/lib/sharingan/scroll";
import { useEffect, useRef } from "react";
import { createPortraitBurst } from "./engine";
import { portraitBurstExample } from "./example";
import type { PortraitBurstConfigInput, PortraitBurstContent } from "./schema";
import { PORTRAIT_BURST_STYLE_ID, portraitBurstStyles } from "./styles";

export type PortraitBurstSectionProps = {
	content?: PortraitBurstContent;
	config?: PortraitBurstConfigInput;
	id?: string;
	className?: string;
};

/**
 * Portrait burst (Sharingan section, GSAP). A stack of portraits rises behind
 * the headline, then bursts out into a constellation around it. Without
 * motion it is the constellation, still.
 */
export function PortraitBurstSection({ content = portraitBurstExample, config, id = "portrait-burst", className }: PortraitBurstSectionProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<SectionEngine<PortraitBurstConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the section.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createPortraitBurst({ host: section.current, config: JSON.parse(configKey) });
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
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="portrait-burst" className={["sg-pb", className].filter(Boolean).join(" ")}>
			<style href={PORTRAIT_BURST_STYLE_ID} precedence="default">
				{portraitBurstStyles}
			</style>
			<div className="sg-pb-stage" data-sg-stage="">
				<div className="sg-pb-head" data-sg-head="">
					{content.eyebrow && <p className="sg-pb-eyebrow">{content.eyebrow}</p>}
					<h2 id={`${id}-title`}>{content.headline}</h2>
					{content.text && <p>{content.text}</p>}
					{(content.primaryCta || content.secondaryCta) && (
						<div className="sg-pb-ctas">
							{content.primaryCta && (
								<a className="sg-pb-cta" href={content.primaryCta.href}>
									{content.primaryCta.label}
								</a>
							)}
							{content.secondaryCta && (
								<a className="sg-pb-cta" data-variant="secondary" href={content.secondaryCta.href}>
									{content.secondaryCta.label}
								</a>
							)}
						</div>
					)}
				</div>
				<ul className="sg-pb-people" aria-label="The team">
					{content.people.map((person) => (
						<li key={person.src} className="sg-pb-person" data-sg-person="">
							<figure>
								<img src={person.src} alt={person.alt} loading="lazy" draggable={false} />
								{person.name && (
									<figcaption aria-hidden="true">
										<b>{person.name}</b>
										{person.role}
									</figcaption>
								)}
							</figure>
						</li>
					))}
				</ul>
				{content.pills && content.pills.length > 0 && (
					<ul className="sg-pb-pills">
						{content.pills.map((pill) => (
							<li key={pill} className="sg-pb-pill" data-sg-pill="">
								{pill}
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}
