import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
      $icons: path.resolve('./src/icons'),
      '$app/paths': path.resolve('./tests/mocks/app/paths.js'),
      '$app/stores': path.resolve('./tests/mocks/app/stores.js'),
      '$app/navigation': path.resolve('./tests/mocks/app/navigation.js'),
      '$app/environment': path.resolve('./tests/mocks/app/environment.js')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.{test,spec}.js']
  }
});
