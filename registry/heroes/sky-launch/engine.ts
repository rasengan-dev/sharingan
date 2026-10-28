import {
	addFrame,
	adoptStyles,
	onMotionPreferenceChange,
	onThemeChange,
	readMotionMode,
	resolveColor,
	trackVisibility,
	type DomHero,
	type DomHeroOptions,
	type MotionMode,
} from "@/lib/sharingan";
import { skyLaunchConfigSchema, type SkyLaunchConfig, type SkyLaunchConfigInput } from "./schema";
import { SKY_LAUNCH_STYLE_ID, skyLaunchStyles } from "./styles";

/**
 * Markup the engine expects inside the host: the hero's copy (an optional
 * eyebrow, an `h1` or `h2`, then what follows it), and optionally a `[data-sg-sky]`
 * layer with the sun, the three `.sg-sl-cloud` banks and the `.sg-sl-ship`
 * (so the sky shows before the script runs). Missing parts are added.
 */

/** The rocket: a white body, a window in the sun's colour, fins and a flame. */
const ROCKET = `<svg class="sg-sl-rocket" viewBox="0 0 34 68" aria-hidden="true"><path class="sg-sl-flame" d="M12 50 Q17 68 22 50Z" fill="#ffc98f"/><path d="M17 1 C26 10 28 26 26 46 L8 46 C6 26 8 10 17 1Z" fill="#fff"/><path d="M8 32 L1 50 L8 46Z M26 32 L33 50 L26 46Z" fill="#fff"/><path d="M11 46 h12 v4 h-12Z" fill="#e8e4e1"/><circle cx="17" cy="22" r="5" fill="var(--sg-sl-sun)" stroke="#fff" stroke-width="2"/></svg>`;

const SKY = `<div class="sg-sl-sun"></div><div class="sg-sl-cloud" data-layer="back"></div><div class="sg-sl-ship">${ROCKET}<div class="sg-sl-trail"></div></div><div class="sg-sl-cloud" data-layer="middle"></div><div class="sg-sl-cloud" data-layer="front"></div><div class="sg-sl-veil"></div>`;

/** The stylesheet's fallback reveal waits this long (ms) before showing the copy. */
const REVEAL_DELAY = 2000;

/**
 * Whether the stylesheet's fallback reveal is already on screen. Read from the real clock, not from
 * the copy's opacity: the reveal runs on the compositor, so while a heavy page keeps the main thread
 * busy it shows on screen, yet the animation clock the main thread reads stands still until the next
 * frame and still reports the copy as hidden.
 */
function revealHasBegun(element: Element | null) {
	if (!element) return false;
	const reveal = element.getAnimations().find((animation) => animation instanceof CSSAnimation && animation.animationName === "sg-sl-reveal");
	if (reveal?.startTime != null) return performance.now() - Number(reveal.startTime) >= REVEAL_DELAY - 100;
	return parseFloat(getComputedStyle(element).opacity) > 0.01;
}

