import type { SectionEngine } from "@/lib/sharingan/scroll";
import { useEffect, useRef } from "react";
import { createMosaicZoom } from "./engine";
import { mosaicZoomExample } from "./example";
import type { MosaicZoomConfigInput, MosaicZoomContent } from "./schema";
import { MOSAIC_ZOOM_STYLE_ID, mosaicZoomStyles } from "./styles";

export type MosaicZoomSectionProps = {
	content?: MosaicZoomContent;
	config?: MosaicZoomConfigInput;
	id?: string;
	className?: string;
};

/**
 * Mosaic zoom (Sharingan section, GSAP). The headline, then a mosaic whose
 * featured image first fills the screen and shrinks back into its place as
 * the other tiles gather. Without motion it is the mosaic.
 */
export function MosaicZoomSection({ content = mosaicZoomExample, config, id = "mosaic-zoom", className }: MosaicZoomSectionProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<SectionEngine<MosaicZoomConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the section.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createMosaicZoom({ host: section.current, config: JSON.parse(configKey) });
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
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="mosaic-zoom" className={["sg-mz", className].filter(Boolean).join(" ")}>
			<style href={MOSAIC_ZOOM_STYLE_ID} precedence="default">
				{mosaicZoomStyles}
			</style>
			<div className="sg-mz-head" data-sg-head="">
				{content.eyebrow && <p className="sg-mz-eyebrow">{content.eyebrow}</p>}
				<h2 id={`${id}-title`}>{content.headline}</h2>
				{content.text && <p>{content.text}</p>}
				{content.cta && (
					<a className="sg-mz-cta" href={content.cta.href}>
						{content.cta.label}
					</a>
				)}
			</div>
			<div className="sg-mz-stage" data-sg-stage="">
				<ul className="sg-mz-grid" data-sg-mosaic="" aria-label="Members' work">
					<li className="sg-mz-tile sg-mz-feature" data-sg-feature="">
						<img src={content.feature.src} alt={content.feature.alt} loading="lazy" draggable={false} />
						<p className="sg-mz-caption" data-sg-caption="">
							<b>{content.feature.title}</b>
							{content.feature.meta && <span>{content.feature.meta}</span>}
						</p>
					</li>
					{content.tiles.map((tile) => (
						<li key={tile.src} className="sg-mz-tile" data-sg-tile="">
							<img src={tile.src} alt={tile.alt} loading="lazy" draggable={false} />
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
