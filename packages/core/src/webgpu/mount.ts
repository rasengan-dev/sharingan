import type { TgpuRoot } from "typegpu";
import { GpuUnavailableError, getRoot, onDeviceLost, type FallbackReason } from "./device";
import { addFrame } from "../loop";
import { onMotionPreferenceChange, readMotionMode, type MotionMode } from "../motion";
import { trackPointer, type PointerState } from "../pointer";

/** What a hero's renderer gives the runtime. Everything else is shared. */
export interface Scene {
	/** The canvas changed size, in device pixels. */
	resize(width: number, height: number): void;
	/** Advance by `delta` seconds and draw. */
	frame(time: number, delta: number, pointer: PointerState): void;
	/** Draw one repeatable still frame (reduced motion, screenshots, posters). */
	still(): void;
	destroy(): void;
}

export type SceneContext = {
	root: TgpuRoot;
	device: GPUDevice;
	context: GPUCanvasContext;
	format: GPUTextureFormat;
	canvas: HTMLCanvasElement;
	/** The element the hero is placed in: colours and the pointer are read from it. */
	host: HTMLElement;
};

export type MountOptions = {
	canvas: HTMLCanvasElement;
	host: HTMLElement;
	create: (context: SceneContext) => Scene | Promise<Scene>;
	/** Called when the hero cannot render live; show the poster. */
	onFallback?: (reason: FallbackReason) => void;
	/** Highest device-pixel ratio rendered. Default 1.5. */
	maxPixelRatio?: number;
	/**
	 * Cancels a mount still waiting for the GPU: it then never touches the
	 * canvas, which another mount may already own (React remounts effects).
	 */
	signal?: AbortSignal;
};

export type MountedScene = {
	readonly mode: MotionMode;
	/** Ask for one more frame in still modes, e.g. after a config change. */
	invalidate(): void;
	destroy(): void;
};

/**
 * Runs a hero's scene on a canvas: shared GPU device, canvas sizing, a frame
 * loop that stops when the hero is off screen, motion modes, the pointer, and
 * the fallback when WebGPU is missing or the device is lost.
 */
export async function mountScene({ canvas, host, create, onFallback, maxPixelRatio = 1.5, signal }: MountOptions): Promise<MountedScene | null> {
	let root: TgpuRoot;
	try {
		root = await getRoot();
	} catch (error) {
		if (!signal?.aborted) onFallback?.(error instanceof GpuUnavailableError ? error.reason : "error");
		return null;
	}
	if (signal?.aborted) return null;

	const context = canvas.getContext("webgpu");
	if (!context) {
		onFallback?.("unsupported");
		return null;
	}
	const format = navigator.gpu.getPreferredCanvasFormat();
	context.configure({ device: root.device, format, alphaMode: "opaque" });

	let scene: Scene;
	try {
		scene = await create({ root, device: root.device, context, format, canvas, host });
	} catch (error) {
		console.error("[sharingan] the scene could not be created", error);
		onFallback?.("error");
		return null;
	}
	if (signal?.aborted) {
		scene.destroy();
		context.unconfigure();
		return null;
	}

	let mode = readMotionMode();
	let visible = true;
	let destroyed = false;
	let stopLoop: (() => void) | null = null;
	const pointer = trackPointer(host, canvas);

	// A canvas is 300×150 before anything sizes it: wait for our first resize, which allocates the scene.
	let sized = false;
	// The still frame replays a few seconds of simulation: draw it once, again only when something changed.
	let stillIsCurrent = false;
	const drawStill = () => {
		if (destroyed || !sized || stillIsCurrent) return;
		scene.still();
		stillIsCurrent = true;
	};
	const sync = () => {
		const live = mode === "ready" && visible && !destroyed;
		if (live && !stopLoop) {
			stopLoop = addFrame((time, delta) => sized && scene.frame(time, delta, pointer.consume()));
		} else if (!live && stopLoop) {
			stopLoop();
			stopLoop = null;
		}
		if (mode !== "ready") drawStill();
	};

	// Size in device pixels, capped: a 4K screen does not need a 4K fluid.
	const resizeObserver = new ResizeObserver(() => {
		const ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
		const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
		const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
		if (sized && width === canvas.width && height === canvas.height) return;
		canvas.width = width;
		canvas.height = height;
		const firstSize = !sized;
		scene.resize(width, height);
		sized = true;
		stillIsCurrent = false;
		if (mode !== "ready") drawStill();
		// Warm start: a live hero begins from its settled still frame instead of an empty canvas.
		else if (firstSize && !destroyed) scene.still();
	});
	resizeObserver.observe(canvas);

	const visibilityObserver = new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		sync();
	});
	visibilityObserver.observe(host);

	const stopMotionWatch = onMotionPreferenceChange(() => {
		mode = readMotionMode();
		stillIsCurrent = false;
		sync();
	});
	const stopLostWatch = onDeviceLost(() => {
		destroy();
		onFallback?.("lost");
	});

	function destroy() {
		if (destroyed) return;
		destroyed = true;
		stopLoop?.();
		stopLoop = null;
		resizeObserver.disconnect();
		visibilityObserver.disconnect();
		stopMotionWatch();
		stopLostWatch();
		pointer.dispose();
		scene.destroy();
		context?.unconfigure();
	}

	sync();

	return {
		get mode() {
			return mode;
		},
		invalidate: () => {
			stillIsCurrent = false;
			if (mode !== "ready") drawStill();
		},
		destroy,
	};
}