/** Sky launch (Sharingan, DOM). A rocket takes off through the sun; the clouds rise as the page scrolls on. */
export function createSkyLaunch({ host, config }: DomHeroOptions<SkyLaunchConfigInput>): DomHero<SkyLaunchConfigInput> {
	adoptStyles(host, SKY_LAUNCH_STYLE_ID, skyLaunchStyles);
	host.classList.add("sg-sl");

	let settings: SkyLaunchConfig = skyLaunchConfigSchema.parse(config ?? {});
	let mode: MotionMode = readMotionMode();
	const cancel = new AbortController();
	const { signal } = cancel;
	const created: Element[] = [];

	let sky = host.querySelector<HTMLElement>("[data-sg-sky]");
	if (!sky) {
		sky = document.createElement("div");
		sky.dataset.sgSky = "";
		sky.innerHTML = SKY;
		host.prepend(sky);
		created.push(sky);
	}
	sky.classList.add("sg-sl-sky");
	sky.setAttribute("aria-hidden", "true");

	// The copy: the headline's words, for the intro, and what follows it.
	const headline = host.querySelector("h1, h2");
	const copy = headline?.parentElement ?? null;
	copy?.classList.add("sg-sl-copy");
	const headlineText = headline?.textContent ?? "";
	// React renders the words itself; for a Web Component they are split here, and put back on destroy.
	const splitHere = Boolean(headline && !headline.querySelector(".sg-sl-word"));
	if (headline && splitHere) {
		const words = headlineText.trim().split(/\s+/);
		headline.replaceChildren(
			...words.flatMap((word, index) => {
				const span = document.createElement("span");
				span.className = "sg-sl-word";
				span.style.setProperty("--i", String(index));
				span.textContent = word;
				return index === 0 ? [span] : [document.createTextNode(" "), span];
			}),
		);
	}
	let after = false;
	for (const child of copy ? [...copy.children] : []) {
		if (child === headline) after = true;
		else if (after) child.classList.add("sg-sl-after");
	}

	// What moves on the way out.
	const rising = [...sky.querySelectorAll<HTMLElement>(".sg-sl-cloud"), ...(copy ? [copy] : [])];

	const applyLook = () => {
		host.dataset.motion = mode;
		host.style.setProperty("--sg-sl-sun", settings.sun);
		host.style.setProperty("--sg-sl-sky", settings.sky);
		host.style.setProperty("--sg-sl-clouds", settings.clouds);
		host.style.setProperty("--sg-sl-launch", `${settings.launch}s`);
		host.toggleAttribute("data-rocket-off", !settings.rocket);
		// The page's own dark class is read by the stylesheet; this covers dark pages without it.
		const [r, g, b] = resolveColor(host, getComputedStyle(host).getPropertyValue("--sg-sl-bg") || "white", [1, 1, 1]);
		if (0.2126 * r + 0.7152 * g + 0.0722 * b < 0.18) host.dataset.tone = "dark";
		else delete host.dataset.tone;
	};
	applyLook();
	const stopTheme = onThemeChange(applyLook);

	// The intro plays once, with motion on, from where the stylesheet holds the copy and the rocket
	// until now. If the stylesheet's own reveal has already begun (the script came late), the copy is
	// on screen: hiding it to replay the intro would flash it, so that reveal runs to its end instead.
	const late = revealHasBegun(copy?.firstElementChild ?? null);
	if (mode === "ready" && !late) host.dataset.intro = "play";

	// On the way out: how far the hero has scrolled past, 0 to 1, written once per frame.
	let stopFrame: (() => void) | null = null;
	let exit = -1;
	const writeExit = () => {
		stopFrame?.();
		stopFrame = null;
		const box = host.getBoundingClientRect();
		const next = settings.exit && mode === "ready" ? Math.min(1, Math.max(0, -box.top / box.height)) : 0;
		if (Math.abs(next - exit) < 0.001) return;
		exit = next;
		rising.forEach((element) => (next > 0 ? element.style.setProperty("--exit", next.toFixed(4)) : element.style.removeProperty("--exit")));
	};
	window.addEventListener(
		"scroll",
		() => {
			if (!stopFrame) stopFrame = addFrame(writeExit);
		},
		{ passive: true, signal },
	);
	writeExit();

	// Pause the rocket's idle motion off screen, and with reduced motion.
	let visible = false;
	const syncPause = () => host.toggleAttribute("data-paused", mode !== "ready" || !visible);
	const visibility = trackVisibility(host, (ratio) => {
		visible = ratio > 0;
		syncPause();
	});
	syncPause();

	const stopMotion = onMotionPreferenceChange(() => {
		mode = readMotionMode();
		if (mode !== "ready") delete host.dataset.intro;
		applyLook();
		syncPause();
		writeExit();
	});
	// `data-ready` ends the waiting state; when late, the reveal it would cut short is left to finish.
	if (!late || mode !== "ready") host.dataset.ready = "";

	return {
		setConfig(next) {
			settings = skyLaunchConfigSchema.parse(next ?? {});
			applyLook();
			exit = -1;
			writeExit();
		},
		destroy() {
			cancel.abort();
			stopFrame?.();
			stopTheme();
			stopMotion();
			visibility.dispose();
			created.forEach((node) => node.remove());
			rising.forEach((element) => element.style.removeProperty("--exit"));
			if (headline && splitHere) headline.textContent = headlineText;
			host.removeAttribute("data-paused");
			delete host.dataset.ready;
			delete host.dataset.intro;
		},
	};
}
