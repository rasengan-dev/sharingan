import {
	addFrame,
	adoptStyles,
	onMotionPreferenceChange,
	readMotionMode,
	trackVisibility,
	type DomHero,
	type DomHeroOptions,
	type MotionMode,
} from "@/lib/sharingan";
import { bentoTilesConfigSchema, type BentoTilesConfig, type BentoTilesConfigInput } from "./schema";
import { BENTO_TILES_STYLE_ID, bentoTilesStyles } from "./styles";

/**
 * Markup the engine expects inside the host:
 * - optionally a `[data-sg-nav]` top bar;
 * - an `h1`, and a `[data-sg-bento]` holding the six `[data-sg-card="…"]`
 *   (integrations, stat, portrait, highlight, folder, orbit);
 * - in the figure cards, a `[data-sg-count]` with the figure as it reads;
 *   in the highlight card, an optional `[data-sg-progress]`;
 * - on the portrait card, an optional `data-focus="x,y"` (percent) for the face;
 * - in the folder card, a `[data-sg-folder]` with its label;
 * - in the orbit card, a `[data-sg-orbits]` list of `[data-sg-person]` avatars.
 */

/**
 * The world's land in dots, 64 × 28, from Natural Earth's 1:110m land (public
 * domain), 78°N to 56°S. One row per string, one bit per dot, in hex.
 */
const WORLD = [
	"001343f00020f0c0", "081de3f0080ffff0", "3fffffffc2000000", "1ffe21006ffffffe", "00ff38016fffff88", "007ffc017fffff80", "003ff200ffffffc0",
	"003fe003b9fffe00", "003fe00327bffe00", "001fc003e3fffc00", "000e4003fffff800", "000e4007fdeffc00", "00030007ffc66400", "00008007ff046400",
	"00007803ff804000", "00003e003f004800", "00003f003e001900", "00003fc03e000070", "00003fc03e000000", "00001f803e800340", "00000f803c8007c0",
	"00001f001c000fe0", "00001e001c000fe0", "00001c00100000e0", "0000180000000000", "0000100000000002", "0000100000000000", "0000100000000000",
];
const MAP_COLUMNS = 64;
const SVG = "http://www.w3.org/2000/svg";

/** Where the avatars sit: [ring, angle in degrees from the orbits' centre, 0 pointing right]. */
const SEATS: [number, number][] = [
	[0, -120],
	[1, -100],
	[0, -62],
	[1, -142],
	[1, -58],
	[0, -90],
];

/** The tile wall: a few holes, always the same ones for the same size (a seeded random). */
const HOLES = 0.1;
const random = (seed: number) => () => {
	seed = (seed * 1664525 + 1013904223) >>> 0;
	return seed / 2 ** 32;
};

/** A figure as it reads, split around its number: "2.5B+" → "", 2.5, "B+", one decimal. */
const parseFigure = (text: string) => {
	const match = text.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
	if (!match) return null;
	const [, prefix, digits, suffix] = match;
	const value = Number(digits.replace(/,/g, ""));
	return { prefix, value, suffix, decimals: digits.split(".")[1]?.length ?? 0, grouped: digits.includes(",") };
};

