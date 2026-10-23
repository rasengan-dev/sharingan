import { splitColorList } from "./theme";

/** How an attribute is read: `colors` splits a colour list on top-level commas. */
export type AttributeKind = "string" | "number" | "boolean" | "colors";

const camel = (name: string) => name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

/** Reads a custom element's attributes (kebab-case) into a config (camelCase keys). */
export function readAttributes<I>(element: HTMLElement, attributes: Record<string, AttributeKind>): I {
	const config: Record<string, unknown> = {};
	for (const [name, kind] of Object.entries(attributes)) {
		const value = element.getAttribute(name);
		if (value === null) continue;
		config[camel(name)] =
			kind === "number" ? Number(value) : kind === "boolean" ? value !== "false" : kind === "colors" ? splitColorList(value) : value;
	}
	return config as I;
}
