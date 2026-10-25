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
import { trailMapConfigSchema, type TrailMapConfig, type TrailMapConfigInput } from "./schema";
import { TRAIL_MAP_STYLE_ID, trailMapStyles } from "./styles";

/**
 * Markup the engine expects inside the host:
 * - `[data-sg-visual]` holding `[data-sg-frame]` (with `data-trail='{"points":[[x,y],…],"stops":[…]}'`,
 *   in percent of the photo) and inside it `[data-sg-scene]` with the photo's `<img>`;
 * - optionally `[data-sg-summit]` (the badge at the route's end, with a `[data-sg-distance]` that counts up);
 * - optionally `[data-sg-band]` with `[data-sg-routes]`, `[data-sg-prev]` and `[data-sg-next]`.
 * The route, the clouds and the sparkles are drawn by the engine.
 */

type Trail = { points: [number, number][]; stops: number[] };

const SVG = "http://www.w3.org/2000/svg";
const DRAW_MS = 2600; // the reveal's transition, in styles.ts
const WALK_MS = 11000;
let instances = 0;

const CLOUD = `<svg viewBox="0 0 220 110" aria-hidden="true"><defs><linearGradient id="sg-tm-cloud-shade" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#dfe5ee"/></linearGradient><filter id="sg-tm-cloud-soft"><feGaussianBlur stdDeviation="1.6"/></filter></defs><g fill="url(#sg-tm-cloud-shade)" filter="url(#sg-tm-cloud-soft)"><circle cx="58" cy="70" r="30"/><circle cx="96" cy="52" r="40"/><circle cx="140" cy="58" r="34"/><circle cx="174" cy="74" r="25"/><circle cx="118" cy="80" r="30"/><rect x="40" y="70" width="150" height="30" rx="15"/></g></svg>`;
const SPARK = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z"/></svg>`;

/** A smooth line through the points (Catmull-Rom, written as cubic Béziers). */
function smooth(points: [number, number][]) {
	let d = `M${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
	for (let i = 0; i < points.length - 1; i++) {
		const [p0, p1, p2, p3] = [points[i - 1] ?? points[i], points[i], points[i + 1], points[i + 2] ?? points[i + 1]];
		const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
		const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
		d += ` C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
	}
	return d;
}

/** The frame: rounded, its top-left scooped out, a notch at the bottom right. Clockwise; concave corners turn the other way. */
function framePath(width: number, height: number) {
	const r = Math.min(width, height) * 0.075;
	const a = width * 0.34;
	const b = height * 0.36;
	const notchW = width * 0.36;
	const notchH = height * 0.24;
	const arc = (x: number, y: number, convex = true) => `A${r} ${r} 0 0 ${convex ? 1 : 0} ${x.toFixed(1)} ${y.toFixed(1)}`;
	return [
		`M${a + r} 0`,
		`L${width - r} 0`,
		arc(width, r),
		`L${width} ${height - notchH - r}`,
		arc(width - r, height - notchH),
		`L${width - notchW + r} ${height - notchH}`,
		arc(width - notchW, height - notchH + r, false),
		`L${width - notchW} ${height - r}`,
		arc(width - notchW - r, height),
		`L${r} ${height}`,
		arc(0, height - r),
		`L0 ${b + r}`,
		arc(r, b),
		`L${a - r} ${b}`,
		arc(a, b - r, false),
		`L${a} ${r}`,
		arc(a + r, 0),
		"Z",
	].join(" ");
}

/** "70 km" → its number, decimals and the text around it; values that do not start with a number stay as they are. */
function parseCount(text: string) {
	const match = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(text.trim());
	if (!match) return null;
	return { prefix: match[1], number: Number(match[2].replace(/,/g, "")), decimals: match[2].split(".")[1]?.length ?? 0, suffix: match[3] };
}

