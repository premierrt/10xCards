---
globs: src/pages/api/**/*.ts
regex: flashcard
alwaysApply: false
---

When implementing CRUD API endpoints for flashcards, always follow these patterns: 1) Use Zod schemas from lib/schemas for validation, 2) Include proper authentication with fallback to DEFAULT_USER_ID in development, 3) Return structured responses matching the types defined in types.ts, 4) Handle errors with appropriate HTTP status codes and detailed error messages, 5) Use console.warn for development fallbacks and console.error for actual errors