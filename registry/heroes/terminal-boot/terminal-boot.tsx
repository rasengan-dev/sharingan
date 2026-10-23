import type { DomHero } from "@/lib/sharingan";
import { useEffect, useRef } from "react";
import { createTerminalBoot } from "./engine";
import { terminalBootExample } from "./example";
import type { TerminalBootConfigInput, TerminalBootContent } from "./schema";
import { TERMINAL_BOOT_STYLE_ID, terminalBootStyles } from "./styles";

const ICONS = { ok: "✔", info: "›", warn: "!", muted: "·" } as const;

export type TerminalBootHeroProps = {
	content?: TerminalBootContent;
	config?: TerminalBootConfigInput;
	id?: string;
	className?: string;
};

/**
 * Terminal boot (Sharingan, DOM engine). A terminal types the install
 * command, prints its output, and the product rises from it. The whole
 * transcript is rendered here, in the DOM; the engine only paces it.
 */
export function TerminalBootHero({ content = terminalBootExample, config, id = "hero", className }: TerminalBootHeroProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<DomHero<TerminalBootConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the hero.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createTerminalBoot({ host: section.current, config: JSON.parse(configKey) });
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

	const { terminal, media } = content;

	return (
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="terminal-boot" className={["sg-tb", className].filter(Boolean).join(" ")}>
			<style href={TERMINAL_BOOT_STYLE_ID} precedence="default">
				{terminalBootStyles}
			</style>
			<div className="sg-tb-copy">
				{content.eyebrow && <p className="sg-tb-eyebrow">{content.eyebrow}</p>}
				<h1 id={`${id}-title`}>{content.headline}</h1>
				{content.subheadline && <p>{content.subheadline}</p>}
				{(content.primaryCta || content.secondaryCta) && (
					<div className="sg-tb-ctas">
						{content.primaryCta && (
							<a className="sg-tb-cta" href={content.primaryCta.href}>
								{content.primaryCta.label}
							</a>
						)}
						{content.secondaryCta && (
							<a className="sg-tb-cta" data-variant="secondary" href={content.secondaryCta.href}>
								{content.secondaryCta.label}
							</a>
						)}
					</div>
				)}
			</div>

			<div className="sg-tb-scene">
				<div className="sg-tb-terminal" role="group" aria-label="Terminal">
					<div className="sg-tb-bar">
						<span className="sg-tb-dots" aria-hidden="true">
							<i />
							<i />
							<i />
						</span>
						<span className="sg-tb-title">{terminal.title ?? "~/projects"}</span>
						<span className="sg-tb-actions" data-sg-actions="" />
					</div>
					<ul className="sg-tb-body">
						<li>
							<span className="sg-tb-prompt" aria-hidden="true">
								$
							</span>
							<code data-sg-command="">{terminal.command}</code>
						</li>
						{terminal.output.map((line, index) => (
							<li key={index} data-sg-line="" data-status={line.status ?? "ok"}>
								<span data-sg-icon="" aria-hidden="true">
									{ICONS[line.status ?? "ok"]}
								</span>
								<span>{line.text}</span>
							</li>
						))}
						{terminal.done && (
							<li data-sg-done="">
								<span data-sg-icon="" aria-hidden="true">
									➜
								</span>
								<span>{terminal.done}</span>
							</li>
						)}
					</ul>
				</div>
				{media && (
					<figure className="sg-tb-product" data-sg-product="" style={{ margin: 0 }}>
						<div className="sg-tb-product-bar" aria-hidden="true">
							{media.address ?? "localhost:3000"}
						</div>
						<img src={media.src} alt={media.alt} />
					</figure>
				)}
			</div>
		</section>
	);
}
