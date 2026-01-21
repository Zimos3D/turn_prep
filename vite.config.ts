import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import fs from 'fs';

const s_PACKAGE_ID = 'modules/turn-prep';

export default defineConfig({
  root: 'src/',
  base: `/${s_PACKAGE_ID}/`,
  publicDir: path.resolve(__dirname, 'public'),
  esbuild: {
    target: ['es2022'],
    minifyIdentifiers: false,
    minifySyntax: true,
    minifyWhitespace: true,
    keepNames: true,
  },
  server: {
    port: 30001,
    proxy: {
      // Serves static files from main Foundry server.
      [`^(/${s_PACKAGE_ID}/(assets|lang|public))`]:
        'http://localhost:30000',

      // All other paths besides package ID path are served from main Foundry server.
      [`^(?!/${s_PACKAGE_ID}/)`]: 'http://localhost:30000',

      // Enable socket.io from main Foundry server.
      '/socket.io': { target: 'ws://localhost:30000', ws: true },
    },
  },
  resolve: {
    alias: {
      src: path.resolve('./src'),
    },
  },
  plugins: [
    svelte({
      compilerOptions: {
        cssHash: ({ hash, css }) => `svelte-tp-${hash(css)}`
      }
    })
  ],
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    target: ['es2022'],
    lib: {
      entry: './main.ts',
      name: 'TurnPrep',
      fileName: 'turn-prep',
      formats: ['es'],
    },
    sourcemap: true,
    minify: 'esbuild',
  },
});
