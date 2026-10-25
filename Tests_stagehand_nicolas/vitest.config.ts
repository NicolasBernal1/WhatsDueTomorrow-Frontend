import { defineConfig } from 'vitest/config.js';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    
    testTimeout: 900_000,
    hookTimeout: 900_000,
    retry: 0,

    fileParallelism: false,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },

  },
});
