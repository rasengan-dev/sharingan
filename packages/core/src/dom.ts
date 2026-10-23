import { readAttributes, type AttributeKind } from "./attributes";

/** A DOM hero's behaviour, wired onto markup that is already in the page. */
export type DomHero<I> = {
	setConfig(next: I | undefined): void;
	destroy(): void;
};

export type DomHeroOptions<I> = {
	/** The hero's root element; its markup follows the hero's own contract. */
	host: HTMLElement;
	config?: I;
};

const adopted = new WeakMap<Document | ShadowRoot, Set<string>>();

/**
 * Adds a hero's stylesheet once to the document (or shadow root) `host`
 * lives in. DOM heroes keep their content in the page's DOM, so their
 * styles are scoped by class prefix rather than by a shadow root.
 */
export function adoptStyles(host: Node, id: string, css: string) {
	const root = host.getRootNode() as Document | ShadowRoot;
	const ids = adopted.get(root) ?? new Set();
	adopted.set(root, ids);
	if (ids.has(id)) return;
	ids.add(id);
	// React 19 may already have hoisted it: <style href={id} precedence="…">.
	if (root.querySelector(`style[data-href~="${id}"]`)) return;
	const style = document.createElement("style");
	style.dataset.sharingan = id;
	style.textContent = css;
	(root instanceof Document ? root.head : root).append(style);
}

/** Typing in a field must never drive a hero's keyboard controls. */
export function isEditable(target: EventTarget | null) {
	return target instanceof HTMLElement && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName));
}

/**
 * Follows how much of `host` is on screen (0 to 1). Heroes listen to the
 * whole page's keyboard only while they are mostly visible.
 */
export function trackVisibility(host: Element, onChange?: (ratio: number) => void) {
	const state = { ratio: 0 };
	const observer = new IntersectionObserver(
		([entry]) => {
			state.ratio = entry?.intersectionRatio ?? 0;
			onChange?.(state.ratio);
		},
		{ threshold: [0, 0.25, 0.5, 0.75, 1] },
	);
	observer.observe(host);
	return { state, dispose: () => observer.disconnect() };
}

export type DomElementSpec<I> = {
	tag: string;
	attributes: Record<string, AttributeKind>;
	create: (options: DomHeroOptions<I>) => DomHero<I>;
};

/**
 * Defines a DOM hero's custom element. There is no shadow root: the
 * element's children are the hero's markup, in the page's DOM, and the hero
 * adds what it draws (the object, its controls) next to them. Created at
 * call time, since `HTMLElement` does not exist during server rendering.
 */
export function defineDomElement<I>(spec: DomElementSpec<I>) {
	if (typeof customElements === "undefined" || customElements.get(spec.tag)) return;

	class SharinganDomElement extends HTMLElement {
		static observedAttributes = Object.keys(spec.attributes);
		// `#`: a prop named like a plain field would be set on it by React instead of as an attribute.
		#hero: DomHero<I> | null = null;

		connectedCallback() {
			this.#hero = spec.create({ host: this, config: readAttributes<I>(this, spec.attributes) });
		}

		disconnectedCallback() {
			this.#hero?.destroy();
			this.#hero = null;
		}

		attributeChangedCallback() {
			this.#hero?.setConfig(readAttributes<I>(this, spec.attributes));
		}
	}

	customElements.define(spec.tag, SharinganDomElement);
}
