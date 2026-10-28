import { adoptStyles, type DomHeroOptions } from "@/lib/sharingan";
import { boxWithin, createCounter, createScrollScope, gsap, revealOnEnter, scrubs, type SectionEngine } from "@/lib/sharingan/scroll";
import { bentoAssembleConfigSchema, type BentoAssembleConfig, type BentoAssembleConfigInput } from "./schema";
import { BENTO_ASSEMBLE_STYLE_ID, bentoAssembleStyles } from "./styles";

/**
 * Markup the engine expects inside the host:
 * - optionally `[data-sg-stage]`, the element pinned while the section scrubs (the host otherwise);
 * - optionally a `[data-sg-head]` with the headline, and in it a `[data-sg-badge]` link whose
 *   `aria-label` is set around it in a ring (the ring is added if missing);
 * - a `[data-sg-grid]` of `[data-sg-tile]` items, each with an optional `data-size`
 *   (small, wide, tall, large) and `data-tone` (paper, accent, accent-2, photo);
 * - in the tiles, `[data-sg-count]` figures, which count up as their tile lands.
 */

const SVG = "http://www.w3.org/2000/svg";
let rings = 0;

/** Bento assemble (Sharingan section). Bento tiles fly in and lock into place; their figures count up. */
export function createBentoAssemble({ host, config }: DomHeroOptions<BentoAssembleConfigInput>): SectionEngine<BentoAssembleConfigInput> {
	adoptStyles(host, BENTO_ASSEMBLE_STYLE_ID, bentoAssembleStyles);
	host.classList.add("sg-ba");

	const stage = host.querySelector<HTMLElement>("[data-sg-stage]") ?? host;
	const grid = host.querySelector<HTMLElement>("[data-sg-grid]");
	const tiles = [...host.querySelectorAll<HTMLElement>("[data-sg-tile]")];
	if (!grid || tiles.length === 0) return { setConfig() {}, refresh() {}, destroy() {} };
	const head = host.querySelector<HTMLElement>("[data-sg-head]");
	const badge = host.querySelector<HTMLElement>("[data-sg-badge]");
	const figures = [...host.querySelectorAll<HTMLElement>("[data-sg-count]")];

	stage.classList.add("sg-ba-stage");
	head?.classList.add("sg-ba-head");
	grid.classList.add("sg-ba-grid");
	tiles.forEach((tile) => {
		tile.classList.add("sg-ba-tile");
		tile.dataset.size ??= "small";
		tile.dataset.tone ??= "paper";
	});
	figures.forEach((figure) => figure.classList.add("sg-ba-figure"));

	// The badge: a play button ringed by its label, set on a circle.
	const added: Element[] = [];
	let ring = badge?.querySelector<SVGSVGElement>(".sg-ba-ring") ?? null;
	if (badge) {
		badge.classList.add("sg-ba-badge");
		if (!badge.querySelector(".sg-ba-play")) {
			const play = document.createElement("span");
			play.className = "sg-ba-play";
			play.setAttribute("aria-hidden", "true");
			badge.append(play);
			added.push(play);
		}
		const label = badge.getAttribute("aria-label") ?? "";
		if (!ring && label) {
			const id = `sg-ba-ring-${++rings}`;
			ring = document.createElementNS(SVG, "svg");
			ring.setAttribute("class", "sg-ba-ring");
			ring.setAttribute("viewBox", "0 0 100 100");
			ring.setAttribute("aria-hidden", "true");
			ring.innerHTML = `<defs><path id="${id}" d="M50,50 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0"/></defs><text><textPath href="#${id}" textLength="246">${label.replace(/[<&]/g, "")} · </textPath></text>`;
			badge.prepend(ring);
			added.push(ring);
		}
	}

	let settings: BentoAssembleConfig = bentoAssembleConfigSchema.parse(config ?? {});
	const applyLook = () => {
		host.style.setProperty("--sg-ba-accent", settings.accent);
		host.style.setProperty("--sg-ba-accent-2", settings.accentAlt);
	};
	applyLook();

	const scope = createScrollScope(host, (context) => {
		const counters = settings.count && context.motion === "ready" ? figures.map((figure) => createCounter(figure)) : [];
		const restore = () => counters.forEach((counter) => counter?.restore());
		// The ring turns with the page, pinned or not.
		if (ring && context.motion === "ready") {
			gsap.to(ring, { rotation: 300, ease: "none", transformOrigin: "50% 50%", scrollTrigger: { trigger: host, start: "top bottom", end: "bottom top", scrub: 0.5 } });
		}

		if (!scrubs(context)) {
			revealOnEnter([head, ...tiles].filter((element): element is HTMLElement => element !== null), context);
			// Narrow screens with motion: each figure counts once, as its tile comes in.
			counters.forEach((counter, index) => {
				if (!counter) return;
				counter.start();
				gsap.to(counter.state, { progress: 1, duration: 1.4, ease: "power2.out", onUpdate: counter.draw, scrollTrigger: { trigger: figures[index], start: "top 88%", once: true } });
			});
			return restore;
		}

		host.dataset.scrub = "";
		const centerX = grid.offsetWidth / 2;
		const centerY = grid.offsetHeight / 2;
		// Each tile starts further out along the line from the grid's centre, smaller and transparent.
		tiles.forEach((tile, index) => {
			const box = boxWithin(tile, grid);
			const dx = box.left + box.width / 2 - centerX;
			const dy = box.top + box.height / 2 - centerY;
			gsap.set(tile, { x: dx * settings.spread, y: dy * settings.spread + 40, scale: 0.82, opacity: 0, rotation: (index % 2 ? 1 : -1) * 3 * settings.spread });
		});
		if (head) gsap.set(head, { opacity: 0.35, y: 24 });

		const tl = gsap.timeline({
			defaults: { ease: "none" },
			scrollTrigger: { trigger: stage, pin: true, start: "top top", end: () => `+=${window.innerHeight * settings.length}`, scrub: 0.4, anticipatePin: 1 },
		});
		if (head) tl.to(head, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0);
		const step = 2 / Math.max(1, tiles.length);
		tiles.forEach((tile, index) => {
			const at = 0.2 + index * step;
			tl.to(tile, { x: 0, y: 0, scale: 1, opacity: 1, rotation: 0, duration: 1, ease: "power3.out" }, at);
			// The figures in this tile count while it lands, and a little after.
			figures.forEach((figure, figureIndex) => {
				const counter = counters[figureIndex];
				if (!counter || !tile.contains(figure)) return;
				counter.start();
				tl.to(counter.state, { progress: 1, duration: 1.3, ease: "power1.out", onUpdate: counter.draw }, at + 0.15);
			});
		});
		tl.to({}, { duration: 0.4 });

		return () => {
			restore();
			delete host.dataset.scrub;
		};
	});

	return {
		setConfig(next) {
			settings = bentoAssembleConfigSchema.parse(next ?? {});
			applyLook();
			scope.rebuild();
		},
		refresh: scope.refresh,
		destroy() {
			scope.destroy();
			added.forEach((node) => node.remove());
			host.style.removeProperty("--sg-ba-accent");
			host.style.removeProperty("--sg-ba-accent-2");
		},
	};
}
