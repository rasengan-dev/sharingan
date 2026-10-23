import tgpu, { type TgpuRoot } from "typegpu";

/** Why a hero shows its poster instead of the live render. */
export type FallbackReason = "unsupported" | "no-adapter" | "lost" | "error";

export class GpuUnavailableError extends Error {
	// A plain field, not a parameter property: projects with `erasableSyntaxOnly` reject those.
	readonly reason: FallbackReason;

	constructor(reason: FallbackReason, message: string) {
		super(message);
		this.reason = reason;
		this.name = "GpuUnavailableError";
	}
}

let rootRequest: Promise<TgpuRoot> | null = null;
const lostListeners = new Set<() => void>();

/** Whether the browser exposes WebGPU at all (an adapter may still be missing). */
export function hasWebGpu(): boolean {
	return typeof navigator !== "undefined" && "gpu" in navigator && !!navigator.gpu;
}

/**
 * The TypeGPU root shared by every hero on the page: one adapter and one
 * device, requested once. If the device is lost, the next call requests a
 * new one and every listener of `onDeviceLost` is told.
 */
export function getRoot(): Promise<TgpuRoot> {
	if (rootRequest) return rootRequest;
	if (!hasWebGpu()) {
		return Promise.reject(new GpuUnavailableError("unsupported", "This browser does not expose WebGPU."));
	}

	// Ask for the adapter ourselves: "no GPU here" is a normal answer, not an error.
	rootRequest = navigator.gpu
		.requestAdapter({ powerPreference: "low-power" })
		.then(async (adapter) => {
			if (!adapter) throw new GpuUnavailableError("no-adapter", "No WebGPU adapter is available on this device.");
			const device = await adapter.requestDevice();
			device.lost.then(() => {
				rootRequest = null;
				lostListeners.forEach((listener) => listener());
			});
			return tgpu.initFromDevice({ device });
		})
		.catch((error: unknown) => {
			rootRequest = null;
			if (error instanceof GpuUnavailableError) throw error;
			throw new GpuUnavailableError("error", error instanceof Error ? error.message : String(error));
		});

	return rootRequest;
}

/** Called when the shared device is lost (driver reset, GPU removed). Returns an unsubscribe function. */
export function onDeviceLost(listener: () => void): () => void {
	lostListeners.add(listener);
	return () => lostListeners.delete(listener);
}
