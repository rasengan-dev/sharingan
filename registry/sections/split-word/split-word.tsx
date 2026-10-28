import type { SectionEngine } from "@/lib/sharingan/scroll";
import { useEffect, useRef } from "react";
import { createSplitWord } from "./engine";
import { splitWordExample } from "./example";
import type { SplitWordConfigInput, SplitWordContent } from "./schema";
import { SPLIT_WORD_STYLE_ID, splitWordStyles } from "./styles";

export type SplitWordSectionProps = {
	content?: SplitWordContent;
	config?: SplitWordConfigInput;
	id?: string;
	className?: string;
};

/** One span per letter, a space kept as one. */
const Letters = ({ text }: { text: string }) => (
	<>
		{[...text].map((character, index) => (
			<span key={index} className="sg-sw-letter" data-sg-letter="">
				{character}
			</span>
		))}
	</>
);

/**
 * Split word (Sharingan section, GSAP). A giant word pulls its letters
 * together, then parts at one letter so a card can rise into the gap; the
 * form fades in below. Without motion it is the parted word, the card and
 * the form.
 */
export function SplitWordSection({ content = splitWordExample, config, id = "split-word", className }: SplitWordSectionProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<SectionEngine<SplitWordConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the section.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createSplitWord({ host: section.current, config: JSON.parse(configKey) });
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

	const split = Math.min(content.word.length - 1, Math.max(1, content.split ?? Math.ceil(content.word.length / 2)));
	const { card, form } = content;
	const cardBody = (
		<>
			<b>{card.title}</b>
			{card.lines.map((line) => (
				<span key={line}>{line}</span>
			))}
		</>
	);

	return (
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="split-word" className={["sg-sw", className].filter(Boolean).join(" ")}>
			<style href={SPLIT_WORD_STYLE_ID} precedence="default">
				{splitWordStyles}
			</style>
			<div className="sg-sw-stage" data-sg-stage="">
				{content.eyebrow && <p className="sg-sw-eyebrow">{content.eyebrow}</p>}
				<h2 id={`${id}-title`} className="sg-sw-title">
					{content.word}
				</h2>
				<div className="sg-sw-line" data-sg-line="">
					<span className="sg-sw-half" data-sg-half="" aria-hidden="true">
						<Letters text={content.word.slice(0, split)} />
					</span>
					{card.href ? (
						<a className="sg-sw-card" data-sg-card="" href={card.href}>
							{cardBody}
						</a>
					) : (
						<div className="sg-sw-card" data-sg-card="">
							{cardBody}
						</div>
					)}
					<span className="sg-sw-half" data-sg-half="" aria-hidden="true">
						<Letters text={content.word.slice(split)} />
					</span>
				</div>
				{form && (
					<div className="sg-sw-below" data-sg-below="">
						<form className="sg-sw-form" action={form.action} method="post" data-no-subject={form.subject === false ? "" : undefined}>
							<label className="sg-sw-field">
								<span>Name</span>
								<input name="name" autoComplete="name" required />
							</label>
							<label className="sg-sw-field">
								<span>Email</span>
								<input name="email" type="email" autoComplete="email" required />
							</label>
							{form.subject !== false && (
								<label className="sg-sw-field">
									<span>Subject</span>
									<input name="subject" />
								</label>
							)}
							<label className="sg-sw-field sg-sw-message">
								<span>Message</span>
								<textarea name="message" rows={3} required />
							</label>
							<button type="submit" className="sg-sw-send">
								<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
								{form.submit ?? "Send"}
							</button>
						</form>
					</div>
				)}
			</div>
		</section>
	);
}
