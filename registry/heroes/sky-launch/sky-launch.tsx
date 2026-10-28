import type { DomHero } from "@/lib/sharingan";
import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { createSkyLaunch } from "./engine";
import { skyLaunchExample } from "./example";
import type { SkyLaunchConfigInput, SkyLaunchContent } from "./schema";
import { SKY_LAUNCH_STYLE_ID, skyLaunchStyles } from "./styles";

export type SkyLaunchHeroProps = {
	content?: SkyLaunchContent;
	config?: SkyLaunchConfigInput;
	id?: string;
	className?: string;
};

/** The rocket, as the engine draws it for a Web Component. */
const Rocket = () => (
	<svg className="sg-sl-rocket" viewBox="0 0 34 68" aria-hidden="true">
		<path className="sg-sl-flame" d="M12 50 Q17 68 22 50Z" fill="#ffc98f" />
		<path d="M17 1 C26 10 28 26 26 46 L8 46 C6 26 8 10 17 1Z" fill="#fff" />
		<path d="M8 32 L1 50 L8 46Z M26 32 L33 50 L26 46Z" fill="#fff" />
		<path d="M11 46 h12 v4 h-12Z" fill="#e8e4e1" />
		<circle cx="17" cy="22" r="5" fill="var(--sg-sl-sun)" stroke="#fff" strokeWidth="2" />
	</svg>
);

/**
 * Sky launch (Sharingan, DOM engine). A sun behind layers of pastel clouds;
 * the headline arrives word by word and a rocket takes off through the sun.
 * As the page scrolls on, the clouds rise and cover the hero.
 */
export function SkyLaunchHero({ content = skyLaunchExample, config, id = "hero", className }: SkyLaunchHeroProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<DomHero<SkyLaunchConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the hero.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createSkyLaunch({ host: section.current, config: JSON.parse(configKey) });
		return () => {
			engine.current?.destroy();
			engine.current = null;
		};
		// The engine starts once; config changes go through setConfig below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		engine.current?.setConfig(JSON.parse(configKey));
	}, [configKey]);

	return (
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="sky-launch" className={["sg-sl", className].filter(Boolean).join(" ")}>
			<style href={SKY_LAUNCH_STYLE_ID} precedence="default">
				{skyLaunchStyles}
			</style>
			<div className="sg-sl-sky" data-sg-sky="" aria-hidden="true">
				<div className="sg-sl-sun" />
				<div className="sg-sl-cloud" data-layer="back" />
				<div className="sg-sl-ship">
					<Rocket />
					<div className="sg-sl-trail" />
				</div>
				<div className="sg-sl-cloud" data-layer="middle" />
				<div className="sg-sl-cloud" data-layer="front" />
				<div className="sg-sl-veil" />
			</div>
			<div className="sg-sl-copy">
				{content.eyebrow && <p className="sg-sl-eyebrow">{content.eyebrow}</p>}
				<h1 id={`${id}-title`}>
					{content.headline
						.trim()
						.split(/\s+/)
						.map((word, index) => (
							<Fragment key={index}>
								{index > 0 && " "}
								<span className="sg-sl-word" style={{ "--i": index } as CSSProperties}>
									{word}
								</span>
							</Fragment>
						))}
				</h1>
				{content.subheadline && <p className="sg-sl-sub sg-sl-after">{content.subheadline}</p>}
				{(content.primaryCta || content.secondaryCta) && (
					<div className="sg-sl-ctas sg-sl-after">
						{content.primaryCta && (
							<a className="sg-sl-cta" href={content.primaryCta.href}>
								{content.primaryCta.label}
							</a>
						)}
						{content.secondaryCta && (
							<a className="sg-sl-cta" data-variant="secondary" href={content.secondaryCta.href}>
								{content.secondaryCta.label}
							</a>
						)}
					</div>
				)}
			</div>
		</section>
	);
}
