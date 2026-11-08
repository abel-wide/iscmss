import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    passWithNoTests: true, 
    root: './',
    include: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
    environment: 'node',
    testTimeout: 30000,
     hookTimeout: 30000, 
  },
});