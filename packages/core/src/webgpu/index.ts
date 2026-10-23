/**
 * The WebGPU engine of @sharingan/core: GPU device, canvas sizing, the scene
 * lifecycle, the fallback and shared WGSL. Installed as `@/lib/sharingan/webgpu`.
 */
export { getRoot, hasWebGpu, onDeviceLost, GpuUnavailableError, type FallbackReason } from "./device";
export { mountScene, type Scene, type SceneContext, type MountOptions, type MountedScene } from "./mount";
export { createHeroEngine, fallbackGradient, type HeroBaseConfig, type HeroResolved, type HeroEngine, type HeroEngineOptions, type HeroDefinition } from "./hero";
export { defineHeroElement, type HeroElementSpec, type AttributeKind } from "./element";
export * as wgsl from "./wgsl";
