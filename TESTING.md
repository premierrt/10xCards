# 🧪 Testing Guide

Ten przewodnik opisuje jak używać zaimplementowanych narzędzi testowych w projekcie opartym na Astro + React.

## 🏗️ Architektura testów

### Testy jednostkowe i integracyjne (Vitest)
- **Framework**: Vitest z natywnym wsparciem dla TypeScript
- **Biblioteki**: React Testing Library, MSW, Faker.js
- **Środowisko**: jsdom dla testów komponentów React
- **Lokalizacja**: `src/**/*.{test,spec}.{js,ts,jsx,tsx}`

### Testy End-to-End (Playwright)
- **Framework**: Playwright
- **Browser**: Chromium (Desktop Chrome)
- **Wzorzec**: Page Object Model
- **Lokalizacja**: `e2e/**/*.spec.ts`

## 🚀 Uruchamianie testów

### Testy jednostkowe

```bash
# Uruchom wszystkie testy jednostkowe
npm run test

# Tryb watch dla development
npm run test:watch

# Interfejs webowy do przeglądania testów
npm run test:ui

# Testy z raportem pokrycia kodu
npm run test:coverage
```

### Testy E2E

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Testy E2E z interfejem użytkownika
npm run test:e2e:ui

# Testy E2E z widoczną przeglądarką
npm run test:e2e:headed

# Generator testów (nagrywanie akcji)
npm run test:e2e:codegen

# Wszystkie typy testów
npm run test:all
```

## 📁 Struktura plików testowych

```
src/
├── components/
│   └── ui/
│       ├── button.tsx
│       └── button.test.tsx         # Test komponentu
├── test/
│   ├── setup.ts                    # Konfiguracja testów
│   ├── utils/
│   │   ├── render.tsx             # Custom render function
│   │   └── matchers.ts            # Custom matchers
│   ├── factories/
│   │   ├── index.ts               # Export all factories
│   │   ├── user.factory.ts        # User data factory
│   │   └── card.factory.ts        # Card data factory
│   ├── fixtures/
│   │   └── component-props.ts     # Common component props
│   └── mocks/
│       ├── handlers.ts            # MSW handlers
│       ├── browser.ts             # MSW browser setup
│       └── server.ts              # MSW server setup

e2e/
├── pages/
│   ├── base.page.ts               # Base Page Object Model
│   └── home.page.ts               # Home Page Object Model
├── utils/
│   └── auth.ts                    # Authentication utilities
├── fixtures/                      # Test fixtures
├── screenshots/                   # Visual regression baselines
└── tests/
    ├── home.spec.ts              # Home page tests
    └── api.spec.ts               # API tests
```

## ✅ Dobre praktyki

### Testy jednostkowe

1. **Wykorzystuj Vi object dla mocków**:
```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();
const spy = vi.spyOn(object, 'method');
```

2. **Używaj inline snapshots**:
```typescript
expect(component).toMatchInlineSnapshot(\`...\`);
```

3. **Leverage custom render function**:
```typescript
import { render, screen } from '../test/utils/render';
```

4. **Mockowanie API z MSW**:
```typescript
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

// Override specific endpoint for test
server.use(
  http.get('/api/data', () => {
    return HttpResponse.json({ custom: 'data' });
  })
);
```

### Testy E2E

1. **Używaj Page Object Model**:
```typescript
import { HomePage } from '../pages/home.page';

const homePage = new HomePage(page);
await homePage.goto();
```

2. **Używaj AuthUtils do zarządzania uwierzytelnianiem**:
```typescript
import { AuthUtils } from '../utils/auth';

const auth = new AuthUtils(page);
await auth.login('user@test.com', 'password');
```

3. **Dziedzicz z BasePage dla wspólnych funkcjonalności**:
```typescript
export class CustomPage extends BasePage {
  async customAction() {
    await this.waitForPageLoad();
    // custom logic
  }
}
```

## 🔧 Konfiguracja

### Vitest Config (`vitest.config.ts`)
- Środowisko jsdom
- Setup files
- Pokrycie kodu z progami (80%)
- UI mode

### Playwright Config (`playwright.config.ts`)
- Tylko Chromium browser
- Dev server auto-start
- Screenshots i video on failure
- Trace on retry

## 📊 Pokrycie kodu

Cele pokrycia kodu ustawione na 80% dla:
- Branches
- Functions
- Lines
- Statements

```bash
npm run test:coverage
```

Raporty dostępne w:
- Terminal (text)
- `coverage/index.html` (HTML)
- `coverage/coverage-final.json` (JSON)

## 🐛 Debugging

### Debug testów jednostkowych
```bash
# Z breakpointami
npm run test:watch

# UI mode
npm run test:ui
```

### Debug testów E2E
```bash
# Z widoczną przeglądarką
npm run test:e2e:headed

# Playwright inspector
npm run test:e2e:ui

# Debug mode
npx playwright test --debug
```

## 🎯 Visual Regression Testing

Testy wizualne automatycznie porównują screenshoty:

```typescript
await expect(page).toHaveScreenshot('homepage.png');
```

Pierwsze uruchomienie utworzy baseline screenshoty w `test-results/`.

## 📝 Mockowanie danych

### Faker.js dla realistycznych danych
```typescript
import { createMockUser, createMockCard } from '../test/factories';

const user = createMockUser({ name: 'Custom Name' });
const cards = createMockCards(5, { user_id: user.id });
```

### MSW dla API calls
```typescript
// Dodawanie custom handlers w teście
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

server.use(
  http.get('/api/users', () => {
    return HttpResponse.json([createMockUser()])
  })
);
```

## 🤝 CI/CD Integration

Testy są gotowe do integracji z GitHub Actions:
- Automatyczne uruchamianie na push/PR
- Artefakty testowe (screenshoty, videos)
- Raporty pokrycia kodu

## 🆘 Troubleshooting

### Problemy z testami jednostkowymi
- Sprawdź czy wszystkie moduły są poprawnie mockowane
- Użyj `vi.resetAllMocks()` w beforeEach
- Sprawdź konfigurację jsdom

### Problemy z testami E2E
- Upewnij się że dev server działa
- Sprawdź timeouty w playwright.config.ts
- Użyj `--headed` flag dla debugowania

### Problemy z MSW
- Sprawdź czy server jest poprawnie uruchomiony w setup.ts
- Zresetuj handlers po każdym teście
- Sprawdź console errors w przeglądarce