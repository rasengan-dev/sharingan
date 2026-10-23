import { useRef, type CSSProperties, type ReactNode, type RefObject } from "react";

export const join = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

/**
 * The shared hero layout's stylesheet, so a hero needs no Tailwind (or any
 * CSS setup) in the project it is copied into. React 19 hoists it once per
 * page from `<HeroStyles />`. Colours come from the usual shadcn tokens;
 * without them, the fallbacks match the heroes' dark default background.
 */
export const HERO_STYLE_ID = "sg-hero";
export const heroStyles = /* css */ `
.sg-hero {
	position: relative; isolation: isolate; overflow: hidden;
	display: flex; align-items: center; justify-content: center;
	min-height: 640px; padding: 96px 24px;
	color: var(--foreground, #f4f4f6);
	background: var(--background, #0b0c10);
}
.sg-hero-layer { position: absolute; inset: 0; z-index: -10; }
.sg-hero-canvas { pointer-events: none; overflow: hidden; }
.sg-hero-canvas canvas, .sg-hero-canvas img { display: block; width: 100%; height: 100%; object-fit: cover; }
.sg-hero-canvas [hidden] { display: none; }
.sg-hero-column { margin: 0 auto; display: flex; max-width: 48rem; flex-direction: column; align-items: center; text-align: center; }
.sg-hero-eyebrow { margin: 0; font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 12px; line-height: 16px; letter-spacing: .18em; text-transform: uppercase; color: var(--muted-foreground, #a1a1aa); }
.sg-hero-title { margin: 20px 0 0; font-size: 48px; line-height: 1; font-weight: 600; letter-spacing: -0.025em; text-wrap: balance; color: var(--foreground, #f4f4f6); }
.sg-hero-sub { margin: 24px 0 0; max-width: 36rem; font-size: 18px; line-height: 28px; text-wrap: pretty; color: var(--muted-foreground, #a1a1aa); }
.sg-hero-ctas { margin-top: 40px; display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
.sg-hero-cta {
	display: inline-flex; align-items: center; height: 48px; padding: 0 24px; border-radius: 999px; font-weight: 500; text-decoration: none;
	color: var(--primary-foreground, #0b0c10); background: var(--primary, #f4f4f6); transition: transform .15s, background-color .15s;
}
.sg-hero-cta:hover { transform: translateY(-2px); }
.sg-hero-cta[data-variant="secondary"] {
	color: var(--foreground, #f4f4f6); background: color-mix(in oklab, var(--background, #0b0c10) 60%, transparent);
	box-shadow: inset 0 0 0 1px var(--border, rgb(255 255 255 / .16)); backdrop-filter: blur(4px);
}
.sg-hero-cta[data-variant="secondary"]:hover { transform: none; background: var(--background, #0b0c10); }
.sg-hero-cta:focus-visible { outline: 2px solid var(--primary, #f4f4f6); outline-offset: 4px; }
.sg-hero-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
@media (min-width: 640px) { .sg-hero-title { font-size: 72px; } }
`;

/** Renders the shared stylesheet; React 19 keeps one copy per page. */
export function HeroStyles() {
	return (
		<style href={HERO_STYLE_ID} precedence="default">
			{heroStyles}
		</style>
	);
}

/** The text every hero shows. It stays in the DOM: readable, selectable, indexable. */
export type HeroContent = {
	eyebrow?: string;
	headline: string;
	subheadline?: string;
	primaryCta?: { label: string; href: string };
	secondaryCta?: { label: string; href: string };
};

export type HeroSectionProps = {
	content: HeroContent;
	id?: string;
	className?: string;
	/** Renders the GPU layer; receives the section, to follow the pointer over all of it. */
	background: (section: RefObject<HTMLElement | null>) => ReactNode;
	/** Inline style on the section, e.g. a taller hero. */
	style?: CSSProperties;
	/** Extra classes on the headline, e.g. to let a hero draw it. */
	headlineClassName?: string;
	/** Rendered after the buttons, inside the content column. */
	children?: ReactNode;
};

/** The shared layout of a hero: a centred column of content over a GPU background. */
export function HeroSection({ content, id = "hero", className, style, background, headlineClassName, children }: HeroSectionProps) {
	const section = useRef<HTMLElement>(null);

	return (
		<section ref={section} id={id} aria-labelledby={`${id}-title`} className={join("sg-hero", className)} style={style}>
			<HeroStyles />
			{background(section)}

			<div className="sg-hero-column">
				{content.eyebrow && <p className="sg-hero-eyebrow">{content.eyebrow}</p>}
				<h1 id={`${id}-title`} data-sg-text="" className={join("sg-hero-title", headlineClassName)}>
					{content.headline}
				</h1>
				{content.subheadline && <p className="sg-hero-sub">{content.subheadline}</p>}
				{(content.primaryCta || content.secondaryCta) && (
					<div className="sg-hero-ctas">
						{content.primaryCta && (
							<a href={content.primaryCta.href} className="sg-hero-cta">
								{content.primaryCta.label}
							</a>
						)}
						{content.secondaryCta && (
							<a href={content.secondaryCta.href} className="sg-hero-cta" data-variant="secondary">
								{content.secondaryCta.label}
							</a>
						)}
					</div>
				)}
				{children}
			</div>
		</section>
	);
}
