import type { SectionEngine } from "@/lib/sharingan/scroll";
import { useEffect, useRef } from "react";
import { createParallaxColumns } from "./engine";
import { parallaxColumnsExample } from "./example";
import type { ParallaxColumnsConfigInput, ParallaxColumnsContent } from "./schema";
import { PARALLAX_COLUMNS_STYLE_ID, parallaxColumnsStyles } from "./styles";

export type ParallaxColumnsSectionProps = {
	content?: ParallaxColumnsContent;
	config?: ParallaxColumnsConfigInput;
	id?: string;
	className?: string;
};

type Card = ParallaxColumnsContent["cards"][number];

function ColumnCard({ card }: { card: Card }) {
	const inner = (
		<>
			<div className="sg-pc-media" data-sg-media="">
				<img src={card.src} alt={card.alt} loading="lazy" draggable={false} />
			</div>
			<h3>{card.title}</h3>
			{card.text && <p>{card.text}</p>}
		</>
	);
	return (
		<article className="sg-pc-card" data-sg-card="">
			{card.href ? <a href={card.href}>{inner}</a> : <div>{inner}</div>}
		</article>
	);
}

/**
 * Parallax columns (Sharingan section, GSAP). A headline over two columns of
 * cards that travel at different speeds. The cards alternate: first, third…
 * on the left, second, fourth… on the right, which is also their reading order
 * column by column. Without motion the columns stay still.
 */
export function ParallaxColumnsSection({ content = parallaxColumnsExample, config, id = "parallax-columns", className }: ParallaxColumnsSectionProps) {
	const section = useRef<HTMLElement>(null);
	const engine = useRef<SectionEngine<ParallaxColumnsConfigInput> | null>(null);
	// Compare configs by value: an inline object literal must not restart the section.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		if (!section.current) return;
		engine.current = createParallaxColumns({ host: section.current, config: JSON.parse(configKey) });
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

	const columns = [content.cards.filter((_, index) => index % 2 === 0), content.cards.filter((_, index) => index % 2 === 1)];

	return (
		<section ref={section} id={id} aria-labelledby={`${id}-title`} data-sharingan="parallax-columns" className={["sg-pc", className].filter(Boolean).join(" ")}>
			<style href={PARALLAX_COLUMNS_STYLE_ID} precedence="default">
				{parallaxColumnsStyles}
			</style>
			<div className="sg-pc-inner">
				<div className="sg-pc-head">
					<div>
						{content.eyebrow && <p className="sg-pc-eyebrow">{content.eyebrow}</p>}
						<h2 id={`${id}-title`}>{content.headline}</h2>
					</div>
					{content.text && <p>{content.text}</p>}
				</div>
				<div className="sg-pc-grid" data-sg-grid="">
					{columns.map((cards, index) => (
						<div key={index} className="sg-pc-column" data-sg-column="">
							{cards.map((card) => (
								<ColumnCard key={card.src} card={card} />
							))}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
