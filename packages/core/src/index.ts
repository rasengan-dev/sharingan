/**
 * @sharingan/core — what every Sharingan hero shares, whatever its engine
 * (RFC-0001, "Two engines"): frame loop, motion modes, pointer and theme
 * colours. Installed as `@/lib/sharingan`. GPU heroes also use
 * `@/lib/sharingan/webgpu`; DOM heroes never copy it.
 */
export { addFrame, type FrameCallback } from "./loop";
export { readMotionMode, onMotionPreferenceChange, type MotionMode } from "./motion";
export { trackPointer, type PointerState } from "./pointer";
export { resolveColor, splitColorList, onThemeChange, type LinearColor } from "./theme";
export { readAttributes, type AttributeKind } from "./attributes";
export { adoptStyles, isEditable, trackVisibility, defineDomElement, type DomHero, type DomHeroOptions, type DomElementSpec } from "./dom";
