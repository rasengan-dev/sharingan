import type { DomHero } from "@/lib/sharingan";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { drawDeck } from "./deck";
import { createIsoDeck } from "./engine";
import { isoDeckExample } from "./example";
import { isoDeckConfigSchema, type IsoDeckConfigInput, type IsoDeckContent } from "./schema";
import { ISO_DECK_STYLE_ID, isoDeckStyles } from "./styles";

export type IsoDeckHeroProps = {
	content?: IsoDeckContent;
	config?: IsoDeckConfigInput;
	id?: string;
	className?: string;
};

/**
 * Iso deck (Sharingan, DOM engine). A macro pad in isometric line art: a
 * cursor selects the floating tile, a tooltip types the tagline, the keys
 * spell a word. Hovered keys press, and typing the word connects the deck.
 */
export function IsoDeckHero({ content = isoDeckExample, config, id = "hero", className }: IsoDeckHeroProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<DomHero<IsoDeckConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the hero.
	const configKey = JSON.stringify(config ?? {});
	// Clip ids come from the section's id, which is unique on the page: the same on the server and the client.
	const uid = `sg-id-${id.replace(/[^\w-]/g, "")}`;
	// Drawn once, so the server sends the deck; after that the engine redraws it when the config changes.
	const [drawing] = useState(() => drawDeck(isoDeckConfigSchema.parse(config ?? {}), { id: uid, cta: content.keyCta?.label }));

	useEffect(() => {
		if (!section.current) return;
		engine.current = createIsoDeck({ host: section.current, config: JSON.parse(configKey) });
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
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="iso-deck" className={["sg-id", className].filter(Boolean).join(" ")}>
			<style href={ISO_DECK_STYLE_ID} precedence="default">
				{isoDeckStyles}
			</style>
			<div className="sg-id-copy">
				{content.eyebrow && <p className="sg-id-eyebrow">{content.eyebrow}</p>}
				<h1 id={`${id}-title`}>{content.headline}</h1>
				{content.subheadline && <p className="sg-id-sub">{content.subheadline}</p>}
				{(content.primaryCta || content.secondaryCta) && (
					<div className="sg-id-ctas">
						{content.primaryCta && (
							<a className="sg-id-cta" href={content.primaryCta.href}>
								{content.primaryCta.label}
							</a>
						)}
						{content.secondaryCta && (
							<a className="sg-id-cta" data-variant="secondary" href={content.secondaryCta.href}>
								{content.secondaryCta.label}
							</a>
						)}
					</div>
				)}
			</div>
			<div className="sg-id-panel">
				<div
					className="sg-id-deck"
					data-sg-deck=""
					data-uid={uid}
					data-cursor="out"
					data-select=""
					data-tip={content.tagline ? "open" : undefined}
					data-tagline={content.tagline ?? ""}
					data-connected-label={content.connectedLabel ?? "Connected"}
					style={{ "--u": drawing.unit } as CSSProperties}
				>
					<div className="sg-id-art" dangerouslySetInnerHTML={{ __html: drawing.svg }} />
					<p className="sg-id-tip" aria-hidden="true" data-text={content.tagline ?? ""} style={drawing.tip} />
					{content.keyCta && (
						<a className="sg-id-keylink" href={content.keyCta.href} style={drawing.link}>
							<span className="sg-id-sr">{content.keyCta.label}</span>
						</a>
					)}
				</div>
			</div>
		</section>
	);
}
