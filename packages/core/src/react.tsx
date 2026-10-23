import { useRef, type ReactNode, type RefObject } from "react";

export const join = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

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
	/** Extra classes on the headline, e.g. to let a hero draw it. */
	headlineClassName?: string;
	/** Rendered after the buttons, inside the content column. */
	children?: ReactNode;
};

/** The shared layout of a hero: a centred column of content over a GPU background. */
export function HeroSection({ content, id = "hero", className, background, headlineClassName, children }: HeroSectionProps) {
	const section = useRef<HTMLElement>(null);

	return (
		<section ref={section} id={id} aria-labelledby={`${id}-title`} className={join("relative isolate flex min-h-[640px] items-center justify-center overflow-hidden px-6 py-24", className)}>
			{background(section)}

			<div className="mx-auto flex max-w-3xl flex-col items-center text-center">
				{content.eyebrow && <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">{content.eyebrow}</p>}
				<h1 id={`${id}-title`} data-sg-text="" className={join("mt-5 text-5xl font-semibold tracking-tight text-balance text-foreground sm:text-7xl", headlineClassName)}>
					{content.headline}
				</h1>
				{content.subheadline && <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">{content.subheadline}</p>}
				{(content.primaryCta || content.secondaryCta) && (
					<div className="mt-10 flex flex-wrap justify-center gap-3">
						{content.primaryCta && (
							<a href={content.primaryCta.href} className="inline-flex h-12 items-center rounded-full bg-primary px-6 font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
								{content.primaryCta.label}
							</a>
						)}
						{content.secondaryCta && (
							<a href={content.secondaryCta.href} className="inline-flex h-12 items-center rounded-full border border-border bg-background/60 px-6 font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
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
