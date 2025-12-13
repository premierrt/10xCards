import { defineConfig } from 'vitest/config'
import { getViteConfig } from 'astro/config'

export default defineConfig(
  getViteConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
      exclude: [
        'e2e/**/*',
        'node_modules/**/*',
        '**/node_modules/**',
        'home/**/*'
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          'e2e/',
          '**/*.d.ts',
          '**/*.config.*',
          'dist/',
          '.astro/',
        ],
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
      },
      testTimeout: 10000,
    },
  })
)