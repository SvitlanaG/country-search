import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  test: {
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
  },
});
