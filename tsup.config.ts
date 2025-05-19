import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  bundle: true,
  minify: true,
  target: 'node18',
  platform: 'node',
  outDir: 'dist',
  external: ['react'],
  noExternal: [],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
  },
});
