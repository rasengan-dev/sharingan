import { defineConfig } from 'rasengan';
import { rasengan } from 'rasengan/plugin';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@rasenganjs/mdx/plugin';

/**
 * Rasengan puts all of node_modules in one `vendor` chunk, loaded on every
 * page. Same rule, except for shiki and its dependencies: the Customize panel
 * imports them on demand (src/lib/highlight.ts), so they stay in chunks of
 * their own, fetched only when the panel opens.
 */
const LAZY = /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(?:shiki|@shikijs|oniguruma-to-es|oniguruma-parser|regex|regex-recursion|regex-utilities|hast-util-to-html)\//;
const lazyShiki = {
  name: 'sharingan:lazy-shiki',
  config: () => ({
    build: {
      rolldownOptions: {
        output: {
          manualChunks(id) {
            if (LAZY.test(id)) return undefined;
            if (id.includes('node_modules')) return 'vendor';
            if (id.includes('src/components')) return 'shared-components';
            return undefined;
          },
        },
      },
    },
  }),
};

export default defineConfig(async () => {
  return {
    // The address `pnpm registry` and `pnpm posters` expect by default (Rasengan's own default is 5320).
    server: { development: { port: 3100 } },
    vite: {
      plugins: [
        tailwindcss(),
        rasengan({}),
        lazyShiki,
        /* Both themes are rendered; styles/index.css shows the one matching `.dark`. */
        mdx({ code: { theme: { light: 'light-plus', dark: 'vesper' }, keepBackground: false } }),
      ],
      resolve: {
        // Rasengan puts its own "@" → ./src alias first, which would shadow the paths below.
        // Give it a name nothing imports and declare "@" last ourselves.
        symbole: '@rasengan-src-unused',
        alias: [
          // Heroes and sections import the paths they have once installed by the shadcn CLI; these point them at the sources.
          { find: '@/lib/sharingan/webgpu/react', replacement: '../../packages/core/src/webgpu/react.tsx' },
          { find: '@/lib/sharingan/webgpu', replacement: '../../packages/core/src/webgpu/index.ts' },
          { find: '@/lib/sharingan/react', replacement: '../../packages/core/src/react.tsx' },
          { find: '@/lib/sharingan/scroll', replacement: '../../packages/core/src/scroll/index.ts' },
          { find: '@/lib/sharingan', replacement: '../../packages/core/src/index.ts' },
          { find: '@/heroes', replacement: '../../registry/heroes' },
          { find: '@/sections', replacement: '../../registry/sections' },
          { find: '@', replacement: './src' },
        ],
      },
    },
  };
});
