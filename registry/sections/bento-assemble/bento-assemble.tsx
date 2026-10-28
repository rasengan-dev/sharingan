import type { SectionEngine } from "@/lib/sharingan/scroll";
import { useEffect, useRef } from "react";
import { createBentoAssemble } from "./engine";
import { bentoAssembleExample } from "./example";
import type { BentoAssembleConfigInput, BentoAssembleContent } from "./schema";
import { BENTO_ASSEMBLE_STYLE_ID, bentoAssembleStyles } from "./styles";

export type BentoAssembleSectionProps = {
	content?: BentoAssembleContent;
	config?: BentoAssembleConfigInput;
	id?: string;
	className?: string;
};

/**
 * Bento assemble (Sharingan section, GSAP). The tiles fly in from around the
 * grid and lock into place as the page scrolls; their figures count up as
 * they land. Without motion it is the headline over the finished bento.
 */
export function BentoAssembleSection({ content = bentoAssembleExample, config, id = "bento-assemble", className }: BentoAssembleSectionProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<SectionEngine<BentoAssembleConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the section.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createBentoAssemble({ host: section.current, config: JSON.parse(configKey) });
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
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="bento-assemble" className={["sg-ba", className].filter(Boolean).join(" ")}>
			<style href={BENTO_ASSEMBLE_STYLE_ID} precedence="default">
				{bentoAssembleStyles}
			</style>
			<div className="sg-ba-stage" data-sg-stage="">
				<div className="sg-ba-head" data-sg-head="">
					<div>
						{content.eyebrow && <p className="sg-ba-eyebrow">{content.eyebrow}</p>}
						<h2 id={`${id}-title`}>{content.headline}</h2>
					</div>
					{(content.text || content.badge) && (
						<div className="sg-ba-aside">
							{content.text && <p>{content.text}</p>}
							{content.badge && (
								<a className="sg-ba-badge" data-sg-badge="" href={content.badge.href} aria-label={content.badge.label}>
									<span className="sg-ba-play" aria-hidden="true" />
								</a>
							)}
						</div>
					)}
				</div>
				<ul className="sg-ba-grid" data-sg-grid="">
					{content.tiles.map((tile, index) => {
						const tone = tile.tone ?? "paper";
						return (
							<li key={index} className="sg-ba-tile" data-sg-tile="" data-size={tile.size ?? "small"} data-tone={tone}>
								{tile.image && <img src={tile.image.src} alt={tile.image.alt} loading="lazy" draggable={false} />}
								{tile.label && <span className="sg-ba-label">{tile.label}</span>}
								{tile.avatars && tile.avatars.length > 0 && (
									<ul className="sg-ba-avatars">
										{tile.avatars.map((avatar) => (
											<li key={avatar.src}>
												<img src={avatar.src} alt={avatar.alt} loading="lazy" draggable={false} />
											</li>
										))}
									</ul>
								)}
								{tile.figure && (
									<p className="sg-ba-figure" data-sg-count="">
										{tile.figure}
									</p>
								)}
								{tile.title && <h3>{tile.title}</h3>}
								{tile.text && <p>{tile.text}</p>}
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
}
