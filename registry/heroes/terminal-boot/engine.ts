import { adoptStyles, onMotionPreferenceChange, readMotionMode, trackVisibility, type DomHero, type DomHeroOptions, type MotionMode } from "@/lib/sharingan";
import { terminalBootConfigSchema, type TerminalBootConfig, type TerminalBootConfigInput } from "./schema";
import { TERMINAL_BOOT_STYLE_ID, terminalBootStyles } from "./styles";

/**
 * Markup the engine expects inside the host:
 * - `[data-sg-command]`, the command's full text;
 * - `[data-sg-line]` elements (with `data-status` and a `[data-sg-icon]`), then an optional `[data-sg-done]`;
 * - optionally `[data-sg-actions]` for the copy and replay buttons, and `[data-sg-product]` for the reveal.
 * Everything stays in the DOM; the engine only decides what is shown when.
 */

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const ICONS: Record<string, string> = { ok: "✔", info: "›", warn: "!", muted: "·" };
// The same rhythm on every run, so replays and recordings match.
const hash = (n: number) => {
	const x = Math.sin(n * 91.345) * 47453.5453;
	return x - Math.floor(x);
};

/** Terminal boot (Sharingan, DOM). A command is typed, runs, and the product rises from it. */
export function createTerminalBoot({ host, config }: DomHeroOptions<TerminalBootConfigInput>): DomHero<TerminalBootConfigInput> {
	adoptStyles(host, TERMINAL_BOOT_STYLE_ID, terminalBootStyles);
	host.classList.add("sg-tb");

	let settings: TerminalBootConfig = terminalBootConfigSchema.parse(config ?? {});
	let mode: MotionMode = readMotionMode();
	const cancel = new AbortController();
	const { signal } = cancel;

	const command = host.querySelector<HTMLElement>("[data-sg-command]");
	const lines = [...host.querySelectorAll<HTMLElement>("[data-sg-line]")];
	const done = host.querySelector<HTMLElement>("[data-sg-done]");
	const product = host.querySelector<HTMLElement>("[data-sg-product]");
	product?.classList.add("sg-tb-product");
	host.toggleAttribute("data-has-product", product !== null);
	const commandText = command?.textContent ?? "";

	// Caret after the command
	const caret = document.createElement("span");
	caret.className = "sg-tb-caret";
	caret.setAttribute("aria-hidden", "true");
	command?.after(caret);

	// Copy and replay
	const actions = host.querySelector<HTMLElement>("[data-sg-actions]");
	const createdActions: HTMLElement[] = [];
	const makeButton = (label: string) => {
		const button = document.createElement("button");
		button.type = "button";
		button.textContent = label;
		actions?.append(button);
		createdActions.push(button);
		return button;
	};
	const copyButton = makeButton("Copy");
	copyButton.setAttribute("aria-label", `Copy the command: ${commandText}`);
	const replayButton = makeButton("Replay");
	replayButton.hidden = true;

	const timers = new Set<number>();
	const later = (ms: number, run: () => void) => {
		const timer = window.setTimeout(() => {
			timers.delete(timer);
			run();
		}, ms);
		timers.add(timer);
		return timer;
	};
	const clearTimers = () => {
		timers.forEach((timer) => window.clearTimeout(timer));
		timers.clear();
	};

	let copiedTimer = 0;
	copyButton.addEventListener(
		"click",
		async () => {
			try {
				await navigator.clipboard.writeText(commandText);
				copyButton.textContent = "Copied";
			} catch {
				// No clipboard access (insecure page, permissions): select the command instead.
				if (command) getSelection()?.selectAllChildren(command);
				copyButton.textContent = "Selected";
			}
			window.clearTimeout(copiedTimer);
			copiedTimer = later(1600, () => (copyButton.textContent = "Copy"));
		},
		{ signal },
	);

	const applyLook = () => {
		host.style.setProperty("--sg-tb-accent", settings.accent);
		host.dataset.motion = mode;
		copyButton.hidden = !settings.copy;
	};
	applyLook();

	const setTyped = (count: number) => command?.style.setProperty("width", `${count}ch`);
	const icon = (line: HTMLElement) => line.querySelector<HTMLElement>("[data-sg-icon]");

	/** Everything printed and the product shown: the final state, also used for still modes. */
	const finish = () => {
		command?.style.removeProperty("width");
		for (const line of [...lines, done]) {
			if (!line) continue;
			line.classList.add("is-shown");
			line.classList.remove("is-spinning");
			const mark = icon(line);
			if (mark) mark.textContent = ICONS[line.dataset.status ?? "ok"] ?? "›";
		}
		product?.classList.add("is-shown");
		host.dataset.run = "done";
		replayButton.hidden = mode !== "ready";
	};

	const reset = () => {
		clearTimers();
		for (const line of [...lines, done]) line?.classList.remove("is-shown", "is-spinning");
		product?.classList.remove("is-shown");
		setTyped(0);
		replayButton.hidden = true;
		host.dataset.run = "typing";
	};

	const run = () => {
		reset();
		let at = 500;
		// Typing, with a slightly uneven hand
		for (let i = 1; i <= commandText.length; i++) {
			at += (1000 / settings.speed) * (0.55 + hash(i) * 0.9);
			later(at, () => setTyped(i));
		}
		at += 450;
		later(at, () => (host.dataset.run = "running"));
		// Output: `ok` lines spin first, the others just appear
		lines.forEach((line, index) => {
			const status = line.dataset.status ?? "ok";
			at += 140;
			later(at, () => {
				line.classList.add("is-shown");
				const mark = icon(line);
				if (status !== "ok" || !mark) {
					if (mark) mark.textContent = ICONS[status] ?? "›";
					return;
				}
				line.classList.add("is-spinning");
				let frame = 0;
				const spin = window.setInterval(() => (mark.textContent = SPINNER[frame++ % SPINNER.length]), 80);
				timers.add(spin);
				later(350 + hash(index + 40) * 650, () => {
					window.clearInterval(spin);
					timers.delete(spin);
					line.classList.remove("is-spinning");
					mark.textContent = ICONS.ok;
				});
			});
			if (status === "ok") at += 350 + hash(index + 40) * 650;
		});
		at += 300;
		later(at, () => {
			if (done) {
				done.classList.add("is-shown");
				const mark = icon(done);
				if (mark) mark.textContent = "➜";
			}
		});
		at += 500;
		later(at, () => {
			finish();
			if (settings.loop) later(7000, run);
		});
	};

	replayButton.addEventListener("click", () => run(), { signal });

	// Start the first time the terminal is mostly on screen
	let started = false;
	const visibility = trackVisibility(host, (ratio) => {
		if (!started && mode === "ready" && ratio >= 0.4) {
			started = true;
			run();
		}
	});

	if (mode === "ready") {
		host.dataset.run = "typing";
		setTyped(0);
	} else finish();
	host.dataset.ready = "";

	const stopMotion = onMotionPreferenceChange(() => {
		mode = readMotionMode();
		applyLook();
		if (mode !== "ready") {
			clearTimers();
			finish();
		}
	});

	return {
		setConfig(next) {
			settings = terminalBootConfigSchema.parse(next ?? {});
			applyLook();
		},
		destroy() {
			cancel.abort();
			clearTimers();
			stopMotion();
			visibility.dispose();
			caret.remove();
			createdActions.forEach((button) => button.remove());
			command?.style.removeProperty("width");
			for (const line of [...lines, done]) line?.classList.remove("is-shown", "is-spinning");
			product?.classList.remove("is-shown");
			delete host.dataset.run;
			delete host.dataset.ready;
			host.removeAttribute("data-has-product");
		},
	};
}
