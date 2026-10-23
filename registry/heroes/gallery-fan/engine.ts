import { adoptStyles, onMotionPreferenceChange, readMotionMode, trackVisibility, type DomHero, type DomHeroOptions, type MotionMode } from "@/lib/sharingan";
import { galleryFanConfigSchema, type GalleryFanConfig, type GalleryFanConfigInput } from "./schema";
import { GALLERY_FAN_STYLE_ID, galleryFanStyles } from "./styles";

/**
 * Markup the engine expects inside the host:
 * - `[data-sg-fan]` holding the `[data-sg-card]` elements (links or buttons, each with an image),
 *   optionally with a `.sg-gf-caption` inside;
 * - optionally `[data-sg-cursor]` elements (`data-card` = the card they rest over).
 */

type Pose = { x: number; y: number; z: number; ry: number; rz: number; s: number; order: number };

const PERSPECTIVE = 1400; // the fan's `perspective`, in styles.ts
const CURSOR_EVERY = 4600;

/** Gallery fan (Sharingan, DOM). A fan of artwork cards; the nearest one rises. */
export function createGalleryFan({ host, config }: DomHeroOptions<GalleryFanConfigInput>): DomHero<GalleryFanConfigInput> {
	adoptStyles(host, GALLERY_FAN_STYLE_ID, galleryFanStyles);
	host.classList.add("sg-gf");

	const fan = host.querySelector<HTMLElement>("[data-sg-fan]");
	const cards = fan ? [...fan.querySelectorAll<HTMLElement>("[data-sg-card]")] : [];
	if (!fan || cards.length === 0) {
		host.dataset.ready = "";
		return { setConfig() {}, destroy() {} };
	}

	let settings: GalleryFanConfig = galleryFanConfigSchema.parse(config ?? {});
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

	fan.classList.add("sg-gf-fan");
	cards.forEach((card) => card.classList.add("sg-gf-card"));
	const cursors = [...host.querySelectorAll<HTMLElement>("[data-sg-cursor]")];
	cursors.forEach((cursor) => cursor.classList.add("sg-gf-cursor"));

	const applyLook = () => {
		host.dataset.motion = mode;
		cursors.forEach((cursor, index) => cursor.style.setProperty("--c", settings.colors[index % Math.max(1, settings.colors.length)] ?? "var(--sg-gf-ink)"));
		cursors.forEach((cursor) => (cursor.hidden = !settings.cursors));
	};
	applyLook();

	// Geometry
	let width = 0;
	let cardWidth = 0;
	const center = (cards.length - 1) / 2;

	/** Where each card rests: an arc that sinks and turns toward its edges. */
	const restPose = (index: number): Pose => {
		const t = center === 0 ? 0 : (index - center) / center;
		// On narrow screens the fan may run past the edges: cards stay readable, the outer ones bleed off.
		const reach = Math.max((width * settings.spread) / 2 - cardWidth / 2, cardWidth * 0.55 * center);
		const edge = Math.abs(t);
		return {
			x: t * reach,
			y: edge * edge * cardWidth * 0.07,
			z: -Math.pow(edge, 1.4) * settings.depth,
			ry: -t * settings.angle,
			// A hand of cards: the outer ones lean out, a third of the turn.
			rz: t * settings.angle * 0.32,
			s: 1 - edge * 0.06,
			// The middle on top; each side climbs toward it.
			order: 100 - Math.round(edge * center) * 2 - (index > center ? 1 : 0),
		};
	};

	/** The raised card comes forward and faces the viewer; its neighbours make room. */
	const pose = (index: number): Pose => {
		const base = restPose(index);
		if (active === null) return base;
		const distance = index - active;
		if (distance === 0) return { ...base, y: base.y - cardWidth * 0.14, z: base.z + 110, ry: base.ry * 0.2, rz: 0, s: base.s * 1.07, order: 300 };
		const room = Math.max(0, 1 - (Math.abs(distance) - 1) * 0.5) * cardWidth * 0.2;
		return { ...base, x: base.x + Math.sign(distance) * room };
	};

	const paint = (index: number, value: Pose) => {
		const card = cards[index];
		card.style.setProperty("--x", `${value.x.toFixed(1)}px`);
		card.style.setProperty("--y", `${value.y.toFixed(1)}px`);
		card.style.setProperty("--z", `${value.z.toFixed(1)}px`);
		card.style.setProperty("--ry", `${value.ry.toFixed(2)}deg`);
		card.style.setProperty("--rz", `${value.rz.toFixed(2)}deg`);
		card.style.setProperty("--s", value.s.toFixed(3));
		card.style.zIndex = String(value.order);
	};

	let active: number | null = null;
	const update = () => {
		cards.forEach((card, index) => {
			paint(index, pose(index));
			card.toggleAttribute("data-active", index === active);
		});
		placeCursors();
	};
	const setActive = (next: number | null) => {
		if (next === active) return;
		active = next;
		update();
	};

	// Cursors rest just above their card's top-left, where it is drawn (perspective included).
	const cursorCards = cursors.map((cursor, index) => {
		const asked = Number(cursor.dataset.card);
		return Number.isInteger(asked) ? Math.min(cards.length - 1, Math.max(0, asked)) : Math.round(((index + 1) * (cards.length - 1)) / (cursors.length + 1));
	});
	const placeCursors = () => {
		const height = cardWidth * 1.25;
		cursors.forEach((cursor, index) => {
			const at = pose(cursorCards[index]);
			const scale = PERSPECTIVE / (PERSPECTIVE - at.z);
			const left = (at.x - (cardWidth / 2) * at.s * 0.55) * scale;
			const top = (at.y - (height / 2) * at.s) * scale - 52;
			cursor.style.setProperty("--cx", `${left.toFixed(1)}px`);
			cursor.style.setProperty("--cy", `${top.toFixed(1)}px`);
		});
	};

	// Every few seconds, one collaborator moves to another card.
	let hop = 0;
	const moveCursor = () => {
		if (signal.aborted) return;
		if (mode === "ready" && settings.cursors && visibility.state.ratio > 0 && cursors.length > 0) {
			const which = hop % cursors.length;
			const taken = new Set(cursorCards);
			// The same walk every time: a step of three cards, skipping the other cursor's.
			let next = cursorCards[which];
			for (let step = 0; step < cards.length; step++) {
				next = (next + 3) % cards.length;
				if (!taken.has(next)) break;
			}
			cursorCards[which] = next;
			hop++;
			placeCursors();
		}
		later(CURSOR_EVERY, moveCursor);
	};

	const measure = () => {
		width = fan.clientWidth;
		cardWidth = cards[0].offsetWidth;
		update();
	};

	// Pointer: the card nearest the pointer rises. Touch scrubs through the fan.
	const nearest = (clientX: number) => {
		const box = fan.getBoundingClientRect();
		const x = clientX - box.left - box.width / 2;
		let best = 0;
		cards.forEach((_, index) => {
			if (Math.abs(restPose(index).x - x) < Math.abs(restPose(best).x - x)) best = index;
		});
		return Math.abs(restPose(best).x - x) < cardWidth ? best : null;
	};
	let touching = false;
	fan.addEventListener(
		"pointermove",
		(event) => {
			if (!settings.pointer || (event.pointerType === "touch" && !touching)) return;
			setActive(nearest(event.clientX));
		},
		{ signal },
	);
	fan.addEventListener(
		"pointerdown",
		(event) => {
			if (event.pointerType !== "touch" || !settings.pointer) return;
			touching = true;
			setActive(nearest(event.clientX));
		},
		{ signal },
	);
	const release = (event: PointerEvent) => {
		if (event.pointerType === "touch") {
			touching = false;
			later(1600, () => !touching && !fan.contains(document.activeElement) && setActive(null));
		} else if (!fan.contains(document.activeElement)) setActive(null);
	};
	fan.addEventListener("pointerup", release, { signal });
	fan.addEventListener("pointercancel", release, { signal });
	fan.addEventListener("pointerleave", (event) => event.pointerType !== "touch" && !fan.contains(document.activeElement) && setActive(null), { signal });

	// Keyboard: focus raises a card; arrows walk the fan.
	fan.addEventListener("focusin", (event) => {
		const index = cards.indexOf((event.target as Element).closest("[data-sg-card]") as HTMLElement);
		if (index >= 0) setActive(index);
	}, { signal });
	fan.addEventListener("focusout", (event) => !fan.contains(event.relatedTarget as Node) && setActive(null), { signal });
	fan.addEventListener(
		"keydown",
		(event) => {
			if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
			const from = cards.indexOf((event.target as Element).closest("[data-sg-card]") as HTMLElement);
			if (from < 0) return;
			event.preventDefault();
			cards[Math.min(cards.length - 1, Math.max(0, from + (event.key === "ArrowRight" ? 1 : -1)))].focus();
		},
		{ signal },
	);

	// Entrance: stacked in the middle, then opened from the centre outward.
	let played = false;
	const stack = () => {
		cards.forEach((_, index) => paint(index, { x: 0, y: cardWidth * 0.12, z: -160, ry: 0, rz: (index - center) * 2, s: 0.9, order: restPose(index).order }));
	};
	const play = () => {
		played = true;
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				if (signal.aborted) return;
				cards.forEach((card, index) => card.style.setProperty("--delay", `${Math.round(Math.abs(index - center) * 90)}ms`));
				delete host.dataset.intro;
				update();
				later(Math.round(center * 90) + 800, () => cards.forEach((card) => card.style.removeProperty("--delay")));
			}),
		);
	};
	const visibility = trackVisibility(host, (ratio) => {
		if (!played && host.dataset.intro === "pending" && ratio >= 0.3) play();
	});

	const resize = new ResizeObserver(() => {
		const stacked = host.dataset.intro === "pending";
		width = fan.clientWidth;
		cardWidth = cards[0].offsetWidth;
		if (stacked) stack();
		else update();
	});
	resize.observe(fan);

	measure();
	if (mode === "ready" && settings.intro) {
		host.dataset.intro = "pending";
		stack();
	}
	host.dataset.ready = "";
	later(CURSOR_EVERY, moveCursor);

	const stopMotion = onMotionPreferenceChange(() => {
		mode = readMotionMode();
		applyLook();
		if (mode !== "ready" && host.dataset.intro) {
			delete host.dataset.intro;
			update();
		}
	});

	return {
		setConfig(next) {
			settings = galleryFanConfigSchema.parse(next ?? {});
			applyLook();
			if (host.dataset.intro !== "pending") update();
		},
		destroy() {
			cancel.abort();
			stopMotion();
			visibility.dispose();
			resize.disconnect();
			timers.forEach((timer) => window.clearTimeout(timer));
			for (const card of cards) {
				for (const name of ["--x", "--y", "--z", "--ry", "--rz", "--s", "--delay"]) card.style.removeProperty(name);
				card.style.removeProperty("z-index");
				card.removeAttribute("data-active");
			}
			for (const cursor of cursors) {
				cursor.style.removeProperty("--cx");
				cursor.style.removeProperty("--cy");
			}
			delete host.dataset.intro;
			delete host.dataset.ready;
		},
	};
}
