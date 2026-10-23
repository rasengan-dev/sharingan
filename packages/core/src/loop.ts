/** Seconds since the loop started, and since the previous frame (clamped). */
export type FrameCallback = (time: number, delta: number) => void;

const callbacks = new Set<FrameCallback>();
let handle = 0;
let start = 0;
let last = 0;

// Longer gaps (a tab switch, a breakpoint) would make simulations explode.
const MAX_DELTA = 1 / 30;

function tick(now: number) {
	const time = (now - start) / 1000;
	const delta = Math.min(MAX_DELTA, Math.max(0, (now - last) / 1000));
	last = now;
	callbacks.forEach((callback) => callback(time, delta));
	handle = callbacks.size > 0 ? requestAnimationFrame(tick) : 0;
}

/**
 * One requestAnimationFrame loop for every hero on the page. It only runs
 * while at least one callback is registered; the browser already stops it in
 * hidden tabs. Returns a function that removes the callback.
 */
export function addFrame(callback: FrameCallback): () => void {
	callbacks.add(callback);
	if (!handle) {
		start ||= performance.now();
		last = performance.now();
		handle = requestAnimationFrame(tick);
	}
	return () => {
		callbacks.delete(callback);
		if (callbacks.size === 0 && handle) {
			cancelAnimationFrame(handle);
			handle = 0;
		}
	};
}
