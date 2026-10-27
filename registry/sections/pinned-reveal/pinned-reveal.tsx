import type { SectionEngine } from "@/lib/sharingan/scroll";
import { wordsOf } from "@/lib/sharingan/scroll";
import { Fragment, useEffect, useRef } from "react";
import { createPinnedReveal } from "./engine";
import { pinnedRevealExample } from "./example";
import type { PinnedRevealConfigInput, PinnedRevealContent } from "./schema";
import { PINNED_REVEAL_STYLE_ID, pinnedRevealStyles } from "./styles";

export type PinnedRevealSectionProps = {
	content?: PinnedRevealContent;
	config?: PinnedRevealConfigInput;
	id?: string;
	className?: string;
};

/**
 * Pinned reveal (Sharingan section, GSAP). The headline stays while a rounded
 * image rises under it and grows to the full width. Without motion it is the
 * headline over the full image.
 */
export function PinnedRevealSection({ content = pinnedRevealExample, config, id = "pinned-reveal", className }: PinnedRevealSectionProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<SectionEngine<PinnedRevealConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the section.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createPinnedReveal({ host: section.current, config: JSON.parse(configKey) });
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
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="pinned-reveal" className={["sg-pr", className].filter(Boolean).join(" ")}>
			<style href={PINNED_REVEAL_STYLE_ID} precedence="default">
				{pinnedRevealStyles}
			</style>
			<div className="sg-pr-stage" data-sg-stage="">
				<div className="sg-pr-head" data-sg-head="">
					<div>
						{content.eyebrow && <p className="sg-pr-eyebrow">{content.eyebrow}</p>}
						<h2 id={`${id}-title`} data-sg-headline="">
							{wordsOf(content.headline).map((word, index) => (
								<Fragment key={index}>
									{index > 0 && " "}
									<span data-sg-word="">{word}</span>
								</Fragment>
							))}
						</h2>
					</div>
					{content.cta && (
						<a className="sg-pr-cta" href={content.cta.href}>
							{content.cta.label}
						</a>
					)}
				</div>
				<figure className="sg-pr-frame" data-sg-frame="">
					<img src={content.image.src} alt={content.image.alt} loading="lazy" draggable={false} />
					{content.caption && (
						<figcaption className="sg-pr-caption" data-sg-caption="">
							<b>{content.caption.title}</b>
							{content.caption.text && <span>{content.caption.text}</span>}
						</figcaption>
					)}
				</figure>
			</div>
		</section>
	);
}