/** Trail map (Sharingan, DOM). A route draws itself up a photo in a shaped frame. */
export function createTrailMap({ host, config }: DomHeroOptions<TrailMapConfigInput>): DomHero<TrailMapConfigInput> {
	adoptStyles(host, TRAIL_MAP_STYLE_ID, trailMapStyles);
	host.classList.add("sg-tm");

	const visual = host.querySelector<HTMLElement>("[data-sg-visual]");
	const frame = host.querySelector<HTMLElement>("[data-sg-frame]");
	const scene = host.querySelector<HTMLElement>("[data-sg-scene]");
	const photo = scene?.querySelector("img");
	if (!visual || !frame || !scene || !photo) {
		host.dataset.ready = "";
		return { setConfig() {}, destroy() {} };
	}

	let settings: TrailMapConfig = trailMapConfigSchema.parse(config ?? {});
	let mode: MotionMode = readMotionMode();
	const cancel = new AbortController();
	const { signal } = cancel;
	const created: Element[] = [];
	const timers = new Set<number>();
	const later = (ms: number, run: () => void) => {
		const timer = window.setTimeout(() => {
			timers.delete(timer);
			run();
		}, ms);
		timers.add(timer);
	};
	const id = `sg-tm-${++instances}`;

	visual.classList.add("sg-tm-visual");
	frame.classList.add("sg-tm-frame");
	scene.classList.add("sg-tm-scene");
	const summit = host.querySelector<HTMLElement>("[data-sg-summit]");
	summit?.classList.add("sg-tm-summit");
	const distance = summit?.querySelector<HTMLElement>("[data-sg-distance]");
	const distanceText = distance?.textContent ?? "";

	let trail: Trail = { points: [], stops: [] };
	try {
		const parsed = JSON.parse(frame.dataset.trail ?? "{}") as Partial<Trail>;
		trail = { points: parsed.points ?? [], stops: parsed.stops ?? [] };
	} catch {
		// A route that does not parse draws nothing; the photo stays.
	}

	const applyLook = () => {
		host.style.setProperty("--sg-tm-accent", settings.accent);
		host.dataset.motion = mode;
		created.filter((node) => node.classList.contains("sg-tm-cloud")).forEach((cloud) => ((cloud as HTMLElement).hidden = !settings.clouds));
	};

	// Decoration: two clouds over the frame's edges, three sparkles around the hero
	for (const side of ["left", "right"]) {
		const cloud = document.createElement("div");
		cloud.className = "sg-tm-cloud";
		cloud.dataset.side = side;
		cloud.setAttribute("aria-hidden", "true");
		cloud.innerHTML = CLOUD.replace(/sg-tm-cloud-(shade|soft)/g, `${id}-$1`);
		visual.append(cloud);
		created.push(cloud);
	}
	[
		[46, 22],
		[6, 64],
		[30, 70],
	].forEach(([left, top]) => {
		const spark = document.createElement("span");
		spark.className = "sg-tm-spark";
		spark.setAttribute("aria-hidden", "true");
		spark.innerHTML = SPARK;
		Object.assign(spark.style, { left: `${left}%`, top: `${top}%` });
		host.append(spark);
		created.push(spark);
	});
	applyLook();

	// The route, in the photo's coordinates: x 0–100, y 0–100 × its height / width.
	let viewHeight = 70;
	let route: SVGPathElement | null = null;
	let walker: SVGGElement | null = null;
	const draw = () => {
		frame.querySelector(".sg-tm-trail")?.remove();
		if (trail.points.length < 2) return;
		viewHeight = photo.naturalWidth ? (100 * photo.naturalHeight) / photo.naturalWidth : 70;
		const points = trail.points.map(([x, y]) => [x, (y / 100) * viewHeight] as [number, number]);
		const d = smooth(points);
		// Where each stop falls along the route, for the reveal's timing.
		const lengths = points.map((_, index) => points.slice(1, index + 1).reduce((sum, point, step) => sum + Math.hypot(point[0] - points[step][0], point[1] - points[step][1]), 0));
		const total = lengths[lengths.length - 1] || 1;
		const [startX, startY] = points[0];
		const [endX, endY] = points[points.length - 1];
		const svg = document.createElementNS(SVG, "svg");
		svg.setAttribute("class", "sg-tm-trail");
		svg.setAttribute("viewBox", `0 0 100 ${viewHeight.toFixed(2)}`);
		svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
		svg.setAttribute("aria-hidden", "true");
		svg.innerHTML = `
<mask id="${id}-reveal" maskUnits="userSpaceOnUse"><path class="sg-tm-reveal" d="${d}" pathLength="1"/></mask>
<path class="sg-tm-route" d="${d}" mask="url(#${id}-reveal)"/>
${trail.stops
	.filter((index) => index > 0 && index < points.length)
	.map((index) => `<circle class="sg-tm-stop" cx="${points[index][0]}" cy="${points[index][1].toFixed(2)}" r="1.1" style="--at:${Math.round((lengths[index] / total) * DRAW_MS)}ms"/>`)
	.join("")}
<circle class="sg-tm-stop" cx="${endX}" cy="${endY.toFixed(2)}" r="1.5" style="--at:${DRAW_MS}ms"/>
<circle class="sg-tm-pin-glow" cx="${startX}" cy="${startY.toFixed(2)}" r="1.5"/>
<circle class="sg-tm-pin" cx="${startX}" cy="${startY.toFixed(2)}" r="1.5"/>
<g class="sg-tm-walker"><circle r="2.2"/><circle r="1"/></g>`;
		scene.append(svg);
		route = svg.querySelector<SVGPathElement>(".sg-tm-route");
		walker = svg.querySelector<SVGGElement>(".sg-tm-walker");
	};

	// The frame's shape and the badge's place follow the visual's size.
	const layout = () => {
		const width = visual.clientWidth;
		const height = visual.clientHeight;
		if (!width || !height) return;
		frame.style.clipPath = `path('${framePath(width, height)}')`;
		if (summit && trail.points.length) {
			// Where the route ends on screen: the scene is the photo, cropped like `object-fit: cover`.
			const sceneWidth = scene.offsetWidth;
			const sceneHeight = scene.offsetHeight;
			const scale = Math.max(sceneWidth / 100, sceneHeight / viewHeight);
			const [x, y] = trail.points[trail.points.length - 1];
			const endX = scene.offsetLeft + (sceneWidth - 100 * scale) / 2 + x * scale;
			const endY = scene.offsetTop + (sceneHeight - viewHeight * scale) / 2 + (y / 100) * viewHeight * scale;
			const badgeWidth = summit.offsetWidth;
			const right = endX + 18 + badgeWidth < width;
			summit.style.setProperty("--bx", `${(right ? endX + 18 : endX - 18 - badgeWidth).toFixed(1)}px`);
			summit.style.setProperty("--by", `${(endY - summit.offsetHeight / 2).toFixed(1)}px`);
		}
	};

	// Counting the distance up when the route arrives
	const countUp = () => {
		const parsed = parseCount(distanceText);
		if (!distance || !parsed) return;
		const started = performance.now();
		const step = (now: number) => {
			if (signal.aborted) return;
			const t = Math.min(1, (now - started) / 900);
			const value = parsed.number * (1 - (1 - t) ** 3);
			distance.textContent = t < 1 ? `${parsed.prefix}${value.toFixed(parsed.decimals)}${parsed.suffix}` : distanceText;
			if (t < 1) requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	};

	// The walker climbs the route, again and again.
	let stopWalk: (() => void) | null = null;
	let walkStart = 0;
	const walk = (time: number) => {
		if (!route || !walker) return;
		walkStart ||= time;
		const t = ((time - walkStart) * 1000) % WALK_MS / WALK_MS;
		const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
		const at = route.getPointAtLength(eased * route.getTotalLength());
		walker.setAttribute("transform", `translate(${at.x.toFixed(2)} ${at.y.toFixed(2)})`);
	};
	const syncWalk = () => {
		const run = settings.walker && mode === "ready" && !host.dataset.intro && visibility.state.ratio > 0;
		host.toggleAttribute("data-walking", run);
		if (run && !stopWalk) stopWalk = addFrame(walk);
		if (!run && stopWalk) {
			stopWalk();
			stopWalk = null;
		}
	};

	// Entrance: the route draws from the start, stops light up as it passes, the badge arrives last.
	let played = false;
	const play = () => {
		played = true;
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				if (signal.aborted) return;
				host.dataset.intro = "drawing";
				later(DRAW_MS + 100, () => {
					delete host.dataset.intro;
					countUp();
					syncWalk();
				});
			}),
		);
	};
	const visibility = trackVisibility(host, (ratio) => {
		if (!played && host.dataset.intro === "pending" && ratio >= 0.3) play();
		syncWalk();
	});

	// Parallax: the photo and the route together, the clouds further
	host.addEventListener(
		"pointermove",
		(event) => {
			if (event.pointerType !== "mouse" || !settings.parallax || mode !== "ready") return;
			const box = visual.getBoundingClientRect();
			const x = ((event.clientX - box.left) / box.width) * 2 - 1;
			const y = ((event.clientY - box.top) / box.height) * 2 - 1;
			host.style.setProperty("--px", Math.max(-1, Math.min(1, x)).toFixed(3));
			host.style.setProperty("--py", Math.max(-1, Math.min(1, y)).toFixed(3));
		},
		{ signal },
	);
	host.addEventListener(
		"pointerleave",
		() => {
			host.style.setProperty("--px", "0");
			host.style.setProperty("--py", "0");
		},
		{ signal },
	);

	// Routes strip: arrows scroll one card; they disable at the ends.
	const list = host.querySelector<HTMLElement>("[data-sg-routes]");
	const prev = host.querySelector<HTMLButtonElement>("[data-sg-prev]");
	const next = host.querySelector<HTMLButtonElement>("[data-sg-next]");
	const syncArrows = () => {
		if (!list) return;
		if (prev) prev.disabled = list.scrollLeft <= 2;
		if (next) next.disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
	};
	const scrollBy = (direction: number) => {
		const card = list?.querySelector("li");
		if (!list || !card) return;
		list.scrollBy({ left: direction * (card.getBoundingClientRect().width + 16), behavior: mode === "ready" ? "smooth" : "auto" });
	};
	prev?.addEventListener("click", () => scrollBy(-1), { signal });
	next?.addEventListener("click", () => scrollBy(1), { signal });
	list?.addEventListener("scroll", syncArrows, { signal, passive: true });

	const resize = new ResizeObserver(() => {
		layout();
		syncArrows();
	});
	resize.observe(visual);
	if (list) resize.observe(list);

	const start = () => {
		draw();
		layout();
		syncArrows();
		if (mode === "ready" && settings.intro && !played) host.dataset.intro = "pending";
		host.dataset.ready = "";
		syncWalk();
	};
	// The route needs the photo's proportions.
	if (photo.complete && photo.naturalWidth) start();
	else {
		photo.addEventListener("load", start, { signal, once: true });
		photo.addEventListener("error", start, { signal, once: true });
	}

	const stopMotion = onMotionPreferenceChange(() => {
		mode = readMotionMode();
		applyLook();
		if (mode !== "ready") delete host.dataset.intro;
		syncWalk();
	});

	return {
		setConfig(nextConfig) {
			settings = trailMapConfigSchema.parse(nextConfig ?? {});
			applyLook();
			syncWalk();
		},
		destroy() {
			cancel.abort();
			stopWalk?.();
			stopMotion();
			visibility.dispose();
			resize.disconnect();
			timers.forEach((timer) => window.clearTimeout(timer));
			frame.querySelector(".sg-tm-trail")?.remove();
			frame.style.removeProperty("clip-path");
			created.forEach((node) => node.remove());
			if (distance) distance.textContent = distanceText;
			for (const name of ["--px", "--py", "--sg-tm-accent"]) host.style.removeProperty(name);
			host.removeAttribute("data-walking");
			delete host.dataset.intro;
			delete host.dataset.ready;
		},
	};
}
