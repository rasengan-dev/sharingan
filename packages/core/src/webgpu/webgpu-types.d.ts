import "@webgpu/types";

// Loads WebGPU's global types (GPUDevice, navigator.gpu…) wherever this folder is copied,
// with no tsconfig change. A .d.ts, so the import never reaches the bundle.
// Not a /// <reference> directive: the shadcn CLI strips comments at the top of files.
