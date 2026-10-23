import { defineConfig } from 'rasengan';
import { rasengan } from 'rasengan/plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(async () => {
  return {
    vite: {
      plugins: [tailwindcss(), rasengan({})],
      resolve: {
        // Rasengan puts its own "@" → ./src alias first, which would shadow the paths below.
        // Give it a name nothing imports and declare "@" last ourselves.
        symbole: '@rasengan-src-unused',
        alias: [
          // Heroes import the paths they have once installed by the shadcn CLI; these point them at the sources.
          { find: '@/lib/sharingan/webgpu/react', replacement: '../../packages/core/src/webgpu/react.tsx' },
          { find: '@/lib/sharingan/webgpu', replacement: '../../packages/core/src/webgpu/index.ts' },
          { find: '@/lib/sharingan/react', replacement: '../../packages/core/src/react.tsx' },
          { find: '@/lib/sharingan', replacement: '../../packages/core/src/index.ts' },
          { find: '@/heroes', replacement: '../../registry/heroes' },
          { find: '@', replacement: './src' },
        ],
      },
    },
  };
});
