import type { IsoDeckConfig } from "./schema";

/**
 * The deck, drawn as one SVG string from the config: the same function runs
 * on the server (React) and in the engine (a Web Component, or a new config).
 *
 * World space is in key pitches: x runs down-right on screen, y down-left,
 * z up. Every box shows three faces (top, left = +y, right = +x) and is drawn
 * back to front. A key's cap sits in a clip that ends at the plate, so a
 * pressed cap (moved down by CSS) sinks into the deck instead of growing.
 */

const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;
/** SVG user units per world unit. */
export const UNIT = 40;
/** The plate's top, where the keys stand. */
const DECK_Z = 0.56;
/** How far a pressed cap travels, in user units; the stylesheet reads it as --sg-id-press. */
export const PRESS = 0.15 * UNIT;

type Point = [number, number];
const iso = (x: number, y: number, z: number): Point => [(x - y) * COS * UNIT, ((x + y) * SIN - z) * UNIT];
const round = (value: number) => Math.round(value * 10) / 10;
const points = (list: Point[]) => list.map(([x, y]) => `${round(x)},${round(y)}`).join(" ");
const escape = (text: string) => text.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`);
/** Draws on the horizontal plane at height z, in world units × UNIT. */
const plane = (z: number) => `matrix(${round(COS * 1000) / 1000} ${SIN} ${-round(COS * 1000) / 1000} ${SIN} 0 ${round(-z * UNIT)})`;

type Box = { x0: number; y0: number; x1: number; y1: number; z0: number; z1: number; taper?: number };

/** The three visible faces of a box whose top may be inset (a keycap). */
function faces({ x0, y0, x1, y1, z0, z1, taper = 0 }: Box) {
	const t = taper;
	const A = iso(x0, y1, z0), B = iso(x1, y1, z0), C = iso(x1, y0, z0);
	const a = iso(x0 + t, y1 - t, z1), b = iso(x1 - t, y1 - t, z1), c = iso(x1 - t, y0 + t, z1), d = iso(x0 + t, y0 + t, z1);
	return {
		left: [A, B, b, a],
		right: [B, C, c, b],
		top: [a, b, c, d],
		/** The outline of the whole box on screen. */
		hull: [A, B, C, c, d, a],
	};
}

function drawBox(box: Box, extra = "") {
	const f = faces(box);
	return `<polygon class="sg-id-l" points="${points(f.left)}"/><polygon class="sg-id-r" points="${points(f.right)}"/><polygon class="sg-id-t" points="${points(f.top)}"/>${extra}`;
}

/** Where a key may be seen: its footprint, from the plate up. Clipping the cap to it hides what sinks below. */
function column(box: Box) {
	const A = iso(box.x0, box.y1, DECK_Z), B = iso(box.x1, box.y1, DECK_Z), C = iso(box.x1, box.y0, DECK_Z);
	const up = (p: Point): Point => [p[0], p[1] - 3 * UNIT];
	return [A, B, C, up(C), up(iso(box.x0, box.y0, DECK_Z)), up(A)];
}

type CellKind = "icon" | "letter" | "wide" | "cta" | "knob" | "screen";
type Cell = { kind: CellKind; x: number; y: number; w: number; d: number; index?: number };

/** Depth of the strip behind the letters, where the screen and the knob sit. */
const STRIP = 0.72;

/**
 * The grid: a narrow strip at the back (knob, screen), the letters, then with
 * two rows a front row (the wide key and the big front key).
 */
function layout(config: IsoDeckConfig): Cell[] {
	const n = config.keys.length;
	const cells: Cell[] = [];
	const strip = config.screen || config.knob ? STRIP : 0;
	const two = config.rows === 2;
	// With one row the front key closes the letters' row; with two it sits under the last letters.
	const columns = two ? n + 1 : n + 2;
	if (config.knob) cells.push({ kind: "knob", x: 0, y: 0, w: 1, d: STRIP });
	if (config.screen) cells.push({ kind: "screen", x: 1, y: 0, w: columns - 1, d: STRIP });
	if (two) cells.push({ kind: "icon", x: 0, y: strip, w: 1, d: 1 });
	[...config.keys].forEach((_, index) => cells.push({ kind: "letter", x: (two ? 1 : 0) + index, y: strip, w: 1, d: 1, index }));
	if (two) {
		cells.push({ kind: "wide", x: 0, y: strip + 1, w: n - 1, d: 1 });
		cells.push({ kind: "cta", x: n - 1, y: strip + 1, w: 2, d: 1 });
	} else {
		cells.push({ kind: "cta", x: n, y: strip, w: 2, d: 1 });
	}
	return cells;
}

/** Back to front: a box is drawn first when it lies wholly behind another along x or y. */
function depthSort<T extends { box: Box }>(items: T[]) {
	const behind = (a: Box, b: Box) => a.x1 <= b.x0 + 1e-6 || a.y1 <= b.y0 + 1e-6;
	const left = [...items];
	const sorted: T[] = [];
	while (left.length) {
		const next = left.findIndex((item) => !left.some((other) => other !== item && behind(other.box, item.box)));
		sorted.push(...left.splice(next === -1 ? 0 : next, 1));
	}
	return sorted;
}

const GAP = 0.07;
const TAPER = 0.07;

/** The cursor, in screen space, its tip at 0,0. */
const ARROW = "M0 0 L0 19 L5 14.4 L8.4 21.8 L11.6 20.4 L8.3 13.2 L14.6 13 Z";
/** The icon key's mark: four small arrows, on the key's plane. */
const MOVE = (cx: number, cy: number) => {
	const s = 0.1 * UNIT;
	return `<path class="sg-id-print" d="M${cx} ${cy - 2.6 * s}v${5.2 * s}M${cx - 2.6 * s} ${cy}h${5.2 * s}M${cx - s} ${cy - 1.6 * s}l${s} -${s} ${s} ${s}M${cx - s} ${cy + 1.6 * s}l${s} ${s} ${s} -${s}M${cx - 1.6 * s} ${cy - s}l-${s} ${s} ${s} ${s}M${cx + 1.6 * s} ${cy - s}l${s} ${s} -${s} ${s}"/>`;
};

export type DeckDrawing = {
	svg: string;
	/** One world unit as a percentage of the deck's width: the stylesheet sizes the tooltip with it. */
	unit: number;
	/** Where the tooltip opens, in percent of the deck. */
	tip: { left: string; top: string };
	/** The front key's link: a box over the key, cut to its shape. */
	link: { left: string; top: string; width: string; height: string; clipPath: string };
};

/**
 * Draws the deck. `id` makes the clip ids unique on the page; `cta` is the
 * label printed on the front key.
 */
export function drawDeck(config: IsoDeckConfig, { id, cta }: { id: string; cta?: string }): DeckDrawing {
	const cells = layout(config);
	const columns = Math.max(...cells.map((cell) => cell.x + cell.w));
	const rows = Math.max(...cells.map((cell) => cell.y + cell.d));
	const seen: Point[] = [];
	const track = (list: Point[]) => (seen.push(...list), list);

	// The plate: a tray, then a slightly smaller deck on it.
	const tray: Box = { x0: -0.36, y0: -0.36, x1: columns + 0.36, y1: rows + 0.36, z0: 0, z1: 0.3 };
	const top: Box = { x0: -0.2, y0: -0.2, x1: columns + 0.2, y1: rows + 0.2, z0: 0.3, z1: DECK_Z };
	track(faces(tray).hull);
	const clips: string[] = [];
	const parts: string[] = [`<g class="sg-id-plate" aria-hidden="true">${drawBox(tray)}${drawBox(top)}</g>`];

	// The floating tile, high above the back of the deck, tied to the screen (or the deck) by a dotted
	// line drawn here, under the keys. The line follows the axes, as a wire in the room would: down
	// from the tile to the deck's height, then along y, then along x to the screen.
	const tx = columns * 0.42, ty = -1.6, tz = 3.3;
	const screenCell = cells.find((cell) => cell.kind === "screen");
	const [ex, ey] = screenCell ? [screenCell.x + screenCell.w / 2, screenCell.y + screenCell.d / 2] : [columns / 2, rows / 2];
	const lead = [iso(tx + 0.5, ty + 0.5, tz), iso(tx + 0.5, ty + 0.5, DECK_Z), iso(tx + 0.5, ey, DECK_Z), iso(ex, ey, DECK_Z)];
	parts.push(`<path class="sg-id-leader" aria-hidden="true" d="M${lead.map(([x, y]) => `${round(x)} ${round(y)}`).join("L")}"/>`);

	// The cable leaves the tray's right or left face, then coils.
	if (config.cable !== "none") {
		const right = config.cable === "right";
		const plug: Box = right
			? { x0: columns + 0.36, x1: columns + 0.72, y0: rows / 2 - 0.13, y1: rows / 2 + 0.13, z0: 0.06, z1: 0.26 }
			: { x0: 0.6, x1: 0.86, y0: rows + 0.36, y1: rows + 0.72, z0: 0.06, z1: 0.26 };
		track(faces(plug).hull);
		const [ox, oy] = right ? iso(columns + 0.72, rows / 2, 0.16) : iso(0.73, rows + 0.72, 0.16);
		const coil: Point[] = [[0, 0], [12, 0]];
		for (let t = 0; t <= Math.PI * 14; t += 0.2) coil.push([12 + t * 2.3 - 7 * Math.sin(t), 7 - 7 * Math.cos(t)]);
		coil.push([coil[coil.length - 1]![0] + 120, 4]);
		const path = `M${coil.map(([x, y]) => `${round(x)} ${round(y)}`).join("L")}`;
		const turn = right ? "rotate(-8)" : "rotate(188) scale(1 -1)";
		parts.push(
			`<g class="sg-id-cable" aria-hidden="true"><g transform="translate(${round(ox)} ${round(oy)}) ${turn}"><g class="sg-id-sway"><path class="sg-id-wire" d="${path}"/></g></g>${drawBox(plug)}</g>`,
		);
	}

	// The keys, the knob and the screen, back to front.
	const items = cells.map((cell) => {
		const box: Box = { x0: cell.x + GAP, y0: cell.y + GAP, x1: cell.x + cell.w - GAP, y1: cell.y + cell.d - GAP, z0: DECK_Z, z1: DECK_Z + (cell.kind === "cta" ? 0.5 : 0.42), taper: TAPER };
		return { cell, box };
	});
	let linkHull: Point[] | null = null;
	for (const { cell, box } of depthSort(items)) {
		const cx = (cell.x + cell.w / 2) * UNIT;
		const cy = (cell.y + cell.d / 2) * UNIT;
		if (cell.kind === "knob") {
			const r = 0.27;
			const h = 0.5;
			const rx = r * Math.SQRT2 * COS * UNIT;
			const ry = r * Math.SQRT2 * SIN * UNIT;
			const [bx, by] = iso(cell.x + 0.5, cell.y + cell.d / 2, DECK_Z);
			const [tx, ty] = iso(cell.x + 0.5, cell.y + cell.d / 2, DECK_Z + h);
			track([[bx - rx, by + ry], [tx + rx, ty - ry]]);
			parts.push(
				`<g class="sg-id-knob" aria-hidden="true"><path class="sg-id-l" d="M${round(tx - rx)} ${round(ty)}L${round(bx - rx)} ${round(by)}A${round(rx)} ${round(ry)} 0 0 0 ${round(bx + rx)} ${round(by)}L${round(tx + rx)} ${round(ty)}Z"/><ellipse class="sg-id-t" cx="${round(tx)}" cy="${round(ty)}" rx="${round(rx)}" ry="${round(ry)}"/><g transform="${plane(DECK_Z + h)}"><g transform="translate(${cx} ${cy})"><g class="sg-id-dial"><path class="sg-id-print" d="M0 0V${round(-r * 0.78 * UNIT)}"/></g></g></g></g>`,
			);
			continue;
		}
		if (cell.kind === "screen") {
			const screen: Box = { ...box, z1: DECK_Z + 0.05, taper: 0 };
			const x0 = (box.x0 + 0.14) * UNIT, x1 = (box.x1 - 0.14) * UNIT;
			const y0 = (box.y0 + 0.12) * UNIT, y1 = (box.y1 - 0.14) * UNIT;
			const count = Math.floor((x1 - x0) / 5.2);
			const pitch = (x1 - x0) / count;
			const tall = (y1 - y0) * 0.72;
			const bars: string[] = [];
			const ticks: string[] = [];
			for (let i = 0; i < count; i++) {
				const share = Math.round((i / (count - 1)) * 100);
				// A still level, for the server and for reduced motion: a soft rise, the engine moves it.
				const level = 0.3 + 0.5 * (i / count) * (0.75 + 0.25 * Math.sin(i * 1.3));
				bars.push(
					`<rect class="sg-id-bar" x="${round(x0 + i * pitch)}" y="${round(y1 - tall)}" width="${round(pitch * 0.58)}" height="${round(tall)}" style="--b:color-mix(in oklab, var(--sg-id-accent) ${share}%, var(--sg-id-accent-2));transform:scaleY(${level.toFixed(2)})"/>`,
				);
				if (i % 2 === 0) ticks.push(`M${round(x0 + i * pitch)} ${round(y0)}v${i % 6 === 0 ? 4 : 2}`);
			}
			parts.push(
				`<g class="sg-id-screen" aria-hidden="true">${drawBox(screen)}<g transform="${plane(DECK_Z + 0.05)}"><path class="sg-id-tick" d="${ticks.join("")}"/>${bars.join("")}</g></g>`,
			);
			continue;
		}
		// A key: a cap that moves inside a clip that does not.
		const clip = `${id}-${cell.kind}${cell.index ?? ""}`;
		const shape = faces(box);
		track(shape.hull);
		clips.push(`<clipPath id="${clip}"><polygon points="${points(column(box))}"/></clipPath>`);
		const label =
			cell.kind === "letter"
				? `<text class="sg-id-letter" x="${cx}" y="${cy}">${escape(config.keys[cell.index!]!.toUpperCase())}</text>`
				: cell.kind === "wide" && config.wideKey
					? `<text class="sg-id-label" x="${cx}" y="${cy}">${escape(config.wideKey)}</text>`
					: cell.kind === "cta" && cta
						? `<text class="sg-id-label" x="${cx}" y="${cy}">${escape(cta)}</text>`
						: cell.kind === "icon"
							? MOVE(cx, cy)
							: "";
		const ring = cell.kind === "cta" ? `<polygon class="sg-id-ring" points="${points(shape.hull)}"/>` : "";
		if (cell.kind === "cta") linkHull = shape.hull;
		parts.push(
			`<g class="sg-id-key" data-key="${cell.kind}"${cell.index === undefined ? "" : ` data-index="${cell.index}"`} clip-path="url(#${clip})" aria-hidden="true"><g class="sg-id-cap">${drawBox(box, `<g transform="${plane(box.z1)}">${label}</g>`)}</g>${ring}</g>`,
		);
	}

	// The tile, its selection box and the cursor, over everything.
	const tile: Box = { x0: tx, y0: ty, x1: tx + 1, y1: ty + 1, z0: tz, z1: tz + 0.3 };
	const tileShape = faces(tile);
	track(tileShape.hull);
	const tileTop = iso(tx + 0.5, ty + 0.5, tz + 0.3);
	const xs = tileShape.hull.map(([x]) => x), ys = tileShape.hull.map(([, y]) => y);
	const box = { x0: Math.min(...xs) - 5, y0: Math.min(...ys) - 5, x1: Math.max(...xs) + 5, y1: Math.max(...ys) + 5 };
	const handle = (x: number, y: number) => `<rect x="${round(x - 3)}" y="${round(y - 3)}" width="6" height="6"/>`;
	const out: Point = [box.x1 + 6, box.y1 + 2];
	// The spinner lies flat on its own plane, floating above the knob (or the first key), and turns in it.
	const knobCell = cells.find((cell) => cell.kind === "knob") ?? cells[0]!;
	const spinAt = { x: knobCell.x + 0.5, y: knobCell.y + knobCell.d / 2, z: DECK_Z + 1.35 };
	const spinR = 0.32;
	track([iso(spinAt.x - spinR, spinAt.y + spinR, spinAt.z), iso(spinAt.x + spinR, spinAt.y - spinR, spinAt.z), iso(spinAt.x - spinR, spinAt.y - spinR, spinAt.z)]);
	parts.push(
		`<g class="sg-id-spin" aria-hidden="true" transform="${plane(spinAt.z)}"><g transform="translate(${round(spinAt.x * UNIT)} ${round(spinAt.y * UNIT)})"><circle r="${round(spinR * UNIT)}"/></g></g>`,
		`<g class="sg-id-tile" aria-hidden="true"><ellipse class="sg-id-halo" cx="${round(lead[0]![0])}" cy="${round(lead[0]![1])}" rx="${round(1.1 * UNIT)}" ry="${round(0.64 * UNIT)}"/><g class="sg-id-tile-body">${drawBox(tile, `<g transform="${plane(tile.z1)}"><g transform="translate(${(tx + 0.5) * UNIT - 6} ${(ty + 0.5) * UNIT - 9}) scale(.8)"><path class="sg-id-emblem" d="${ARROW}"/></g></g>`)}</g></g>`,
		`<g class="sg-id-select" aria-hidden="true"><rect class="sg-id-frame" x="${round(box.x0)}" y="${round(box.y0)}" width="${round(box.x1 - box.x0)}" height="${round(box.y1 - box.y0)}"/>${handle(box.x0, box.y0)}${handle(box.x1, box.y0)}${handle(box.x0, box.y1)}${handle(box.x1, box.y1)}</g>`,
		`<g class="sg-id-cursor" aria-hidden="true" style="--in-x:${round(tileTop[0])}px;--in-y:${round(tileTop[1])}px;--out-x:${round(out[0])}px;--out-y:${round(out[1])}px"><path d="${ARROW}"/></g>`,
	);

	// The tooltip opens beside the cursor; the drawing makes room for it.
	const tipAt: Point = [out[0] + 10, out[1] + 24];
	track([tipAt, [tipAt[0] + 5.6 * UNIT, tipAt[1] + 1.4 * UNIT]]);

	const pad = 0.4 * UNIT;
	const minX = Math.min(...seen.map(([x]) => x)) - pad, maxX = Math.max(...seen.map(([x]) => x)) + pad;
	const minY = Math.min(...seen.map(([, y]) => y)) - pad, maxY = Math.max(...seen.map(([, y]) => y)) + pad;
	const width = maxX - minX, height = maxY - minY;
	const percent = (value: number, from: number, size: number) => `${round(((value - from) / size) * 100)}%`;

	const hull = linkHull ?? [[0, 0], [0, 0]];
	const hx = hull.map(([x]) => x), hy = hull.map(([, y]) => y);
	const lb = { x: Math.min(...hx), y: Math.min(...hy), w: Math.max(...hx) - Math.min(...hx), h: Math.max(...hy) - Math.min(...hy) };

	return {
		svg: `<svg class="sg-id-svg" viewBox="${round(minX)} ${round(minY)} ${round(width)} ${round(height)}" style="--sg-id-press:${PRESS}px" focusable="false"><defs>${clips.join("")}</defs>${parts.join("")}</svg>`,
		unit: round((UNIT / width) * 100 * 100) / 100,
		tip: { left: percent(tipAt[0], minX, width), top: percent(tipAt[1], minY, height) },
		link: {
			left: percent(lb.x, minX, width),
			top: percent(lb.y, minY, height),
			width: `${round((lb.w / width) * 100)}%`,
			height: `${round((lb.h / height) * 100)}%`,
			clipPath: `polygon(${hull.map(([x, y]) => `${round(((x - lb.x) / (lb.w || 1)) * 100)}% ${round(((y - lb.y) / (lb.h || 1)) * 100)}%`).join(", ")})`,
		},
	};
}
