import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { HeroStyles, join } from "../react";
import type { FallbackReason } from "./device";
import type { HeroEngine, HeroEngineOptions } from "./hero";

export type HeroCanvasProps<I> = {
	/** The hero's name, written on the wrapper (`data-sharingan`) for tests and styling. */
	name: string;
	create: (options: HeroEngineOptions<I>) => HeroEngine<I>;
	config?: I;
	fallbackStyle: (config: I | undefined) => Record<string, string>;
	/** The element the pointer is followed over. Defaults to the canvas' parent. */
	hostRef?: RefObject<HTMLElement | null>;
	className?: string;
};

/**
 * A hero's GPU layer for React: the canvas, the CSS fallback under it, and
 * the poster when WebGPU is unavailable. Place it in a positioned parent.
 * `data-state` reads `live`, or why it fell back.
 */
export function HeroCanvas<I extends { poster?: string }>({ name, create, config, fallbackStyle, hostRef, className }: HeroCanvasProps<I>) {
	const wrapper = useRef<HTMLDivElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);
	const engine = useRef<HeroEngine<I> | null>(null);
	const [fallback, setFallback] = useState<FallbackReason | null>(null);
	// Compare configs by value: an inline object literal must not restart the hero.
	const configKey = JSON.stringify(config ?? {});

	useEffect(() => {
		const host = hostRef?.current ?? wrapper.current?.parentElement ?? wrapper.current;
		if (!canvas.current || !host) return;
		engine.current = create({ canvas: canvas.current, host, config: JSON.parse(configKey), onFallback: setFallback });
		return () => {
			engine.current?.destroy();
			engine.current = null;
		};
		// The engine starts once; config changes go through setConfig below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hostRef, create]);

	useEffect(() => {
		engine.current?.setConfig(JSON.parse(configKey));
	}, [configKey]);

	const style = useMemo(() => fallbackStyle(JSON.parse(configKey)), [configKey, fallbackStyle]);

	return (
		<div ref={wrapper} aria-hidden="true" data-sharingan={name} data-state={fallback ?? "live"} className={join("sg-hero-canvas", className)} style={style}>
			<HeroStyles />
			{fallback && config?.poster && <img src={config.poster} alt="" />}
			<canvas ref={canvas} hidden={fallback !== null} />
		</div>
	);
}
