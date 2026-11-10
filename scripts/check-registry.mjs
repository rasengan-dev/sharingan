#!/usr/bin/env node
/**
 * Checks the built registry before it ships: every item of registry.json has its /r/<name>.json in the site's
 * build output, and every registryDependency points at the public address and at an item that exists.
 *
 *   pnpm check:registry          # after pnpm build
 *
 * It catches the two ways the registry broke before: /r missing from the deploy, and items pointing at
 * http://localhost:3100 because the build ran without SHARINGAN_URL.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const out = join(root, "apps/site/dist/client/r");
const base = (process.env.SHARINGAN_URL || "https://sharingan.hiraiship.app").replace(/\/$/, "");
const problems = [];

if (!existsSync(out)) {
	console.error(`✗ ${out} does not exist: the site build did not include the registry.`);
	process.exit(1);
}

const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));
const built = new Set(readdirSync(out).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)));

for (const item of registry.items) {
	if (!built.has(item.name)) problems.push(`${item.name}: missing from the build output (r/${item.name}.json)`);
	const file = join(out, `${item.name}.json`);
	if (!existsSync(file)) continue;
	const json = JSON.parse(readFileSync(file, "utf8"));
	for (const dep of json.registryDependencies ?? []) {
		if (!dep.startsWith(`${base}/r/`)) {
			problems.push(`${item.name}: registryDependency ${dep} is not under ${base}/r/`);
			continue;
		}
		const name = dep.slice(`${base}/r/`.length).replace(/\.json$/, "");
		if (!built.has(name)) problems.push(`${item.name}: registryDependency ${name} is not in the registry`);
	}
	if ((json.files ?? []).length === 0) problems.push(`${item.name}: no files`);
}

if (problems.length) {
	console.error(`✗ The registry has ${problems.length} problem(s):\n  - ${problems.join("\n  - ")}`);
	process.exit(1);
}
console.log(`✓ Registry: ${registry.items.length} items in apps/site/dist/client/r, all pointing at ${base}.`);
