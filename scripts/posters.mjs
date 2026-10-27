#!/usr/bin/env node
/**
 * Renders each hero's and section's still frame (`?motion=final`) from the running site:
 * - apps/site/public/thumbs/<name>[-dark].webp, the whole hero (a section's top), for the collection's cards;
 * - apps/site/public/posters/<name>[-dark].webp, the background alone, for WebGPU heroes:
 *   the image shown behind the real text when WebGPU is unavailable
 *   (not for heroes whose meta says `poster: false`).
 * Each in the light theme and the dark one.
 *
 *   pnpm dev                      # in another terminal
 *   pnpm posters                  # software rendering (SwiftShader), works anywhere
 *   HEADLESS=0 pnpm posters       # a visible Chrome, on the real GPU
 *
 * SITE_URL (default http://localhost:3100) and CHROME_BIN (default google-chrome) can be set.
 */
import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const site = (process.env.SITE_URL ?? "http://localhost:3100").replace(/\/$/, "");
const only = process.argv.slice(2);
const port = 9341;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const items = ["heroes", "sections"].flatMap((folder) =>
	readdirSync(join(root, "registry", folder), { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && (only.length === 0 || only.includes(entry.name)))
		.map((entry) => {
			const meta = readFileSync(join(root, "registry", folder, entry.name, "meta.ts"), "utf8");
			return { name: entry.name, folder, engine: meta.match(/\bengine: "(\w+)"/)?.[1], poster: !/\bposter: false\b/.test(meta) };
		}),
);

const thumbs = join(root, "apps/site/public/thumbs");
const posters = join(root, "apps/site/public/posters");
mkdirSync(thumbs, { recursive: true });
mkdirSync(posters, { recursive: true });

// Chrome, driven over the DevTools protocol: no extra dependency.
const profile = join(tmpdir(), `sharingan-posters-${process.pid}`);
const visible = process.env.HEADLESS === "0";
const flags = visible
	? ["--enable-unsafe-webgpu", "--enable-features=Vulkan", "--ignore-gpu-blocklist", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"]
	: ["--headless=new", "--enable-unsafe-webgpu", "--use-webgpu-adapter=swiftshader", "--enable-features=Vulkan", "--use-angle=swiftshader"];
const chrome = spawn(process.env.CHROME_BIN ?? "google-chrome", [...flags, "--hide-scrollbars", "--no-first-run", "--no-default-browser-check", `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore", detached: true });

let targets;
for (let i = 0; i < 50 && !targets; i++) {
	try {
		targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
	} catch {
		await sleep(200);
	}
}
const socket = new WebSocket(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
await new Promise((resolve) => (socket.onopen = resolve));
let id = 0;
const pending = new Map();
socket.onmessage = (event) => {
	const message = JSON.parse(event.data);
	if (message.id && pending.has(message.id)) {
		pending.get(message.id)(message);
		pending.delete(message.id);
	}
};
const send = (method, params = {}) =>
	new Promise((resolve) => {
		const call = ++id;
		pending.set(call, resolve);
		socket.send(JSON.stringify({ id: call, method, params }));
	});
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

for (const { name, folder, engine, poster } of items) {
	await send("Page.navigate", { url: `${site}/${folder}/${name}?motion=final` });
	// A hero is ready when its engine says so (DOM) or its canvas has drawn (WebGPU); a section once its scroll scope has built.
	// A section's thumbnail is its top, 4:3: a tall section would not read on a card.
	const selector = folder === "heroes" ? "main > section" : "main [data-sharingan]";
	const box = await evaluate(`(async () => {
		for (let i = 0; i < 200; i++) {
			const section = document.querySelector(${JSON.stringify(selector)});
			const ready = section && (section.hasAttribute("data-ready") || section.hasAttribute("data-motion") || section.querySelector("[data-sharingan][data-state]"));
			if (ready) break;
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
		await new Promise((resolve) => setTimeout(resolve, 1500));
		const rect = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();
		const height = ${folder === "sections"} ? Math.min(rect.height, rect.width * 0.75) : rect.height;
		return { x: rect.x, y: rect.y + scrollY, width: rect.width, height };
	})()`);
	if (!box) {
		console.error(`✗ ${name}: nothing found at ${site}/${folder}/${name}`);
		continue;
	}
	const shoot = async (file, scale, quality) => {
		const shot = await send("Page.captureScreenshot", { format: "webp", quality, clip: { ...box, scale }, captureBeyondViewport: true });
		writeFileSync(file, Buffer.from(shot.result.data, "base64"));
	};
	// The site's own header and Customize button float over every hero: not part of it.
	await evaluate(`document.querySelectorAll("body header, main > button.fixed").forEach((node) => (node.style.visibility = "hidden"))`);
	const notes = [];
	for (const theme of ["light", "dark"]) {
		const suffix = theme === "dark" ? "-dark" : "";
		// The site's theme is a class on <html>; heroes re-read their colours when it changes.
		await evaluate(`document.documentElement.classList.toggle("dark", ${theme === "dark"}); document.documentElement.style.colorScheme = "${theme}"; new Promise((resolve) => setTimeout(resolve, 900))`);
		await evaluate(`document.querySelectorAll(".sg-hero-column").forEach((node) => (node.style.visibility = ""))`);
		await shoot(join(thumbs, `${name}${suffix}.webp`), 0.5, 80);
		notes.push(`thumb${suffix}`);
		if (engine === "webgpu" && poster) {
			// The background alone: the text is the page's own, drawn over the poster.
			await evaluate(`document.querySelectorAll(".sg-hero-column").forEach((node) => (node.style.visibility = "hidden")); new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))`);
			await shoot(join(posters, `${name}${suffix}.webp`), 1, 82);
			notes.push(`poster${suffix}`);
		}
	}
	const note = notes.join(", ");
	console.log(`✓ ${name} (${note})`);
}

socket.close();
// Chrome and its helper processes write to the profile until they have exited: stop the whole group.
await new Promise((resolve) => {
	chrome.once("exit", resolve);
	try {
		process.kill(-chrome.pid);
	} catch {
		chrome.kill();
	}
});
rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
