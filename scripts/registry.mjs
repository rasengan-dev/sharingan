#!/usr/bin/env node
/**
 * Writes registry.json from the sources, then builds it with the shadcn CLI
 * into apps/site/public/r, where the site serves it.
 *
 *   SHARINGAN_URL=https://example.com pnpm registry
 *
 * SHARINGAN_URL is where the site (and so /r/*.json) will be served; items
 * point at each other through it. It defaults to the local dev server.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const base = (process.env.SHARINGAN_URL || "http://localhost:3100").replace(/\/$/, "");
const url = (name) => `${base}/r/${name}.json`;

const files = (dir, target, type) =>
	readdirSync(join(root, dir), { withFileTypes: true })
		.filter((entry) => entry.isFile() && /\.(ts|tsx)$/.test(entry.name))
		.map((entry) => ({ path: `${dir}/${entry.name}`, type, target: `${target}/${entry.name}` }));

/** Reads a field from a hero's meta.ts without running TypeScript. */
const field = (source, name) => source.match(new RegExp(`\\b${name}: "([^"]*)"`))?.[1];

const items = [
	{
		name: "sharingan-core",
		type: "registry:lib",
		title: "Sharingan core",
		description: "What every Sharingan hero shares: frame loop, motion modes, pointer, theme colours, DOM helpers and the React hero layout.",
		dependencies: [],
		files: files("packages/core/src", "lib/sharingan", "registry:lib"),
	},
	{
		name: "sharingan-webgpu",
		type: "registry:lib",
		title: "Sharingan WebGPU engine",
		description: "The WebGPU engine of Sharingan heroes: GPU device, scene lifecycle, CSS fallback and shared WGSL. Only WebGPU heroes need it.",
		dependencies: ["typegpu@0.12.8"],
		devDependencies: ["@webgpu/types"],
		registryDependencies: [url("sharingan-core")],
		files: files("packages/core/src/webgpu", "lib/sharingan/webgpu", "registry:lib"),
	},
];

const heroes = readdirSync(join(root, "registry/heroes"), { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name)
	.sort();

for (const name of heroes) {
	const meta = readFileSync(join(root, "registry/heroes", name, "meta.ts"), "utf8");
	const engine = field(meta, "engine");
	if (engine !== "webgpu" && engine !== "dom") throw new Error(`${name}: meta.engine must be "webgpu" or "dom"`);
	items.push({
		name,
		type: "registry:block",
		title: field(meta, "title"),
		description: field(meta, "summary"),
		categories: ["hero", engine],
		meta: { engine },
		dependencies: engine === "webgpu" ? ["zod", "typegpu@0.12.8"] : ["zod"],
		registryDependencies: [url(engine === "webgpu" ? "sharingan-webgpu" : "sharingan-core")],
		files: files(`registry/heroes/${name}`, `components/heroes/${name}`, "registry:component"),
	});
}

const registry = { $schema: "https://ui.shadcn.com/schema/registry.json", name: "sharingan", homepage: base, items };
writeFileSync(join(root, "registry.json"), `${JSON.stringify(registry, null, "\t")}\n`);
console.log(`registry.json: ${items.length} items (${heroes.length} heroes), base ${base}`);

execFileSync("npx", ["--yes", "shadcn@4.22.1", "build", "registry.json", "--output", "apps/site/public/r"], { cwd: root, stdio: "inherit" });
