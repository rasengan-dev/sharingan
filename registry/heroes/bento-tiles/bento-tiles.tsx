import type { DomHero } from "@/lib/sharingan";
import { useEffect, useRef } from "react";
import { createBentoTiles } from "./engine";
import { bentoTilesExample } from "./example";
import type { BentoTilesConfigInput, BentoTilesContent } from "./schema";
import { BENTO_TILES_STYLE_ID, bentoTilesStyles } from "./styles";

export type BentoTilesHeroProps = {
	content?: BentoTilesContent;
	config?: BentoTilesConfigInput;
	id?: string;
	className?: string;
};

function Chevron() {
	return (
		<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M6 3.5 10.5 8 6 12.5" />
		</svg>
	);
}

/** A figure: read once by screen readers, counted by the engine on screen. */
function Figure({ value }: { value: string }) {
	return (
		<p className="sg-bt-figure">
			<span className="sg-bt-sr">{value}</span>
			<span data-sg-count="" aria-hidden="true">
				{value}
			</span>
		</p>
	);
}

/**
 * Bento tiles (Sharingan, DOM engine). A full-screen hero: a centred headline
 * over a wall of soft raised tiles, and a bento of six cards (integrations,
 * two figures, a portrait scanned by red crosses, a world map with a folder,
 * avatars on orbits). Every word and image is real DOM.
 */
export function BentoTilesHero({ content = bentoTilesExample, config, id = "hero", className }: BentoTilesHeroProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<DomHero<BentoTilesConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the hero.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createBentoTiles({ host: section.current, config: JSON.parse(configKey) });
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

	const { nav, integrations, stat, portrait, highlight, folder, orbit } = content;

	return (
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="bento-tiles" className={["sg-bt", className].filter(Boolean).join(" ")}>
			<style href={BENTO_TILES_STYLE_ID} precedence="default">
				{bentoTilesStyles}
			</style>

			{nav && (
				<div className="sg-bt-nav" data-sg-nav="">
					<a className="sg-bt-brand" href="#">
						{nav.brand}
					</a>
					<nav aria-label={nav.brand}>
						<ul className="sg-bt-links">
							{nav.links.map((link) => (
								<li key={link.href}>
									<a href={link.href}>{link.label}</a>
								</li>
							))}
						</ul>
					</nav>
					{nav.cta && (
						<a className="sg-bt-btn" href={nav.cta.href}>
							{nav.cta.label}
						</a>
					)}
				</div>
			)}

			<div className="sg-bt-copy">
				<h1 id={`${id}-title`}>{content.headline}</h1>
				{content.subheadline && <p className="sg-bt-sub">{content.subheadline}</p>}
				{content.cta && (
					<a className="sg-bt-btn" href={content.cta.href}>
						{content.cta.label}
						<Chevron />
					</a>
				)}
			</div>

			<div className="sg-bt-bento" data-sg-bento="">
				<article className="sg-bt-card" data-sg-card="integrations">
					<ul className="sg-bt-apps" aria-label="Connects with">
						{integrations.apps.map((app) => (
							<li key={app.name} className="sg-bt-app" data-sg-app="">
								<img src={app.icon} alt={app.name} />
							</li>
						))}
					</ul>
					<div>
						<h2>{integrations.title}</h2>
						<p>{integrations.description}</p>
					</div>
				</article>

				<article className="sg-bt-card" data-sg-card="stat">
					<Figure value={stat.value} />
					<p>{stat.label}</p>
				</article>

				<figure className="sg-bt-card" data-sg-card="portrait" data-focus={portrait.focus?.join(",")}>
					<img src={portrait.src} alt={portrait.alt} />
				</figure>

				<article className="sg-bt-card" data-sg-card="highlight">
					<span className="sg-bt-progress" data-sg-progress="" aria-hidden="true" />
					<Figure value={highlight.value} />
					<p>{highlight.label}</p>
				</article>

				<div className="sg-bt-card" data-sg-card="folder">
					<div className="sg-bt-folder" data-sg-folder="">
						{folder.label}
					</div>
				</div>

				<article className="sg-bt-card" data-sg-card="orbit">
					<h2>{orbit.title}</h2>
					<ul className="sg-bt-orbits" data-sg-orbits="">
						{orbit.people.map((person) => (
							<li key={person.src} className="sg-bt-person" data-sg-person="">
								<img src={person.src} alt={person.alt} />
							</li>
						))}
					</ul>
				</article>
			</div>
		</section>
	);
}