/** Bento tiles (Sharingan, DOM). A headline over raised tiles, and a bento of six cards. */
export function createBentoTiles({ host, config }: DomHeroOptions<BentoTilesConfigInput>): DomHero<BentoTilesConfigInput> {
	adoptStyles(host, BENTO_TILES_STYLE_ID, bentoTilesStyles);
	host.classList.add("sg-bt");

	let settings: BentoTilesConfig = bentoTilesConfigSchema.parse(config ?? {});
	let mode: MotionMode = readMotionMode();
	const cancel = new AbortController();
	const { signal } = cancel;
	const timers = new Set<number>();
	const later = (ms: number, run: () => void) => {
		const timer = window.setTimeout(() => {
			timers.delete(timer);
			run();
		}, ms);
		timers.add(timer);
	};
	const card = (name: string) => host.querySelector<HTMLElement>(`[data-sg-card="${name}"]`);
	const added: Element[] = [];

	const applyLook = () => {
		host.dataset.motion = mode;
		host.style.setProperty("--sg-bt-accent", settings.accent);
		host.style.setProperty("--sg-bt-marks", settings.marks);
		// Two colours: the middle stop is their mix.
		const [first, second, third] = settings.gradient;
		host.style.setProperty("--sg-bt-g1", first);
		host.style.setProperty("--sg-bt-g2", third ? second : `color-mix(in oklab, ${first}, ${second})`);
		host.style.setProperty("--sg-bt-g3", third ?? second);
		host.style.setProperty("--sg-bt-tile", `${settings.tileSize}px`);
		if (settings.showNav) delete host.dataset.nav;
		else host.dataset.nav = "off";
	};
	applyLook();

	// Headline: one span per word, for the entrance. The text nodes are kept to be put back.
	const headline = host.querySelector("h1");
	const headlineNodes = headline ? [...headline.childNodes] : [];
	if (headline && !headline.querySelector(".sg-bt-word")) {
		const words = (headline.textContent ?? "").trim().split(/\s+/);
		headline.replaceChildren(
			...words.flatMap((word, index) => {
				const span = document.createElement("span");
				span.className = "sg-bt-word";
				span.style.setProperty("--i", String(index));
				span.textContent = word;
				return index === 0 ? [span] : [document.createTextNode(" "), span];
			}),
		);
	}

	// The markup only has to carry the data attributes: the classes the stylesheet needs are added here.
	host.querySelector("[data-sg-nav]")?.classList.add("sg-bt-nav");
	headline?.parentElement?.classList.add("sg-bt-copy");
	host.querySelectorAll("[data-sg-count]").forEach((count) => count.parentElement?.classList.add("sg-bt-figure"));
	host.querySelectorAll("[data-sg-app]").forEach((app) => app.parentElement?.classList.add("sg-bt-apps"));

	// Cards in reading order for the entrance, and their parts.
	const bento = host.querySelector<HTMLElement>("[data-sg-bento]");
	bento?.classList.add("sg-bt-bento");
	const cards = bento ? [...bento.querySelectorAll<HTMLElement>("[data-sg-card]")] : [];
	cards.forEach((element) => element.classList.add("sg-bt-card"));
	const order = ["integrations", "portrait", "highlight", "folder", "stat", "orbit"];
	cards.forEach((element) => element.style.setProperty("--i", String(Math.max(0, order.indexOf(element.dataset.sgCard ?? "")))));
	host.querySelectorAll<HTMLElement>("[data-sg-app]").forEach((app, index) => {
		app.classList.add("sg-bt-app");
		app.style.setProperty("--i", String(index));
	});

	// Portrait: the crosses on the face, a band that scans it, a spot that follows the pointer.
	const portrait = card("portrait");
	if (portrait) {
		const [fx, fy] = (portrait.dataset.focus ?? "").split(",").map(Number);
		if (Number.isFinite(fx) && Number.isFinite(fy)) {
			portrait.style.setProperty("--fx", `${fx}%`);
			portrait.style.setProperty("--fy", `${fy}%`);
		}
		const marks = document.createElement("div");
		marks.className = "sg-bt-marks";
		marks.setAttribute("aria-hidden", "true");
		for (const name of ["face", "scan", "spot"]) {
			const layer = document.createElement("span");
			layer.className = `sg-bt-marks-${name}`;
			marks.append(layer);
		}
		portrait.append(marks);
		added.push(marks);
		portrait.addEventListener(
			"pointermove",
			(event) => {
				const box = portrait.getBoundingClientRect();
				portrait.style.setProperty("--px", `${(((event.clientX - box.left) / box.width) * 100).toFixed(1)}%`);
				portrait.style.setProperty("--py", `${(((event.clientY - box.top) / box.height) * 100).toFixed(1)}%`);
			},
			{ signal },
		);
	}

	// Folder card: the world in dots; on hover they light up in a wave from the folder.
	const folderCard = card("folder");
	if (folderCard) {
		host.querySelector("[data-sg-folder]")?.classList.add("sg-bt-folder");
		const map = document.createElementNS(SVG, "svg");
		map.setAttribute("class", "sg-bt-map");
		map.setAttribute("viewBox", `0 0 ${MAP_COLUMNS} ${WORLD.length}`);
		map.setAttribute("aria-hidden", "true");
		WORLD.forEach((row, y) => {
			for (let x = 0; x < MAP_COLUMNS; x++) {
				if (!((parseInt(row[x >> 2], 16) >> (3 - (x & 3))) & 1)) continue;
				const dot = document.createElementNS(SVG, "circle");
				dot.setAttribute("cx", String(x + 0.5));
				dot.setAttribute("cy", String(y + 0.5));
				dot.setAttribute("r", "0.34");
				dot.style.setProperty("--d", String(Math.round(Math.hypot(x - MAP_COLUMNS / 2, (y - WORLD.length * 0.6) * 1.4))));
				map.append(dot);
			}
		});
		folderCard.prepend(map);
		added.push(map);
	}

	// Orbit card: each avatar gets its ring and its place; the card's height sets the rings' size.
	const orbitCard = card("orbit");
	const orbits = orbitCard?.querySelector<HTMLElement>("[data-sg-orbits]");
	orbits?.classList.add("sg-bt-orbits");
	orbits?.querySelectorAll<HTMLElement>("[data-sg-person]").forEach((person, index) => {
		const [ring, angle] = SEATS[index % SEATS.length];
		person.classList.add("sg-bt-person");
		person.style.setProperty("--ring", String(ring));
		person.style.setProperty("--a", `${angle}deg`);
		person.style.setProperty("--swing", `${ring === 1 ? -14 : 18}deg`);
		person.style.setProperty("--i", String(index));
	});

	// Figures: they count up from zero at the entrance, and again when their card is pointed at.
	const counters = [...host.querySelectorAll<HTMLElement>("[data-sg-count]")].map((element) => ({
		element,
		text: element.textContent ?? "",
		figure: parseFigure(element.textContent ?? ""),
		stop: null as (() => void) | null,
	}));
	const format = (figure: NonNullable<ReturnType<typeof parseFigure>>, value: number) =>
		figure.prefix +
		value.toLocaleString("en-US", { minimumFractionDigits: figure.decimals, maximumFractionDigits: figure.decimals, useGrouping: figure.grouped }) +
		figure.suffix;
	const count = (counter: (typeof counters)[number], delay = 0) => {
		const { figure } = counter;
		counter.stop?.();
		counter.stop = null;
		if (!figure || mode !== "ready") {
			counter.element.textContent = counter.text;
			return;
		}
		counter.element.textContent = format(figure, 0);
		let start = -1;
		const stop = addFrame((time) => {
			if (start < 0) start = time + delay / 1000;
			const t = Math.min(1, Math.max(0, (time - start) / 1.4));
			counter.element.textContent = t >= 1 ? counter.text : format(figure, figure.value * (1 - Math.pow(1 - t, 3)));
			if (t >= 1) {
				stop();
				counter.stop = null;
			}
		});
		counter.stop = stop;
	};

	// The highlight's bar, when its figure is a percentage.
	const progress = host.querySelector<HTMLElement>("[data-sg-progress]");
	const highlightFigure = parseFigure(card("highlight")?.querySelector("[data-sg-count]")?.textContent ?? "");
	const percent = highlightFigure?.suffix.trim().startsWith("%") ? Math.min(1, highlightFigure.value / 100) : null;
	progress?.classList.add("sg-bt-progress");
	if (progress) progress.hidden = percent === null;
	const fillProgress = (from: number | null) => {
		if (!progress || percent === null) return;
		if (from === null || mode !== "ready") {
			progress.style.setProperty("--sg-bt-progress", String(percent));
			return;
		}
		progress.style.transition = "none";
		progress.style.setProperty("--sg-bt-progress", String(from));
		progress.getBoundingClientRect();
		progress.style.removeProperty("transition");
		requestAnimationFrame(() => progress.style.setProperty("--sg-bt-progress", String(percent)));
	};

	const replay = (element: HTMLElement | null) => {
		if (!element) return;
		element.addEventListener(
			"pointerenter",
			(event) => {
				if (event.pointerType === "touch" || mode !== "ready" || host.dataset.intro) return;
				counters.filter((counter) => element.contains(counter.element)).forEach((counter) => count(counter));
				if (progress && element.contains(progress)) fillProgress(0);
			},
			{ signal },
		);
	};
	replay(card("stat"));
	replay(card("highlight"));

	// The wall of tiles: built for the hero's width, lifted around the pointer.
	type Tile = { element: HTMLElement; x: number; y: number; lift: number; goal: number };
	let tiles: Tile[] = [];
	let wall: HTMLElement | null = null;
	let glow: HTMLElement | null = null;
	let builtFor = "";
	const buildTiles = () => {
		if (!settings.tiles) {
			wall?.remove();
			wall = glow = null;
			tiles = [];
			builtFor = "";
			return;
		}
		const width = host.clientWidth;
		const height = host.clientHeight;
		const size = settings.tileSize;
		const key = `${width}x${height}x${size}`;
		if (key === builtFor) return;
		builtFor = key;
		if (!wall) {
			wall = document.createElement("div");
			wall.className = "sg-bt-tiles";
			wall.setAttribute("aria-hidden", "true");
			host.prepend(wall);
		}
		const gap = Math.round(size * 0.1);
		const pitch = size + gap;
		const columns = Math.ceil(width / pitch) + 1;
		const rows = Math.ceil((Math.min(height * 0.78, 900)) / pitch) + 1;
		// Centred on the hero, so the middle column sits behind the headline.
		const left = Math.round(width / 2 - (columns * pitch - gap) / 2);
		const top = Math.round(-size * 0.35);
		const next = random(columns * 131 + rows * 17 + size);
		const fragment = document.createDocumentFragment();
		tiles = [];
		glow = document.createElement("div");
		glow.className = "sg-bt-glow";
		for (let row = 0; row < rows; row++) {
			for (let column = 0; column < columns; column++) {
				if (next() < HOLES) continue;
				const x = left + column * pitch;
				const y = top + row * pitch;
				const element = document.createElement("div");
				element.className = "sg-bt-tile";
				element.style.left = `${x}px`;
				element.style.top = `${y}px`;
				element.style.setProperty("--d", String(Math.round(Math.hypot((x + size / 2 - width / 2) / pitch, y / pitch) * 70)));
				fragment.append(element);
				tiles.push({ element, x: x + size / 2, y: y + size / 2, lift: 0, goal: 0 });
			}
		}
		fragment.append(glow);
		wall.replaceChildren(fragment);
	};

	// Pointer over the hero: the tiles near it rise, the light follows it.
	const pointer = { x: 0, y: 0, inside: false };
	let stopTiles: (() => void) | null = null;
	const tileFrame = (_time: number, delta: number) => {
		const radius = settings.tileSize * 2.2;
		const ease = Math.min(1, delta * 9);
		let moving = false;
		for (const tile of tiles) {
			const distance = Math.hypot(tile.x - pointer.x, tile.y - pointer.y);
			tile.goal = pointer.inside ? Math.max(0, 1 - distance / radius) ** 2 : 0;
			const lift = tile.lift + (tile.goal - tile.lift) * ease;
			if (Math.abs(lift - tile.lift) > 0.002 || Math.abs(tile.goal - lift) > 0.002) moving = true;
			if (Math.abs(lift - tile.lift) > 0.001) tile.element.style.setProperty("--lift", lift.toFixed(3));
			tile.lift = lift;
		}
		if (!moving) {
			stopTiles?.();
			stopTiles = null;
		}
	};
	const wakeTiles = () => {
		if (!stopTiles && tiles.length > 0) stopTiles = addFrame(tileFrame);
	};
	host.addEventListener(
		"pointermove",
		(event) => {
			if (event.pointerType === "touch" || mode !== "ready" || !settings.pointer || !wall) return;
			const box = wall.getBoundingClientRect();
			pointer.x = event.clientX - box.left;
			pointer.y = event.clientY - box.top;
			pointer.inside = pointer.y < box.height;
			host.toggleAttribute("data-pointer", pointer.inside);
			glow?.style.setProperty("--mx", `${pointer.x.toFixed(0)}px`);
			glow?.style.setProperty("--my", `${pointer.y.toFixed(0)}px`);
			wakeTiles();
		},
		{ signal },
	);
	host.addEventListener(
		"pointerleave",
		() => {
			pointer.inside = false;
			host.removeAttribute("data-pointer");
			wakeTiles();
		},
		{ signal },
	);

	// Idle: now and then a tile in the upper part presses in like a key.
	let pressTimer = 0;
	const pressSoon = () => {
		window.clearTimeout(pressTimer);
		if (!settings.idle || mode !== "ready" || visibility.state.ratio === 0 || tiles.length === 0) return;
		pressTimer = window.setTimeout(() => {
			const candidates = tiles.filter((tile) => tile.y < (wall?.clientHeight ?? 0) * 0.55 && !tile.element.hasAttribute("data-press"));
			const tile = candidates[Math.floor(Math.random() * candidates.length)];
			if (tile) {
				tile.element.setAttribute("data-press", "");
				later(1200, () => tile.element.removeAttribute("data-press"));
			}
			pressSoon();
		}, 1400 + Math.random() * 1800);
	};

	// Entrance: everything waits until the hero is on screen, then plays once.
	const play = () => {
		host.dataset.intro = "playing";
		counters.forEach((counter) => count(counter, 1300));
		later(1300, () => fillProgress(0));
		later(2600, () => {
			delete host.dataset.intro;
			pressSoon();
		});
	};
	const visibility = trackVisibility(host, (ratio) => {
		if (host.dataset.intro === "pending" && ratio >= 0.2) play();
		if (!host.dataset.intro) pressSoon();
	});

	const resize = new ResizeObserver(() => {
		buildTiles();
		if (orbitCard && orbits) orbits.style.setProperty("--h", `${orbitCard.clientHeight}px`);
	});
	resize.observe(host);
	if (orbitCard) resize.observe(orbitCard);

	buildTiles();
	if (mode === "ready" && settings.intro) {
		host.dataset.intro = "pending";
		counters.forEach((counter) => counter.figure && (counter.element.textContent = format(counter.figure, 0)));
		progress?.style.setProperty("--sg-bt-progress", "0");
	} else fillProgress(null);
	host.dataset.ready = "";

	const stopMotion = onMotionPreferenceChange(() => {
		mode = readMotionMode();
		applyLook();
		if (mode !== "ready") {
			delete host.dataset.intro;
			counters.forEach((counter) => count(counter));
			fillProgress(null);
		}
		pressSoon();
	});

	return {
		setConfig(next) {
			settings = bentoTilesConfigSchema.parse(next ?? {});
			applyLook();
			buildTiles();
			pressSoon();
		},
		destroy() {
			cancel.abort();
			stopTiles?.();
			counters.forEach((counter) => {
				counter.stop?.();
				counter.element.textContent = counter.text;
			});
			stopMotion();
			visibility.dispose();
			resize.disconnect();
			window.clearTimeout(pressTimer);
			timers.forEach((timer) => window.clearTimeout(timer));
			wall?.remove();
			added.forEach((element) => element.remove());
			if (headline && headlineNodes.length > 0) headline.replaceChildren(...headlineNodes);
			for (const name of ["--sg-bt-accent", "--sg-bt-marks", "--sg-bt-g1", "--sg-bt-g2", "--sg-bt-g3", "--sg-bt-tile"]) host.style.removeProperty(name);
			delete host.dataset.intro;
			delete host.dataset.nav;
			delete host.dataset.ready;
			host.removeAttribute("data-pointer");
		},
	};
}
