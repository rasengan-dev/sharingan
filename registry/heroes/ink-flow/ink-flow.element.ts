import { splitColorList, type FallbackReason } from "@/lib/sharingan";
import { createInkFlow, type InkFlowHandle } from "./engine";
import { inkFlowFallbackStyle } from "./fallback";
import type { InkFlowConfigInput } from "./schema";

const ATTRIBUTES = ["colors", "background", "swirl", "ink-fade", "flow-fade", "ambient", "pointer", "calm", "detail", "poster"] as const;

const STYLE = `
:host { display: block; position: relative; isolation: isolate; overflow: hidden; }
.layer { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
canvas, img { display: block; width: 100%; height: 100%; object-fit: cover; }
[hidden] { display: none !important; }
`;

/**
 * `<sg-ink-flow>`: Ink flow for any page, no framework. Its children are the
 * hero's content and stay in the page's DOM; the ink is drawn behind them.
 *
 *   <sg-ink-flow colors="var(--brand), oklch(0.72 0.19 330)" swirl="30">
 *     <h1>Get paid before your morning coffee</h1>
 *   </sg-ink-flow>
 *
 * The class is created inside `defineInkFlowElement()`: `HTMLElement` does
 * not exist during server rendering, so nothing here may touch it at import.
 */
export function defineInkFlowElement(tag = "sg-ink-flow") {
	if (typeof customElements === "undefined" || customElements.get(tag)) return;

	class SgInkFlow extends HTMLElement {
		static observedAttributes = [...ATTRIBUTES];

		private engine: InkFlowHandle | null = null;
		private readonly canvas: HTMLCanvasElement;
		private readonly poster: HTMLImageElement;
		private readonly layer: HTMLDivElement;

		constructor() {
			super();
			const shadow = this.attachShadow({ mode: "open" });
			const style = document.createElement("style");
			style.textContent = STYLE;
			this.layer = document.createElement("div");
			this.layer.className = "layer";
			this.layer.setAttribute("aria-hidden", "true");
			this.layer.part.add("background");
			this.poster = document.createElement("img");
			this.poster.alt = "";
			this.poster.hidden = true;
			this.canvas = document.createElement("canvas");
			this.layer.append(this.poster, this.canvas);
			shadow.append(style, this.layer, document.createElement("slot"));
		}

		/** The attributes, as the engine's config. Missing ones keep their defaults. */
		get config(): InkFlowConfigInput {
			const number = (name: string) => (this.hasAttribute(name) ? Number(this.getAttribute(name)) : undefined);
			const flag = (name: string) => (this.hasAttribute(name) ? this.getAttribute(name) !== "false" : undefined);
			const colors = this.getAttribute("colors");
			const detail = this.getAttribute("detail");
			return {
				colors: colors ? splitColorList(colors) : undefined,
				background: this.getAttribute("background") ?? undefined,
				swirl: number("swirl"),
				inkFade: number("ink-fade"),
				flowFade: number("flow-fade"),
				ambient: flag("ambient"),
				pointer: flag("pointer"),
				calm: number("calm"),
				detail: detail === "low" || detail === "medium" || detail === "high" ? detail : undefined,
				poster: this.getAttribute("poster") ?? undefined,
			};
		}

		connectedCallback() {
			Object.assign(this.layer.style, inkFlowFallbackStyle(this.config));
			this.engine = createInkFlow({
				canvas: this.canvas,
				host: this,
				config: this.config,
				onFallback: (reason: FallbackReason) => this.showFallback(reason),
			});
		}

		disconnectedCallback() {
			this.engine?.destroy();
			this.engine = null;
		}

		attributeChangedCallback() {
			Object.assign(this.layer.style, inkFlowFallbackStyle(this.config));
			this.engine?.setConfig(this.config);
		}

		private showFallback(reason: FallbackReason) {
			this.dataset.state = reason;
			this.canvas.hidden = true;
			const poster = this.getAttribute("poster");
			if (poster) {
				this.poster.src = poster;
				this.poster.hidden = false;
			}
		}
	}
	customElements.define(tag, SgInkFlow);
}
