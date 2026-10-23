import type { ComponentType, ReactNode } from 'react';
import type { z } from 'zod';
import { GamepadHero } from '@/heroes/gamepad/gamepad';
import { defineGamepadElement } from '@/heroes/gamepad/gamepad.element';
import { meta as gamepadMeta } from '@/heroes/gamepad/meta';
import * as gamepadSchema from '@/heroes/gamepad/schema';
import { HoloCardHero } from '@/heroes/holo-card/holo-card';
import { defineHoloCardElement } from '@/heroes/holo-card/holo-card.element';
import { meta as holoCardMeta } from '@/heroes/holo-card/meta';
import * as holoCardSchema from '@/heroes/holo-card/schema';
import { SplitHeadlineHero } from '@/heroes/split-headline/split-headline';
import { defineSplitHeadlineElement } from '@/heroes/split-headline/split-headline.element';
import { meta as splitHeadlineMeta } from '@/heroes/split-headline/meta';
import * as splitHeadlineSchema from '@/heroes/split-headline/schema';
import { MarqueeTypeHero } from '@/heroes/marquee-type/marquee-type';
import { defineMarqueeTypeElement } from '@/heroes/marquee-type/marquee-type.element';
import { meta as marqueeTypeMeta } from '@/heroes/marquee-type/meta';
import * as marqueeTypeSchema from '@/heroes/marquee-type/schema';
import { TerminalBootHero } from '@/heroes/terminal-boot/terminal-boot';
import { defineTerminalBootElement } from '@/heroes/terminal-boot/terminal-boot.element';
import { meta as terminalBootMeta } from '@/heroes/terminal-boot/meta';
import * as terminalBootSchema from '@/heroes/terminal-boot/schema';
import { AppWindowHero } from '@/heroes/app-window/app-window';
import { defineAppWindowElement } from '@/heroes/app-window/app-window.element';
import { meta as appWindowMeta } from '@/heroes/app-window/meta';
import * as appWindowSchema from '@/heroes/app-window/schema';
import { BeamGridHero } from '@/heroes/beam-grid/beam-grid';
import { defineBeamGridElement } from '@/heroes/beam-grid/beam-grid.element';
import { meta as beamGridMeta } from '@/heroes/beam-grid/meta';
import * as beamGridSchema from '@/heroes/beam-grid/schema';
import { ConicRaysHero } from '@/heroes/conic-rays/conic-rays';
import { defineConicRaysElement } from '@/heroes/conic-rays/conic-rays.element';
import { meta as conicRaysMeta } from '@/heroes/conic-rays/meta';
import { GalleryFanHero } from '@/heroes/gallery-fan/gallery-fan';
import { defineGalleryFanElement } from '@/heroes/gallery-fan/gallery-fan.element';
import { meta as galleryFanMeta } from '@/heroes/gallery-fan/meta';
import * as galleryFanSchema from '@/heroes/gallery-fan/schema';
import * as conicRaysSchema from '@/heroes/conic-rays/schema';
import { AuroraMeshHero } from '@/heroes/aurora-mesh/aurora-mesh';
import { defineAuroraMeshElement } from '@/heroes/aurora-mesh/aurora-mesh.element';
import { meta as auroraMeshMeta } from '@/heroes/aurora-mesh/meta';
import * as auroraMeshSchema from '@/heroes/aurora-mesh/schema';
import { GravityFieldHero } from '@/heroes/gravity-field/gravity-field';
import { defineGravityFieldElement } from '@/heroes/gravity-field/gravity-field.element';
import { meta as gravityFieldMeta } from '@/heroes/gravity-field/meta';
import * as gravityFieldSchema from '@/heroes/gravity-field/schema';
import { InkFlowHero } from '@/heroes/ink-flow/ink-flow';
import { defineInkFlowElement } from '@/heroes/ink-flow/ink-flow.element';
import { meta as inkFlowMeta } from '@/heroes/ink-flow/meta';
import * as inkFlowSchema from '@/heroes/ink-flow/schema';
import { ReactionDiffusionHero } from '@/heroes/reaction-diffusion/reaction-diffusion';
import { defineReactionDiffusionElement } from '@/heroes/reaction-diffusion/reaction-diffusion.element';
import { meta as reactionDiffusionMeta } from '@/heroes/reaction-diffusion/meta';
import * as reactionDiffusionSchema from '@/heroes/reaction-diffusion/schema';
import { ParticleTypeHero } from '@/heroes/particle-type/particle-type';
import { defineParticleTypeElement } from '@/heroes/particle-type/particle-type.element';
import { meta as particleTypeMeta } from '@/heroes/particle-type/meta';
import * as particleTypeSchema from '@/heroes/particle-type/schema';
import { LiquidGlassHero } from '@/heroes/liquid-glass/liquid-glass';
import { defineLiquidGlassElement } from '@/heroes/liquid-glass/liquid-glass.element';
import { meta as liquidGlassMeta } from '@/heroes/liquid-glass/meta';
import * as liquidGlassSchema from '@/heroes/liquid-glass/schema';

