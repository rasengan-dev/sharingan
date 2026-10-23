/**
 * @sharingan/core — the runtime every Sharingan hero shares (RFC-0001):
 * GPU device, frame loop, canvas sizing, motion modes, pointer, theme
 * colours and fallback. Installed as `@/lib/sharingan`.
 */
export { getRoot, hasWebGpu, onDeviceLost, GpuUnavailableError, type FallbackReason } from "./device";
export { addFrame, type FrameCallback } from "./loop";
export { readMotionMode, onMotionPreferenceChange, type MotionMode } from "./motion";
export { trackPointer, type PointerState } from "./pointer";
export { resolveColor, splitColorList, onThemeChange, type LinearColor } from "./theme";
export { mountScene, type Scene, type SceneContext, type MountOptions, type MountedScene } from "./mount";
export { createHeroEngine, fallbackGradient, type HeroBaseConfig, type HeroResolved, type HeroEngine, type HeroEngineOptions, type HeroDefinition } from "./hero";
export { defineHeroElement, type HeroElementSpec, type AttributeKind } from "./element";
export * as wgsl from "./wgsl";
