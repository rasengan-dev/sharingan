/** Pointer over a hero, in the canvas' own space: x and y from 0 to 1, y pointing down. */
export type PointerState = {
	x: number;
	y: number;
	/** Movement since the previous frame, in the same units. */
	dx: number;
	dy: number;
	/** The pointer is over the hero. */
	inside: boolean;
	/** A button or a finger is down. */
	down: boolean;
};

/**
 * Follows the pointer over `host` (the whole hero, so its text and buttons
 * keep their own events) and maps it onto `canvas`. Call `consume()` once per
 * frame to read the movement and reset it.
 */
export function trackPointer(host: HTMLElement, canvas: HTMLCanvasElement) {
	const state: PointerState = { x: 0.5, y: 0.5, dx: 0, dy: 0, inside: false, down: false };

	const move = (event: PointerEvent) => {
		const box = canvas.getBoundingClientRect();
		if (box.width === 0 || box.height === 0) return;
		const x = (event.clientX - box.left) / box.width;
		const y = (event.clientY - box.top) / box.height;
		if (state.inside) {
			state.dx += x - state.x;
			state.dy += y - state.y;
		}
		state.x = x;
		state.y = y;
		state.inside = true;
	};
	const leave = () => {
		state.inside = false;
		state.down = false;
	};
	const down = (event: PointerEvent) => {
		move(event);
		state.down = true;
	};
	const up = () => {
		state.down = false;
	};

	host.addEventListener("pointermove", move, { passive: true });
	host.addEventListener("pointerdown", down, { passive: true });
	host.addEventListener("pointerup", up, { passive: true });
	host.addEventListener("pointerleave", leave, { passive: true });
	host.addEventListener("pointercancel", leave, { passive: true });

	return {
		state,
		consume(): PointerState {
			const snapshot = { ...state };
			state.dx = 0;
			state.dy = 0;
			return snapshot;
		},
		dispose() {
			host.removeEventListener("pointermove", move);
			host.removeEventListener("pointerdown", down);
			host.removeEventListener("pointerup", up);
			host.removeEventListener("pointerleave", leave);
			host.removeEventListener("pointercancel", leave);
		},
	};
}
