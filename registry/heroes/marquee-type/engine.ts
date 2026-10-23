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
import { marqueeTypeConfigSchema, type MarqueeTypeConfig, type MarqueeTypeConfigInput } from "./schema";
import { MARQUEE_TYPE_STYLE_ID, marqueeTypeStyles } from "./styles";

/**
 * Markup the engine expects inside the host: `[data-sg-row]` elements, each
 * holding one list of words (`<ul>`), optionally already inside a
 * `[data-sg-track]`. The engine repeats each list (hidden from assistive
 * technology) until the row is full, and slides the track.
 */

type Row = {
	row: HTMLElement;
	track: HTMLElement;
	list: HTMLElement;
	createdTrack: boolean;
	clones: HTMLElement[];
	/** Width of one list, the distance after which the track repeats itself. */
	period: number;
	offset: number;
	/** 1 at full speed; lower under the pointer, 0 while pressed. */
	pace: number;
	target: number;
};

const BASE_SPEED = 70; // px per second at speed 1

/** Marquee type (Sharingan, DOM). Oversized words slide in opposite rows. */
export function createMarqueeType({ host, config }: DomHeroOptions<MarqueeTypeConfigInput>): DomHero<MarqueeTypeConfigInput> {
	adoptStyles(host, MARQUEE_TYPE_STYLE_ID, marqueeTypeStyles);
	host.classList.add("sg-mq");

	let settings: MarqueeTypeConfig = marqueeTypeConfigSchema.parse(config ?? {});
	let mode: MotionMode = readMotionMode();
	const cancel = new AbortController();
	const { signal } = cancel;

	host.querySelector("[data-sg-rows]")?.classList.add("sg-mq-band");
	const rows: Row[] = [...host.querySelectorAll<HTMLElement>("[data-sg-row]")].flatMap((row) => {
		const list = row.querySelector<HTMLElement>("ul, ol");
		if (!list) return [];
		row.classList.add("sg-mq-row");
		let track = row.querySelector<HTMLElement>("[data-sg-track]");
		const createdTrack = !track;
		if (!track) {
			track = document.createElement("div");
			track.dataset.sgTrack = "";
			row.append(track);
			track.append(list);
		}
		track.classList.add("sg-mq-track");
		return [{ row, track, list, createdTrack, clones: [], period: 0, offset: 0, pace: 1, target: 1 }];
	});

	const direction = (index: number) => (settings.direction === "left" ? 1 : settings.direction === "right" ? -1 : index % 2 === 0 ? 1 : -1);

	const applyLook = () => {
		host.style.setProperty("--sg-mq-accent", settings.accent);
		host.style.setProperty("--sg-mq-tilt", `${settings.tilt}deg`);
		host.style.setProperty("--sg-mq-sep", JSON.stringify(settings.separator));
		host.dataset.motion = mode;
		rows.forEach(({ row }, index) => {
			row.dataset.look = settings.look === "mixed" ? (index % 2 === 0 ? "solid" : "outline") : settings.look;
		});
	};
	applyLook();

	// Enough copies of each list to cover its row twice over, so the loop never shows a gap.
	const fill = () => {
		for (const item of rows) {
			item.clones.forEach((clone) => clone.remove());
			item.clones = [];
			item.period = item.list.offsetWidth;
			if (item.period === 0) continue;
			const copies = Math.ceil(item.row.offsetWidth / item.period) + 1;
			for (let i = 0; i < copies; i++) {
				const clone = item.list.cloneNode(true) as HTMLElement;
				clone.setAttribute("aria-hidden", "true");
				clone.inert = true;
				item.track.append(clone);
				item.clones.push(clone);
			}
		}
	};

	const place = (item: Row) => {
		const shift = ((item.offset % item.period) + item.period) % item.period;
		item.track.style.transform = `translate3d(${(-shift).toFixed(2)}px, 0, 0)`;
	};

	// Fixed, different starting points per row: `?motion=final` always matches.
	const rest = () => {
		rows.forEach((item, index) => {
			item.offset = item.period * ((index * 0.37) % 1);
			if (item.period) place(item);
		});
	};

	// Pointer: slow down over a row, stop while pressed
	rows.forEach((item) => {
		item.row.addEventListener("pointerenter", (event) => settings.pointer && event.pointerType === "mouse" && (item.target = 0.18), { signal });
		item.row.addEventListener("pointerleave", () => (item.target = 1), { signal });
		item.row.addEventListener("pointerdown", () => settings.pointer && (item.target = 0), { signal });
		item.row.addEventListener("pointerup", (event) => (item.target = event.pointerType === "mouse" ? 0.18 : 1), { signal });
		item.row.addEventListener("pointercancel", () => (item.target = 1), { signal });
	});

	// Scroll: a push that fades out
	let boost = 0;
	let lastScroll = window.scrollY;
	window.addEventListener(
		"scroll",
		() => {
			const moved = Math.abs(window.scrollY - lastScroll);
			lastScroll = window.scrollY;
			if (settings.scroll) boost = Math.min(4, boost + moved * 0.012);
		},
		{ signal, passive: true },
	);

	const frame = (_time: number, delta: number) => {
		boost *= Math.exp(-delta * 2.5);
		const ease = 1 - Math.exp(-delta * 6);
		rows.forEach((item, index) => {
			if (!item.period) return;
			item.pace += (item.target - item.pace) * ease;
			// Each lower row runs a little faster: a hint of depth.
			const speed = BASE_SPEED * settings.speed * (1 + index * 0.15) * item.pace * (1 + boost);
			item.offset += direction(index) * speed * delta;
			place(item);
		});
	};

	let stopFrame: (() => void) | null = null;
	const sync = () => {
		const run = mode === "ready" && visibility.state.ratio > 0;
		if (run && !stopFrame) stopFrame = addFrame(frame);
		if (!run && stopFrame) {
			stopFrame();
			stopFrame = null;
		}
		if (mode !== "ready") rest();
	};
	const visibility = trackVisibility(host, () => sync());

	fill();
	rest();
	const resize = new ResizeObserver(() => {
		fill();
		if (mode !== "ready") rest();
		else rows.forEach((item) => item.period && place(item));
	});
	rows.forEach((item) => resize.observe(item.row));
	document.fonts?.ready.then(() => {
		if (signal.aborted) return;
		fill();
		if (mode !== "ready") rest();
	});
	const stopMotion = onMotionPreferenceChange(() => {
		mode = readMotionMode();
		applyLook();
		sync();
	});
	host.dataset.ready = "";

	return {
		setConfig(next) {
			settings = marqueeTypeConfigSchema.parse(next ?? {});
			applyLook();
			fill();
		},
		destroy() {
			cancel.abort();
			stopFrame?.();
			stopMotion();
			visibility.dispose();
			resize.disconnect();
			for (const item of rows) {
				item.clones.forEach((clone) => clone.remove());
				item.track.style.removeProperty("transform");
				if (item.createdTrack) {
					item.row.append(item.list);
					item.track.remove();
				}
			}
			delete host.dataset.ready;
		},
	};
}
