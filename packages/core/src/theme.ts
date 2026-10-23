/** A colour as the GPU wants it: linear RGB, 0 to 1. */
export type LinearColor = [r: number, g: number, b: number];

let probe: CanvasRenderingContext2D | null = null;

function srgbToLinear(channel: number): number {
	const c = channel / 255;
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * Turns any CSS colour into linear RGB: `var(--brand)`, `oklch(…)`, `#5b8cff`,
 * `color-mix(…)`. Variables are resolved from `scope`, so a hero follows the
 * theme of where it is placed. Unknown values come back as `fallback`.
 */
export function resolveColor(scope: Element, value: string, fallback: LinearColor = [0, 0, 0]): LinearColor {
	// Let the browser resolve variables and colour functions…
	const holder = document.createElement("span");
	holder.style.display = "none";
	holder.style.color = value;
	if (!holder.style.color) return fallback;
	scope.appendChild(holder);
	const computed = getComputedStyle(holder).color;
	holder.remove();

	// …then let a 1×1 canvas turn whatever it serialised into sRGB bytes.
	probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
	if (!probe) return fallback;
	probe.clearRect(0, 0, 1, 1);
	probe.fillStyle = "#000";
	probe.fillStyle = computed;
	probe.fillRect(0, 0, 1, 1);
	const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
	return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

/**
 * Splits a colour list written as one string ("var(--brand), oklch(0.7 0.2 250)")
 * on top-level commas only, so commas inside functions survive.
 */
export function splitColorList(value: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let current = "";
	for (const char of value) {
		if (char === "(") depth++;
		if (char === ")") depth = Math.max(0, depth - 1);
		if (char === "," && depth === 0) {
			if (current.trim()) parts.push(current.trim());
			current = "";
		} else {
			current += char;
		}
	}
	if (current.trim()) parts.push(current.trim());
	return parts;
}

/**
 * Runs `listener` when the page's theme may have changed: a class, `style`,
 * `data-theme` or `data-direction` on the root element, or the system colour
 * scheme. Heroes re-read their colours then.
 */
export function onThemeChange(listener: () => void): () => void {
	const observer = new MutationObserver(listener);
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme", "data-direction"] });
	const scheme = window.matchMedia?.("(prefers-color-scheme: dark)");
	scheme?.addEventListener("change", listener);
	return () => {
		observer.disconnect();
		scheme?.removeEventListener("change", listener);
	};
}
