import type { SectionEngine } from "@/lib/sharingan/scroll";
import { wordsOf } from "@/lib/sharingan/scroll";
import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { createScrollRead } from "./engine";
import { scrollReadExample } from "./example";
import type { ScrollReadConfigInput, ScrollReadContent } from "./schema";
import { SCROLL_READ_STYLE_ID, scrollReadStyles } from "./styles";

export type ScrollReadSectionProps = {
	content?: ScrollReadContent;
	config?: ScrollReadConfigInput;
	id?: string;
	className?: string;
};

/** The paragraph as words and images, in order: `{0}` places `images[0]`. */
function pieces(content: ScrollReadContent): ReactNode[] {
	const out: ReactNode[] = [];
	for (const part of content.text.split(/(\{\d+\})/)) {
		const token = part.match(/^\{(\d+)\}$/);
		if (token) {
			const image = content.images?.[Number(token[1])];
			if (image)
				out.push(
					<span key={`image-${out.length}`} data-sg-inline="">
						<img src={image.src} alt={image.alt} loading="lazy" draggable={false} />
					</span>,
				);
			continue;
		}
		for (const word of wordsOf(part))
			out.push(
				<span key={`word-${out.length}`} data-sg-word="">
					{word}
				</span>,
			);
	}
	return out;
}

/**
 * Scroll read (Sharingan section, GSAP). A large paragraph that darkens word
 * by word as it is scrolled, with images that grow inside the line. Without
 * motion it is the paragraph, fully dark.
 */
export function ScrollReadSection({ content = scrollReadExample, config, id = "scroll-read", className }: ScrollReadSectionProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<SectionEngine<ScrollReadConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the section.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createScrollRead({ host: section.current, config: JSON.parse(configKey) });
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
		<section
			ref={section}
			id={id}
			aria-label={content.eyebrow ?? "Our story"}
			data-sharingan="scroll-read"
			className={["sg-sr", className].filter(Boolean).join(" ")}
		>
			<style href={SCROLL_READ_STYLE_ID} precedence="default">
				{scrollReadStyles}
			</style>
			<div className="sg-sr-inner">
				{content.eyebrow && <p className="sg-sr-eyebrow">{content.eyebrow}</p>}
				<p className="sg-sr-text" data-sg-read="">
					{pieces(content).map((piece, index) => (
						<Fragment key={index}>
							{index > 0 && " "}
							{piece}
						</Fragment>
					))}
				</p>
				{content.cta && (
					<a className="sg-sr-cta" href={content.cta.href}>
						{content.cta.label}
					</a>
				)}
			</div>
		</section>
	);
}
