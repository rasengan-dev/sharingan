import type { SectionEngine } from "@/lib/sharingan/scroll";
import { useEffect, useRef } from "react";
import { createImageMarquee } from "./engine";
import { imageMarqueeExample } from "./example";
import type { ImageMarqueeConfigInput, ImageMarqueeContent } from "./schema";
import { IMAGE_MARQUEE_STYLE_ID, imageMarqueeStyles } from "./styles";

export type ImageMarqueeSectionProps = {
	content?: ImageMarqueeContent;
	config?: ImageMarqueeConfigInput;
	id?: string;
	className?: string;
};

/** One row: each phrase followed by an image, in turn. */
function Track({ content, reverse }: { content: ImageMarqueeContent; reverse?: boolean }) {
	const phrases = reverse ? [...content.phrases].reverse() : content.phrases;
	return (
		<ul className="sg-im-track" data-sg-track="">
			{phrases.flatMap((phrase, index) => {
				const image = content.images[index % content.images.length];
				return [
					<li key={`phrase-${index}`}>{phrase}</li>,
					<li key={`image-${index}`} className="sg-im-pic">
						<img src={image.src} alt={reverse ? "" : image.alt} loading="lazy" draggable={false} />
					</li>,
				];
			})}
		</ul>
	);
}

/**
 * Image marquee (Sharingan section, GSAP). A coloured band of oversized words
 * and images whose rows the scroll pushes sideways, the second the other way.
 * Without motion the rows stand still.
 */
export function ImageMarqueeSection({ content = imageMarqueeExample, config, id = "image-marquee", className }: ImageMarqueeSectionProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<SectionEngine<ImageMarqueeConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the section.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createImageMarquee({ host: section.current, config: JSON.parse(configKey) });
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
		<section ref={section} id={id} aria-label={content.label ?? content.phrases.join(", ")} data-sharingan="image-marquee" className={["sg-im", className].filter(Boolean).join(" ")}>
			<style href={IMAGE_MARQUEE_STYLE_ID} precedence="default">
				{imageMarqueeStyles}
			</style>
			<div className="sg-im-band">
				<div className="sg-im-row" data-sg-row="">
					<Track content={content} />
				</div>
				<div className="sg-im-row" data-sg-row="" aria-hidden="true">
					<Track content={content} reverse />
				</div>
			</div>
		</section>
	);
}