type Schema = z.ZodObject<z.ZodRawShape>;

/** A hero's two schemas, found by name in its schema module (`…ContentSchema`, `…ConfigSchema`). */
function schemasOf(module: Record<string, unknown>) {
  const find = (suffix: string) => Object.entries(module).find(([key]) => key.endsWith(suffix))?.[1] as Schema;
  return { content: find('ContentSchema'), config: find('ConfigSchema') };
}

export type HeroEntry = {
  meta: { name: string; title: string; engine: 'webgpu' | 'dom'; summary: string; useWhen: string; gpu?: { cost: number }; poster?: boolean };
  /** For the props tables and the config panel. */
  schemas: { content: Schema; config: Schema };
  // Each hero takes its own config type; the site drives them all from their schemas.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Hero: ComponentType<{ className?: string; config?: any }>;
  /** Registers the Web Component; its tag is `sg-<name>`. */
  defineElement: () => void;
  /** Attributes for the Web Component demo: a different palette than the React one. */
  elementAttributes: Record<string, string>;
  /** The Web Component's children, when the hero needs more than a title (DOM heroes bring their sections). */
  elementChildren?: ReactNode;
};

/** Every hero of the collection: the WebGPU v0.1 list, then the DOM v0.2 list (RFC-0001). */
export const heroes: HeroEntry[] = [
  {
    meta: auroraMeshMeta,
    schemas: schemasOf(auroraMeshSchema),
    Hero: AuroraMeshHero,
    defineElement: () => defineAuroraMeshElement(),
    elementAttributes: { colors: 'oklch(0.8 0.15 85), oklch(0.7 0.19 40), oklch(0.6 0.2 350)', speed: '1.4' },
  },
  {
    meta: inkFlowMeta,
    schemas: schemasOf(inkFlowSchema),
    Hero: InkFlowHero,
    defineElement: () => defineInkFlowElement(),
    elementAttributes: { colors: 'oklch(0.78 0.17 75), oklch(0.68 0.22 25), oklch(0.6 0.2 300)', swirl: '32', calm: '0.6' },
  },
  {
    meta: gravityFieldMeta,
    schemas: schemasOf(gravityFieldSchema),
    Hero: GravityFieldHero,
    defineElement: () => defineGravityFieldElement(),
    elementAttributes: { colors: 'oklch(0.75 0.18 30), oklch(0.82 0.14 70), oklch(0.95 0.05 95)', gravity: '1.4', size: '1.8' },
  },
  {
    meta: reactionDiffusionMeta,
    schemas: schemasOf(reactionDiffusionSchema),
    Hero: ReactionDiffusionHero,
    defineElement: () => defineReactionDiffusionElement(),
    elementAttributes: { colors: 'oklch(0.7 0.18 30), oklch(0.85 0.14 80)', pattern: 'maze' },
  },
  {
    meta: particleTypeMeta,
    schemas: schemasOf(particleTypeSchema),
    Hero: ParticleTypeHero,
    defineElement: () => defineParticleTypeElement(),
    elementAttributes: { colors: 'oklch(0.8 0.15 85), oklch(0.7 0.19 30), oklch(0.95 0.04 95)', gap: '3' },
  },
  {
    meta: liquidGlassMeta,
    schemas: schemasOf(liquidGlassSchema),
    Hero: LiquidGlassHero,
    defineElement: () => defineLiquidGlassElement(),
    elementAttributes: { colors: 'oklch(0.78 0.15 60), oklch(0.98 0.02 90)', image: '/sharingan/product.png', refraction: '1.4' },
  },
  {
    meta: gamepadMeta,
    schemas: schemasOf(gamepadSchema),
    Hero: GamepadHero,
    defineElement: () => defineGamepadElement(),
    elementAttributes: { colors: 'oklch(0.7 0.17 160), oklch(0.62 0.2 300), oklch(0.82 0.15 75), oklch(0.65 0.21 15)', shell: 'graphite', 'data-wordmark': 'SG·PAD', 'data-wordmark-tagline': 'WEB COMPONENT', 'data-collaborators': 'Kai' },
    elementChildren: (
      <>
        <div data-sg-slide="home">
          <p className="sg-gp-eyebrow">Web Component · no framework</p>
          <h2 className="!text-5xl">&lt;sg-gamepad&gt;</h2>
          <p>The same engine, driven by attributes. Each section below is plain HTML in the page; the controller only shows one at a time.</p>
        </div>
        <div data-sg-slide="" data-label="Markup">
          <h2>Sections are your own HTML</h2>
          <p>One data-sg-slide="home", then up to four data-sg-slide elements with a data-label. They land on Y, X, B and A.</p>
        </div>
        <div data-sg-slide="" data-label="Attributes">
          <h2>Configured with attributes</h2>
          <ul>
            <li>colors</li>
            <li>shell</li>
            <li>tilt</li>
            <li>keyboard</li>
            <li>gamepad</li>
          </ul>
        </div>
        <div data-sg-slide="" data-label="Everywhere">
          <h2>Runs in every browser</h2>
          <p>HTML, SVG and CSS 3D transforms only. No canvas, no WebGPU: phones get the same hero as desktops.</p>
        </div>
      </>
    ),
  },
  {
    meta: holoCardMeta,
    schemas: schemasOf(holoCardSchema),
    Hero: HoloCardHero,
    defineElement: () => defineHoloCardElement(),
    elementAttributes: { colors: 'oklch(0.85 0.13 85), oklch(0.75 0.17 40), oklch(0.82 0.12 170)', surface: 'light', pattern: 'lines' },
    elementChildren: (
      <>
        <div className="sg-hc-copy">
          <p className="sg-hc-eyebrow">Web Component · no framework</p>
          <h2 className="text-5xl font-semibold tracking-tight">&lt;sg-holo-card&gt;</h2>
          <p>The same engine, driven by attributes: a light surface and engraved lines here. Click the card or the button to turn it over.</p>
        </div>
        <div>
          <div data-sg-card="" role="group" aria-label="Member card">
            <div data-sg-front="">
              <div className="sg-hc-row">
                <span className="sg-hc-issuer">ATELIER·CLUB</span>
              </div>
              <div>
                <p className="sg-hc-name">Kai Mensah</p>
                <p className="sg-hc-role">Member since 2024</p>
              </div>
              <div className="sg-hc-row">
                <span className="sg-hc-detail">Valid until Dec 2027</span>
                <span className="sg-hc-number">M-2207</span>
              </div>
            </div>
            <div data-sg-back="">
              <div>
                <h2>Members get</h2>
                <ul>
                  <li>Open studio on Saturdays</li>
                  <li>Ten percent off workshops</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    meta: splitHeadlineMeta,
    schemas: schemasOf(splitHeadlineSchema),
    Hero: SplitHeadlineHero,
    defineElement: () => defineSplitHeadlineElement(),
    elementAttributes: { intro: 'rise', accent: 'oklch(0.7 0.19 40)', radius: '2', stagger: '40' },
    elementChildren: (
      <>
        <p className="sg-sh-eyebrow">Web Component · no framework</p>
        <h2 data-sg-split="">Split, then answer</h2>
        <p className="sg-sh-sub" data-sg-after="">
          &lt;sg-split-headline&gt;: the same engine, driven by attributes. Letters rise from below here, and a warmer accent follows the pointer.
        </p>
      </>
    ),
  },
  {
    meta: marqueeTypeMeta,
    schemas: schemasOf(marqueeTypeSchema),
    Hero: MarqueeTypeHero,
    defineElement: () => defineMarqueeTypeElement(),
    elementAttributes: { look: 'outline', direction: 'left', tilt: '0', separator: '/', accent: 'oklch(0.7 0.19 40)', speed: '1.6' },
    elementChildren: (
      <>
        <div className="sg-mq-copy">
          <p className="sg-mq-eyebrow">Web Component · no framework</p>
          <h2 className="text-5xl font-semibold tracking-tight">&lt;sg-marquee-type&gt;</h2>
          <p>The same engine, driven by attributes: outlined, flat, all to the left, a slash between words.</p>
        </div>
        <div data-sg-rows="" role="group" aria-label="Line-up">
          <div data-sg-row="">
            <ul>
              <li>Friday</li>
              <li>Saturday</li>
              <li>Sunday</li>
            </ul>
          </div>
          <div data-sg-row="">
            <ul>
              <li>Afrobeats</li>
              <li>Amapiano</li>
              <li>Highlife</li>
              <li>Jazz</li>
            </ul>
          </div>
        </div>
      </>
    ),
  },
  {
    meta: terminalBootMeta,
    schemas: schemasOf(terminalBootSchema),
    Hero: TerminalBootHero,
    defineElement: () => defineTerminalBootElement(),
    elementAttributes: { accent: 'oklch(0.75 0.17 60)', speed: '30', loop: 'true' },
    elementChildren: (
      <>
        <div className="sg-tb-copy">
          <p className="sg-tb-eyebrow">Web Component · no framework</p>
          <h2 className="text-5xl font-semibold tracking-tight">&lt;sg-terminal-boot&gt;</h2>
          <p>The same engine, driven by attributes: a warmer prompt, faster hands, and it starts again by itself.</p>
        </div>
        <div className="sg-tb-scene">
          <div className="sg-tb-terminal" role="group" aria-label="Terminal">
            <div className="sg-tb-bar">
              <span className="sg-tb-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="sg-tb-title">~/site</span>
              <span className="sg-tb-actions" data-sg-actions="" />
            </div>
            <ul className="sg-tb-body">
              <li>
                <span className="sg-tb-prompt" aria-hidden="true">$</span>
                <code data-sg-command="">npx shadcn@latest add @sharingan/terminal-boot</code>
              </li>
              <li data-sg-line="" data-status="ok">
                <span data-sg-icon="" aria-hidden="true">✔</span>
                <span>Checked components.json</span>
              </li>
              <li data-sg-line="" data-status="ok">
                <span data-sg-icon="" aria-hidden="true">✔</span>
                <span>Added lib/sharingan and heroes/terminal-boot</span>
              </li>
              <li data-sg-line="" data-status="info">
                <span data-sg-icon="" aria-hidden="true">›</span>
                <span>No canvas, no WebGPU: runs in every browser</span>
              </li>
              <li data-sg-done="">
                <span data-sg-icon="" aria-hidden="true">➜</span>
                <span>Done. Import TerminalBootHero.</span>
              </li>
            </ul>
          </div>
        </div>
      </>
    ),
  },
  {
    meta: appWindowMeta,
    schemas: schemasOf(appWindowSchema),
    Hero: AppWindowHero,
    defineElement: () => defineAppWindowElement(),
    elementAttributes: { accent: 'oklch(0.7 0.17 160)', stagger: '160' },
    elementChildren: (
      <>
        <div className="sg-aw-copy">
          <p className="sg-aw-eyebrow">Web Component · no framework</p>
          <h2 className="text-5xl font-semibold tracking-tight">&lt;sg-app-window&gt;</h2>
          <p>The same engine, driven by attributes. This screen is plain HTML with a data-points chart the engine draws.</p>
        </div>
        <div>
          <div data-sg-window="" role="img" aria-label="Example habit tracker: three streak cards and a weekly chart">
            <div className="sg-aw-chrome" data-sg-panel="" aria-hidden="true">
              <i />
              <i />
              <i />
              <span className="sg-aw-address">streaks.app</span>
            </div>
            <div className="sg-aw-main" aria-hidden="true">
              <div className="sg-aw-head" data-sg-panel="">
                <h3>This week</h3>
                <span className="sg-aw-button">Log a habit</span>
              </div>
              <div className="sg-aw-stats">
                <div className="sg-aw-card" data-sg-panel="" data-depth="3">
                  <div className="sg-aw-stat-label">Reading</div>
                  <div className="sg-aw-stat-value"><span data-sg-count="">21 days</span></div>
                </div>
                <div className="sg-aw-card" data-sg-panel="" data-depth="3">
                  <div className="sg-aw-stat-label">Running</div>
                  <div className="sg-aw-stat-value"><span data-sg-count="">42 km</span></div>
                </div>
                <div className="sg-aw-card" data-sg-panel="" data-depth="3">
                  <div className="sg-aw-stat-label">Sleep</div>
                  <div className="sg-aw-stat-value"><span data-sg-count="">7.6 h</span></div>
                </div>
              </div>
              <div className="sg-aw-card sg-aw-chart" data-sg-panel="" data-depth="1" data-sg-chart="" data-points="3,5,4,6,8,7,9,11,10,12">
                <div className="sg-aw-stat-label">Habits done per day</div>
              </div>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    meta: beamGridMeta,
    schemas: schemasOf(beamGridSchema),
    Hero: BeamGridHero,
    defineElement: () => defineBeamGridElement(),
    elementAttributes: { colors: 'oklch(0.75 0.17 60), oklch(0.68 0.2 25)', cell: '40', beams: '10', speed: '1.6', length: '100' },
    elementChildren: (
      <div className="sg-bm-copy">
        <p className="sg-bm-eyebrow">Web Component · no framework</p>
        <h2 className="text-5xl font-semibold tracking-tight">&lt;sg-beam-grid&gt;</h2>
        <p>The same engine, driven by attributes: a finer grid, warmer and faster beams. Click anywhere on the grid.</p>
      </div>
    ),
  },
  {
    meta: conicRaysMeta,
    schemas: schemasOf(conicRaysSchema),
    Hero: ConicRaysHero,
    defineElement: () => defineConicRaysElement(),
    elementAttributes: { colors: 'oklch(0.8 0.15 85), oklch(0.7 0.19 40), oklch(0.6 0.2 350)', origin: 'bottom', rays: '16', spread: '0.3', speed: '1.6' },
    elementChildren: (
      <div className="sg-cr-copy">
        <p className="sg-cr-eyebrow">Web Component · no framework</p>
        <h2 className="text-5xl font-semibold tracking-tight">&lt;sg-conic-rays&gt;</h2>
        <p>The same engine, driven by attributes: warmer light from below, thinner rays, turning faster.</p>
      </div>
    ),
  },
  {
    meta: galleryFanMeta,
    schemas: schemasOf(galleryFanSchema),
    Hero: GalleryFanHero,
    defineElement: () => defineGalleryFanElement(),
    elementAttributes: { spread: '0.6', angle: '30', depth: '320', colors: 'oklch(0.7 0.19 40)' },
    elementChildren: (
      <>
        <p className="sg-gf-eyebrow">Web Component · no framework</p>
        <h2 className="text-5xl font-semibold tracking-tight">&lt;sg-gallery-fan&gt;</h2>
        <div data-sg-fan="">
            <a data-sg-card="" href="https://unsplash.com/photos/6JO92DACboQ" aria-label="Blue square, by Fons Heijnsbroek">
              <img src="/sharingan/gallery/stripes.webp" alt="" />
              <span className="sg-gf-caption"><b>Blue square</b><span>Fons Heijnsbroek</span></span>
            </a>
            <a data-sg-card="" href="https://unsplash.com/photos/62DpZ5uJxJc" aria-label="Rooster on gold, by Europeana">
              <img src="/sharingan/gallery/rooster.webp" alt="" />
              <span className="sg-gf-caption"><b>Rooster on gold</b><span>Europeana</span></span>
            </a>
            <a data-sg-card="" href="https://unsplash.com/photos/e_95AkA4A4A" aria-label="Bird in colour, by Fons Heijnsbroek">
              <img src="/sharingan/gallery/bird.webp" alt="" />
              <span className="sg-gf-caption"><b>Bird in colour</b><span>Fons Heijnsbroek</span></span>
            </a>
            <a data-sg-card="" href="https://unsplash.com/photos/dy3z3x8Khz4" aria-label="Red, blue, black, by Fons Heijnsbroek">
              <img src="/sharingan/gallery/strokes.webp" alt="" />
              <span className="sg-gf-caption"><b>Red, blue, black</b><span>Fons Heijnsbroek</span></span>
            </a>
            <a data-sg-card="" href="https://unsplash.com/photos/mOrJ9WCGbUo" aria-label="Geometric study, by The New York Public Library">
              <img src="/sharingan/gallery/shapes.webp" alt="" />
              <span className="sg-gf-caption"><b>Geometric study</b><span>The New York Public Library</span></span>
            </a>
          <div data-sg-cursor="" data-card="2" aria-hidden="true">
            <div className="sg-gf-bob">
              <span className="sg-gf-bubble">@you</span>
            </div>
          </div>
        </div>
        <p className="sg-gf-sub">The same engine, driven by attributes: five cards, a narrower and deeper fan, one collaborator.</p>
      </>
    ),
  },
];

export const findHero = (name: string | undefined) => heroes.find((hero) => hero.meta.name === name);
