import type { FallbackReason } from "./device";
import type { HeroEngine, HeroEngineOptions } from "./hero";
import { splitColorList } from "../theme";

/** How an attribute is read: `colors` splits a colour list on top-level commas. */
export type AttributeKind = "string" | "number" | "boolean" | "colors";

export type HeroElementSpec<I> = {
	tag: string;
	/** Attribute names (kebab-case) and how to read them; they become camelCase config keys. */
	attributes: Record<string, AttributeKind>;
	create: (options: HeroEngineOptions<I>) => HeroEngine<I>;
	/** CSS shown behind the canvas, and instead of it when WebGPU is unavailable. */
	fallbackStyle: (config: I) => Record<string, string>;
};

const STYLE = `
:host { display: block; position: relative; isolation: isolate; overflow: hidden; }
.layer { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
canvas, img { display: block; width: 100%; height: 100%; object-fit: cover; }
[hidden] { display: none !important; }
`;

const camel = (name: string) => name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

function readConfig<I>(element: HTMLElement, attributes: HeroElementSpec<I>["attributes"]): I {
	const config: Record<string, unknown> = {};
	for (const [name, kind] of Object.entries(attributes)) {
		const value = element.getAttribute(name);
		if (value === null) continue;
		config[camel(name)] =
			kind === "number" ? Number(value) : kind === "boolean" ? value !== "false" : kind === "colors" ? splitColorList(value) : value;
	}
	return config as I;
}

/**
 * Defines a hero's custom element. Its children are the hero's content and
 * stay in the page's DOM; the canvas sits behind them in the shadow root.
 * The class is created here, at call time: `HTMLElement` does not exist
 * during server rendering, so a hero module may be imported anywhere.
 */
export function defineHeroElement<I>(spec: HeroElementSpec<I>) {
	if (typeof customElements === "undefined" || customElements.get(spec.tag)) return;

	class SharinganHeroElement extends HTMLElement {
		static observedAttributes = Object.keys(spec.attributes);

		private engine: HeroEngine<I> | null = null;
		private readonly layer = document.createElement("div");
		private readonly canvas = document.createElement("canvas");
		private readonly poster = document.createElement("img");

		constructor() {
			super();
			const shadow = this.attachShadow({ mode: "open" });
			const style = document.createElement("style");
			style.textContent = STYLE;
			this.layer.className = "layer";
			this.layer.setAttribute("aria-hidden", "true");
			this.layer.part.add("background");
			this.poster.alt = "";
			this.poster.hidden = true;
			this.layer.append(this.poster, this.canvas);
			shadow.append(style, this.layer, document.createElement("slot"));
		}

		get config(): I {
			return readConfig<I>(this, spec.attributes);
		}

		connectedCallback() {
			Object.assign(this.layer.style, spec.fallbackStyle(this.config));
			this.engine = spec.create({
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
			Object.assign(this.layer.style, spec.fallbackStyle(this.config));
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

	customElements.define(spec.tag, SharinganHeroElement);
}
