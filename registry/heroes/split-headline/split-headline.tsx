import type { DomHero } from "@/lib/sharingan";
import { useEffect, useRef } from "react";
import { createSplitHeadline } from "./engine";
import { splitHeadlineExample } from "./example";
import type { SplitHeadlineConfigInput, SplitHeadlineContent } from "./schema";
import { SPLIT_HEADLINE_STYLE_ID, splitHeadlineStyles } from "./styles";

export type SplitHeadlineHeroProps = {
	content?: SplitHeadlineContent;
	config?: SplitHeadlineConfigInput;
	id?: string;
	className?: string;
};

/**
 * Split headline (Sharingan, DOM engine). The headline assembles letter by
 * letter, then the letters near the pointer thicken, lift and take the
 * accent colour. The heading stays one real <h1> with its full text.
 */
export function SplitHeadlineHero({ content = splitHeadlineExample, config, id = "hero", className }: SplitHeadlineHeroProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<DomHero<SplitHeadlineConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the hero.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createSplitHeadline({ host: section.current, config: JSON.parse(configKey) });
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
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="split-headline" className={["sg-sh", className].filter(Boolean).join(" ")}>
			<style href={SPLIT_HEADLINE_STYLE_ID} precedence="default">
				{splitHeadlineStyles}
			</style>
			{content.eyebrow && <p className="sg-sh-eyebrow">{content.eyebrow}</p>}
			{/* Keyed by its text: the engine replaces the heading's children, so a new headline gets a new element. */}
			<h1 key={content.headline} id={`${id}-title`} data-sg-split="">
				{content.headline}
			</h1>
			{content.subheadline && (
				<p className="sg-sh-sub" data-sg-after="">
					{content.subheadline}
				</p>
			)}
			{(content.primaryCta || content.secondaryCta) && (
				<div className="sg-sh-ctas" data-sg-after="">
					{content.primaryCta && (
						<a className="sg-sh-cta" href={content.primaryCta.href}>
							{content.primaryCta.label}
						</a>
					)}
					{content.secondaryCta && (
						<a className="sg-sh-cta" data-variant="secondary" href={content.secondaryCta.href}>
							{content.secondaryCta.label}
						</a>
					)}
				</div>
			)}
		</section>
	);
}
