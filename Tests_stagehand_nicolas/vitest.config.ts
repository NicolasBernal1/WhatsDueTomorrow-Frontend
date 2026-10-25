export default {
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    testTimeout: 900_000,
    hookTimeout: 900_000,
    fileParallelism: false,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    retry: 0,
  },
};