# Animation plans

Plans from the motion audit of every hero (all 18 heroes and `packages/core`), written at commit `617c2fa`. Each plan is self-contained: hand one plan to one executor. Values come from Emil Kowalski's animation guidelines (strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)`, UI feedback under 300 ms, never `scale(0)`, reduced motion keeps opacity and colour).

## Plans

| # | Plan | Severity | Area | Status |
| --- | --- | --- | --- | --- |
| 001 | [WebGPU heroes continue from their still frame](001-webgpu-continuous-clock.md) | HIGH | aurora-mesh, liquid-glass, gravity-field, ink-flow | TODO |
| 002 | [Trail map stops: no `scale(0)`, no bounce](002-trail-map-stops-no-scale-zero.md) | HIGH | trail-map | TODO |
| 003 | [Hover feedback under 300 ms](003-hover-feedback-durations.md) | HIGH | gallery-fan, bento-tiles | TODO |
| 004 | [Bento figures count once, not on every hover](004-bento-figures-no-replay.md) | HIGH | bento-tiles | TODO |
| 005 | [One source of smoothing](005-single-source-smoothing.md) | MEDIUM | app-window, split-headline | TODO |
| 006 | [Press feedback, hover lifts gated for touch](006-press-feedback-and-touch-hover.md) | MEDIUM | core layout + every hero's buttons | TODO |
| 007 | [Reduced motion keeps opacity and colour](007-reduced-motion-keeps-feedback.md) | MEDIUM | 7 DOM heroes, trail-map scroll | TODO |
| 008 | [Gamepad section switch: 180 ms, no overshoot](008-gamepad-section-switch.md) | MEDIUM | gamepad | TODO |
| 009 | [Curve reel: no fling after a pause](009-curve-reel-fling-decay.md) | MEDIUM | curve-reel | TODO |
| 010 | [Reaction-diffusion independent of frame rate](010-reaction-diffusion-frame-rate.md) | MEDIUM | reaction-diffusion | TODO |
| 011 | [Entrances never block interaction](011-entrance-never-blocks-interaction.md) | MEDIUM | split-headline, bento-tiles | TODO |
| 012 | [Particle type: headline hands off without flicker](012-particle-type-headline-handoff.md) | MEDIUM | particle-type | TODO |
| 013 | [WebGPU resize keeps the picture](013-webgpu-resize-keeps-state.md) | MEDIUM | core mount, ink-flow, reaction-diffusion, particle-type | TODO |
| 014 | [No per-frame variables on parents](014-no-per-frame-parent-variables.md) | MEDIUM | holo-card, app-window, gamepad, trail-map, beam-grid | TODO |
| 015 | [Bento paint cost](015-bento-paint-cost.md) | MEDIUM | bento-tiles | TODO |

## Execution order and dependencies

Plans in different tracks touch different files and can run in parallel. Run the plans inside a track in order: they share files, and line numbers shift after each one (every plan says to locate code by its quoted text when that happens).

- **WebGPU track:** 001 → 010 → 012 → 013. Plan 013 requires 001, because ink-flow's still frame is only continued once its scene clock exists.
- **Bento / gallery track:** 003 → 004 → 011 → 015. These have no logical dependency; they share bento-tiles files.
- **Cross-hero track:** 006 → 007. Both edit the same seven stylesheets. 007 also needs `fix/reveal-fallback` merged first.
- **Independent:** 002, 005, 008, 009, 014. Plan 014 edits the app-window, gamepad and trail-map *engines*, while 005, 007 and 002 edit their *stylesheets*. Running 014 after them avoids confusing line numbers.

Recommended overall order, by leverage: 001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 012, 013, 014, 015.

## Not planned (found during the audit)

- **LOW polish, not planned on purpose:**
  - shared easing tokens in `packages/core`;
  - beam-grid's 350 ms spotlight fade;
  - terminal-boot animating `width` for each typed character;
  - 90–110 ms staggers;
  - holo-card's flip settling in about 0.6 s.
- **Missed opportunities, additive:**
  - a crossfade from the CSS placeholder to the WebGPU canvas;
  - blending colours when the theme changes on WebGPU heroes;
  - entrances for holo-card, gamepad and marquee-type;
  - a crossfade on terminal-boot's "Copied" label.
- **Latent bug, fixed separately:** in app-window, gallery-fan and terminal-boot, the 2.5 s "reveal" fallback never ran, because the motion kill rule also matched before the engine set `data-motion`. Fixed in `61d6481` (branch `fix/reveal-fallback`). Plan 007 builds on it, so merge that branch before running 007.
- **Class prefix collision:** conic-rays and curve-reel both use `sg-cr`, which is a separate fix.
