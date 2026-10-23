import type { ComponentType } from 'react';
import { AuroraMeshHero } from '@/heroes/aurora-mesh/aurora-mesh';
import { defineAuroraMeshElement } from '@/heroes/aurora-mesh/aurora-mesh.element';
import { meta as auroraMeshMeta } from '@/heroes/aurora-mesh/meta';
import { GravityFieldHero } from '@/heroes/gravity-field/gravity-field';
import { defineGravityFieldElement } from '@/heroes/gravity-field/gravity-field.element';
import { meta as gravityFieldMeta } from '@/heroes/gravity-field/meta';
import { InkFlowHero } from '@/heroes/ink-flow/ink-flow';
import { defineInkFlowElement } from '@/heroes/ink-flow/ink-flow.element';
import { meta as inkFlowMeta } from '@/heroes/ink-flow/meta';
import { ReactionDiffusionHero } from '@/heroes/reaction-diffusion/reaction-diffusion';
import { defineReactionDiffusionElement } from '@/heroes/reaction-diffusion/reaction-diffusion.element';
import { meta as reactionDiffusionMeta } from '@/heroes/reaction-diffusion/meta';
import { ParticleTypeHero } from '@/heroes/particle-type/particle-type';
import { defineParticleTypeElement } from '@/heroes/particle-type/particle-type.element';
import { meta as particleTypeMeta } from '@/heroes/particle-type/meta';
import { LiquidGlassHero } from '@/heroes/liquid-glass/liquid-glass';
import { defineLiquidGlassElement } from '@/heroes/liquid-glass/liquid-glass.element';
import { meta as liquidGlassMeta } from '@/heroes/liquid-glass/meta';

export type HeroEntry = {
  meta: { name: string; title: string; summary: string; useWhen: string; gpu: { cost: number } };
  Hero: ComponentType<{ className?: string }>;
  /** Registers the Web Component; its tag is `sg-<name>`. */
  defineElement: () => void;
  /** Attributes for the Web Component demo: a different palette than the React one. */
  elementAttributes: Record<string, string>;
};

/** Every hero of the collection, in the order of the RFC's v0.1 list. */
export const heroes: HeroEntry[] = [
  {
    meta: auroraMeshMeta,
    Hero: AuroraMeshHero,
    defineElement: () => defineAuroraMeshElement(),
    elementAttributes: { colors: 'oklch(0.8 0.15 85), oklch(0.7 0.19 40), oklch(0.6 0.2 350)', speed: '1.4' },
  },
  {
    meta: inkFlowMeta,
    Hero: InkFlowHero,
    defineElement: () => defineInkFlowElement(),
    elementAttributes: { colors: 'oklch(0.78 0.17 75), oklch(0.68 0.22 25), oklch(0.6 0.2 300)', swirl: '32', calm: '0.6' },
  },
  {
    meta: gravityFieldMeta,
    Hero: GravityFieldHero,
    defineElement: () => defineGravityFieldElement(),
    elementAttributes: { colors: 'oklch(0.75 0.18 30), oklch(0.82 0.14 70), oklch(0.95 0.05 95)', gravity: '1.4', size: '1.8' },
  },
  {
    meta: reactionDiffusionMeta,
    Hero: ReactionDiffusionHero,
    defineElement: () => defineReactionDiffusionElement(),
    elementAttributes: { colors: 'oklch(0.7 0.18 30), oklch(0.85 0.14 80)', pattern: 'maze' },
  },
  {
    meta: particleTypeMeta,
    Hero: ParticleTypeHero,
    defineElement: () => defineParticleTypeElement(),
    elementAttributes: { colors: 'oklch(0.8 0.15 85), oklch(0.7 0.19 30), oklch(0.95 0.04 95)', gap: '3' },
  },
  {
    meta: liquidGlassMeta,
    Hero: LiquidGlassHero,
    defineElement: () => defineLiquidGlassElement(),
    elementAttributes: { colors: 'oklch(0.78 0.15 60), oklch(0.98 0.02 90)', image: '/sharingan/product.png', refraction: '1.4' },
  },
];

export const findHero = (name: string | undefined) => heroes.find((hero) => hero.meta.name === name);
