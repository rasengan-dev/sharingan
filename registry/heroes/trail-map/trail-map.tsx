import type { DomHero } from "@/lib/sharingan";
import { useEffect, useRef, type CSSProperties } from "react";
import { createTrailMap } from "./engine";
import { trailMapExample } from "./example";
import type { TrailMapConfigInput, TrailMapContent } from "./schema";
import { TRAIL_MAP_STYLE_ID, trailMapStyles } from "./styles";

export type TrailMapHeroProps = {
	content?: TrailMapContent;
	config?: TrailMapConfigInput;
	id?: string;
	className?: string;
};

// Avatars are initials on a colour, so no one's photo is needed.
const AVATAR_COLORS = ["oklch(0.62 0.13 250)", "oklch(0.64 0.15 150)", "oklch(0.66 0.17 30)", "oklch(0.6 0.15 320)"];

const Arrow = ({ back = false }: { back?: boolean }) => (
	<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d={back ? "M12 5l-5 5 5 5" : "M8 5l5 5-5 5"} />
	</svg>
);

/**
 * Trail map (Sharingan, DOM engine). A route draws itself up a photo in a
 * shaped frame, a walker climbs it and clouds drift at their own depth; a
 * strip of routes scrolls below. All text and images are in the DOM.
 */
export function TrailMapHero({ content = trailMapExample, config, id = "hero", className }: TrailMapHeroProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<DomHero<TrailMapConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the hero.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createTrailMap({ host: section.current, config: JSON.parse(configKey) });
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

	const { trail, explorers, destinations } = content;

	return (
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="trail-map" className={["sg-tm", className].filter(Boolean).join(" ")}>
			<style href={TRAIL_MAP_STYLE_ID} precedence="default">
				{trailMapStyles}
			</style>
			<div className="sg-tm-main">
				<div className="sg-tm-copy">
					{content.eyebrow && <p className="sg-tm-eyebrow">{content.eyebrow}</p>}
					<h1 id={`${id}-title`}>{content.headline}</h1>
					{content.subheadline && <p className="sg-tm-sub">{content.subheadline}</p>}
					{(content.primaryCta || content.secondaryCta) && (
						<div className="sg-tm-ctas">
							{content.primaryCta && (
								<a className="sg-tm-cta" href={content.primaryCta.href}>
									{content.primaryCta.label}
									<span className="sg-tm-cta-arrow" aria-hidden="true">
										<Arrow />
									</span>
								</a>
							)}
							{content.secondaryCta && (
								<a className="sg-tm-link" href={content.secondaryCta.href}>
									{content.secondaryCta.label}
								</a>
							)}
						</div>
					)}
				</div>

				<figure className="sg-tm-visual" data-sg-visual="" style={{ margin: 0 }}>
					<div className="sg-tm-frame" data-sg-frame="" data-trail={JSON.stringify({ points: trail.points, stops: trail.stops ?? [] })}>
						<div className="sg-tm-scene" data-sg-scene="">
							<img src={content.photo.src} alt={content.photo.alt} />
						</div>
					</div>
					<figcaption className="sg-tm-summit" data-sg-summit="">
						<span className="sg-tm-summit-icon" aria-hidden="true">
							<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
								<path d="M5 17V3M5 4h9l-2 3 2 3H5" />
							</svg>
						</span>
						<span className="sg-tm-summit-text">
							<b data-sg-distance="">{trail.distance}</b>
							<small>{trail.label ?? "Trekking distance"}</small>
						</span>
						<span className="sg-tm-sr">{trail.description}</span>
					</figcaption>
					{explorers && (
						<div className="sg-tm-explorers">
							<span className="sg-tm-avatars" aria-hidden="true">
								{(explorers.initials ?? []).map((initials, index) => (
									<span key={index} className="sg-tm-avatar" style={{ "--c": AVATAR_COLORS[index % AVATAR_COLORS.length] } as CSSProperties}>
										{initials}
									</span>
								))}
							</span>
							<span className="sg-tm-explorers-text">
								<b>{explorers.count}</b>
								<small>{explorers.label}</small>
							</span>
						</div>
					)}
				</figure>
			</div>

			{destinations && destinations.length > 0 && (
				<div className="sg-tm-band" data-sg-band="">
					<div className="sg-tm-band-inner">
						<button type="button" className="sg-tm-arrow" data-sg-prev="" aria-label="Previous routes">
							<Arrow back />
						</button>
						<ul className="sg-tm-routes" data-sg-routes="" aria-label="Routes">
							{destinations.map((route) => {
								const inner = (
									<>
										<img src={route.src} alt={route.alt} loading="lazy" />
										<span>
											<b>{route.name}</b>
											<small>{route.duration}</small>
											<span className="sg-tm-stars" aria-label={`Rated ${route.rating} out of 5, ${route.reviews} reviews`}>
												{"★".repeat(Math.round(route.rating))}
												{"☆".repeat(5 - Math.round(route.rating))}
												<span aria-hidden="true">({route.reviews} reviews)</span>
											</span>
										</span>
									</>
								);
								return (
									<li key={route.name}>
										{route.href ? (
											<a className="sg-tm-route-card" href={route.href}>
												{inner}
											</a>
										) : (
											<div className="sg-tm-route-card">{inner}</div>
										)}
									</li>
								);
							})}
						</ul>
						<button type="button" className="sg-tm-arrow" data-sg-next="" aria-label="Next routes">
							<Arrow />
						</button>
					</div>
				</div>
			)}
		</section>
	);
}
