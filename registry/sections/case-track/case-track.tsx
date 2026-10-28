import type { SectionEngine } from "@/lib/sharingan/scroll";
import { useEffect, useRef } from "react";
import { createCaseTrack } from "./engine";
import { caseTrackExample } from "./example";
import type { CaseTrackConfigInput, CaseTrackContent } from "./schema";
import { CASE_TRACK_STYLE_ID, caseTrackStyles } from "./styles";

export type CaseTrackSectionProps = {
	content?: CaseTrackContent;
	config?: CaseTrackConfigInput;
	id?: string;
	className?: string;
};

const Arrow = () => (
	<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
		<path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

/**
 * Case track (Sharingan section, GSAP). A row of case cards moves sideways as
 * the page scrolls, with a progress bar and arrows. Without motion, and on
 * phones, it is a row that scrolls on its own, with snap points.
 */
export function CaseTrackSection({ content = caseTrackExample, config, id = "case-track", className }: CaseTrackSectionProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<SectionEngine<CaseTrackConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the section.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createCaseTrack({ host: section.current, config: JSON.parse(configKey) });
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
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="case-track" className={["sg-ct", className].filter(Boolean).join(" ")}>
			<style href={CASE_TRACK_STYLE_ID} precedence="default">
				{caseTrackStyles}
			</style>
			<div className="sg-ct-stage" data-sg-stage="">
				<div className="sg-ct-head" data-sg-head="">
					<div>
						{content.eyebrow && <p className="sg-ct-eyebrow">{content.eyebrow}</p>}
						<h2 id={`${id}-title`}>{content.headline}</h2>
					</div>
					{(content.text || content.cta) && (
						<div className="sg-ct-aside">
							{content.text && <p>{content.text}</p>}
							{content.cta && (
								<a className="sg-ct-link" href={content.cta.href}>
									{content.cta.label}
								</a>
							)}
						</div>
					)}
				</div>
				<ul className="sg-ct-track" data-sg-track="" aria-label={content.headline}>
					{content.cases.map((item, index) =>
						index === 0 ? (
							<li key={item.href} className="sg-ct-card" data-sg-card="" data-featured="">
								<div className="sg-ct-story">
									{item.tag && <span className="sg-ct-tag">{item.tag}</span>}
									<h3>
										<a href={item.href}>{item.title}</a>
									</h3>
									{item.text && <p>{item.text}</p>}
									{item.figure && <p className="sg-ct-figure">{item.figure}</p>}
								</div>
								<figure className="sg-ct-media">
									<img src={item.image.src} alt={item.image.alt} loading="lazy" draggable={false} />
								</figure>
								<span className="sg-ct-go" aria-hidden="true">
									<Arrow />
								</span>
							</li>
						) : (
							<li key={item.href} className="sg-ct-card" data-sg-card="">
								<h3>
									<a href={item.href}>{item.title}</a>
								</h3>
								<figure className="sg-ct-media">
									<img src={item.image.src} alt={item.image.alt} loading="lazy" draggable={false} />
									{item.tag && <span className="sg-ct-tag">{item.tag}</span>}
								</figure>
								<span className="sg-ct-go" aria-hidden="true">
									<Arrow />
								</span>
							</li>
						),
					)}
				</ul>
				<div className="sg-ct-foot" data-sg-foot="">
					<button type="button" className="sg-ct-arrow" data-sg-prev="" aria-label="Previous case">
						<Arrow />
					</button>
					<button type="button" className="sg-ct-arrow" data-sg-next="" aria-label="Next case">
						<Arrow />
					</button>
					<div className="sg-ct-progress" data-sg-progress="" aria-hidden="true">
						<span />
					</div>
				</div>
			</div>
		</section>
	);
}
