import type { FallbackReason } from "./device";
import { mountScene, type MountedScene, type Scene, type SceneContext } from "./mount";
import { onThemeChange, resolveColor, type LinearColor } from "./theme";

/** Every hero's config has colours and a background, as CSS colours. */
export type HeroBaseConfig = { colors: string[]; background: string };

/** A hero's config with its colours already turned into linear RGB. */
export type HeroResolved<C extends HeroBaseConfig> = {
	config: C;
	palette: LinearColor[];
	background: LinearColor;
	/** 0 for a black background, 1 for white: heroes adapt their blending to it. */
	luminance: number;
};

export type HeroEngine<I> = {
	/** Change the look or behaviour; colours are read again from the page. */
	setConfig(next: I | undefined): void;
	destroy(): void;
};

export type HeroEngineOptions<I> = {
	canvas: HTMLCanvasElement;
	/** The hero element: the pointer is followed over it and CSS colours are resolved from it. */
	host: HTMLElement;
	config?: I;
	onFallback?: (reason: FallbackReason) => void;
};

/** What a hero must provide; the rest of its lifecycle is shared. */
export type HeroDefinition<I, C extends HeroBaseConfig> = {
	/** Validates the input and fills defaults (a Zod schema's `parse`). */
	parse: (input: I | undefined) => C;
	createScene: (context: SceneContext, current: () => HeroResolved<C>) => Scene | Promise<Scene>;
	maxPixelRatio?: number;
};

/**
 * Starts a hero on a canvas: parses its config, resolves its colours from
 * the page (and again when the theme changes), mounts its scene, and cleans
 * up. Each hero's `createX()` is this function with its own definition.
 */
export function createHeroEngine<I, C extends HeroBaseConfig>(
	{ canvas, host, config, onFallback }: HeroEngineOptions<I>,
	hero: HeroDefinition<I, C>,
): HeroEngine<I> {
	const resolve = (input: I | undefined): HeroResolved<C> => {
		const parsed = hero.parse(input);
		const background = resolveColor(host, parsed.background, [0.004, 0.004, 0.006]);
		return {
			config: parsed,
			palette: parsed.colors.map((color) => resolveColor(host, color, [0.35, 0.55, 1])),
			background,
			luminance: 0.2126 * background[0] + 0.7152 * background[1] + 0.0722 * background[2],
		};
	};

	let input = config;
	let resolved = resolve(input);
	let mounted: MountedScene | null = null;
	const cancel = new AbortController();

	const stopTheme = onThemeChange(() => {
		resolved = resolve(input);
		mounted?.invalidate();
	});

	mountScene({
		canvas,
		host,
		onFallback,
		signal: cancel.signal,
		maxPixelRatio: hero.maxPixelRatio,
		create: (context) => hero.createScene(context, () => resolved),
	}).then((scene) => {
		mounted = scene;
	});

	return {
		setConfig(next) {
			input = next;
			resolved = resolve(input);
			mounted?.invalidate();
		},
		destroy() {
			cancel.abort();
			stopTheme();
			mounted?.destroy();
		},
	};
}

/**
 * What shows without WebGPU (and before it starts): a gradient drawn by CSS
 * from the hero's own colours. Works with CSS variables, so it follows the
 * theme like the live render does.
 */
export function fallbackGradient(colors: string[], background: string) {
	const [a, b = a, c = b] = colors;
	return {
		backgroundColor: background,
		backgroundImage: [
			`radial-gradient(45% 55% at 22% 30%, color-mix(in oklab, ${a} 55%, transparent), transparent)`,
			`radial-gradient(40% 50% at 80% 65%, color-mix(in oklab, ${b} 45%, transparent), transparent)`,
			`radial-gradient(35% 40% at 55% 95%, color-mix(in oklab, ${c} 40%, transparent), transparent)`,
		].join(", "),
	};
}
