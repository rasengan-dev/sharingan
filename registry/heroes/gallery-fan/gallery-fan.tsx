import type { DomHero } from "@/lib/sharingan";
import { useEffect, useRef } from "react";
import { createGalleryFan } from "./engine";
import { galleryFanExample } from "./example";
import type { GalleryFanConfigInput, GalleryFanContent } from "./schema";
import { GALLERY_FAN_STYLE_ID, galleryFanStyles } from "./styles";

export type GalleryFanHeroProps = {
	content?: GalleryFanContent;
	config?: GalleryFanConfigInput;
	id?: string;
	className?: string;
};

const CURSOR = "M2 2l15 6-6.5 2.2L8 17z";

/**
 * Gallery fan (Sharingan, DOM engine). A full-screen hero: the headline, a
 * fan of artwork cards whose nearest card rises, collaborator cursors, and
 * the call to action. Every work is a real image with its description.
 */
export function GalleryFanHero({ content = galleryFanExample, config, id = "hero", className }: GalleryFanHeroProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<DomHero<GalleryFanConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the hero.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createGalleryFan({ host: section.current, config: JSON.parse(configKey) });
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
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="gallery-fan" className={["sg-gf", className].filter(Boolean).join(" ")}>
			<style href={GALLERY_FAN_STYLE_ID} precedence="default">
				{galleryFanStyles}
			</style>
			{content.eyebrow && <p className="sg-gf-eyebrow">{content.eyebrow}</p>}
			<h1 id={`${id}-title`}>{content.headline}</h1>

			<div className="sg-gf-fan" data-sg-fan="" role="list" aria-label="Featured works">
				{content.artworks.map((work) => {
					const inner = (
						<>
							<img src={work.src} alt={work.alt} loading="eager" draggable={false} />
							<span className="sg-gf-caption">
								<b>{work.title}</b>
								<span>{work.artist}</span>
							</span>
						</>
					);
					return work.href ? (
						<a key={work.src} role="listitem" className="sg-gf-card" data-sg-card="" href={work.href} aria-label={`${work.title}, by ${work.artist}`}>
							{inner}
						</a>
					) : (
						<div key={work.src} role="listitem" tabIndex={0} className="sg-gf-card" data-sg-card="" aria-label={`${work.title}, by ${work.artist}`}>
							{inner}
						</div>
					);
				})}
				{content.collaborators?.map((person) => (
					<div key={person.name} className="sg-gf-cursor" data-sg-cursor="" data-card={person.card} aria-hidden="true">
						<div className="sg-gf-bob">
							<span className="sg-gf-bubble">@{person.name}</span>
							<svg viewBox="0 0 20 20">
								<path d={CURSOR} fill="var(--c)" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
							</svg>
						</div>
					</div>
				))}
			</div>

			{content.subheadline && <p className="sg-gf-sub">{content.subheadline}</p>}
			{(content.primaryCta || content.secondaryCta) && (
				<div className="sg-gf-ctas">
					{content.primaryCta && (
						<a className="sg-gf-cta" href={content.primaryCta.href}>
							{content.primaryCta.label}
						</a>
					)}
					{content.secondaryCta && (
						<a className="sg-gf-cta" data-variant="secondary" href={content.secondaryCta.href}>
							{content.secondaryCta.label}
						</a>
					)}
				</div>
			)}
		</section>
	);
}
