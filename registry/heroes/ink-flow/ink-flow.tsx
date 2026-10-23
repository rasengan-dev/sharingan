import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { FallbackReason } from "@/lib/sharingan";
import { createInkFlow, type InkFlowHandle } from "./engine";
import { inkFlowExample } from "./example";
import { inkFlowFallbackStyle } from "./fallback";
import type { InkFlowConfigInput, InkFlowContent } from "./schema";

const join = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

export type InkFlowBackgroundProps = {
	config?: InkFlowConfigInput;
	/** The element the pointer is followed over. Defaults to the background's parent. */
	hostRef?: RefObject<HTMLElement | null>;
	className?: string;
};

/** Only the ink layer, for people who bring their own hero layout. Place it in a positioned parent. */
export function InkFlowBackground({ config, hostRef, className }: InkFlowBackgroundProps) {
	const wrapper = useRef<HTMLDivElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);
	const engine = useRef<InkFlowHandle | null>(null);
	const [fallback, setFallback] = useState<FallbackReason | null>(null);
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		const host = hostRef?.current ?? wrapper.current?.parentElement ?? wrapper.current;
		if (!canvas.current || !host) return;
		engine.current = createInkFlow({ canvas: canvas.current, host, config, onFallback: setFallback });
		return () => {
			engine.current?.destroy();
			engine.current = null;
		};
		// The engine is created once; config changes go through setConfig below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hostRef]);

	useEffect(() => {
		engine.current?.setConfig(JSON.parse(configKey));
	}, [configKey]);

	const fallbackStyle = useMemo(() => inkFlowFallbackStyle(JSON.parse(configKey)), [configKey]);
	const poster = (config?.poster as string | undefined) ?? undefined;

	return (
		<div ref={wrapper} aria-hidden="true" data-sharingan="ink-flow" data-state={fallback ?? "live"} className={join("pointer-events-none overflow-hidden", className)} style={fallbackStyle}>
			{fallback && poster && <img src={poster} alt="" className="size-full object-cover" />}
			<canvas ref={canvas} hidden={fallback !== null} className="block size-full" />
		</div>
	);
}

export type InkFlowHeroProps = {
	content?: InkFlowContent;
	config?: InkFlowConfigInput;
	id?: string;
	className?: string;
};

/**
 * Ink flow (Sharingan). Brand-coloured ink swirls behind the headline and
 * follows the cursor. The text and buttons are ordinary DOM over the canvas.
 */
export function InkFlowHero({ content = inkFlowExample, config, id = "hero", className }: InkFlowHeroProps) {
	const section = useRef<HTMLElement>(null);

	return (
		<section ref={section} id={id} aria-labelledby={`${id}-title`} className={join("relative isolate flex min-h-[640px] items-center justify-center overflow-hidden px-6 py-24", className)}>
			<InkFlowBackground config={config} hostRef={section} className="absolute inset-0 -z-10" />

			<div className="mx-auto flex max-w-3xl flex-col items-center text-center">
				{content.eyebrow && <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">{content.eyebrow}</p>}
				<h1 id={`${id}-title`} className="mt-5 text-5xl font-semibold tracking-tight text-balance text-foreground sm:text-7xl">
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
			</div>
		</section>
	);
}
