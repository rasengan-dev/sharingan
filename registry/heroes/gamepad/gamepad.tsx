import type { DomHero } from "@/lib/sharingan";
import { useEffect, useRef } from "react";
import { createGamepad } from "./engine";
import { gamepadExample } from "./example";
import type { GamepadConfigInput, GamepadContent } from "./schema";
import { GAMEPAD_STYLE_ID, gamepadStyles } from "./styles";

const KEYS = ["Y", "X", "B", "A"];

export type GamepadHeroProps = {
	content?: GamepadContent;
	config?: GamepadConfigInput;
	id?: string;
	className?: string;
};

/**
 * Gamepad (Sharingan, DOM engine). A game controller is the navigation: its
 * D-pad and buttons open the sections, from the mouse, the keyboard or a
 * real gamepad. Every section is rendered here, in the DOM; the engine adds
 * the controller and shows one section at a time.
 */
export function GamepadHero({ content = gamepadExample, config, id = "hero", className }: GamepadHeroProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<DomHero<GamepadConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the hero.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createGamepad({ host: section.current, config: JSON.parse(configKey) });
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

	const wordmark = content.wordmark ?? { title: "SG·PAD", tagline: "MADE FOR CLICKING" };

	return (
		<section
			ref={section}
			id={id}
			aria-labelledby={`${id}-title`}
			data-sharingan="gamepad"
			data-wordmark={wordmark.title}
			data-wordmark-tagline={wordmark.tagline}
			data-collaborators={content.collaborators?.join(",")}
			className={["sg-gp", className].filter(Boolean).join(" ")}
		>
			<style href={GAMEPAD_STYLE_ID} precedence="default">
				{gamepadStyles}
			</style>
			<div data-sg-screen="">
				<div data-sg-slide="home">
					{content.eyebrow && <p className="sg-gp-eyebrow">{content.eyebrow}</p>}
					<h1 id={`${id}-title`}>{content.headline}</h1>
					{content.subheadline && <p>{content.subheadline}</p>}
					{(content.primaryCta || content.secondaryCta) && (
						<div className="sg-gp-ctas">
							{content.primaryCta && (
								<a className="sg-gp-cta" href={content.primaryCta.href}>
									{content.primaryCta.label}
								</a>
							)}
							{content.secondaryCta && (
								<a className="sg-gp-cta" data-variant="secondary" href={content.secondaryCta.href}>
									{content.secondaryCta.label}
								</a>
							)}
						</div>
					)}
				</div>
				{content.sections.map((item, index) => (
					<div key={item.label} data-sg-slide="" data-label={item.label}>
						<span className="sg-gp-tag">
							{KEYS[index]} · {item.label}
						</span>
						<h2>{item.title}</h2>
						{item.body && <p>{item.body}</p>}
						{item.items && (
							<ul>
								{item.items.map((chip) => (
									<li key={chip}>{chip}</li>
								))}
							</ul>
						)}
						{item.quote && (
							<>
								<blockquote>“{item.quote.text}”</blockquote>
								<cite>{item.quote.cite}</cite>
							</>
						)}
					</div>
				))}
			</div>
			<div data-sg-stage="" />
			<nav data-sg-legend="" />
			<p data-sg-hint="" />
			<div data-sg-overlay="" />
		</section>
	);
}
