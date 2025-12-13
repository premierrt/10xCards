Frontend - Astro z React dla komponentów interaktywnych:
- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:
- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:
- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

Testing - Kompleksowy stos narzędzi do testowania:

Testy jednostkowe i integracyjne:
- Vitest - szybki framework testowy kompatybilny z Vite, z natywnym wsparciem dla TypeScript
- React Testing Library - narzędzia do testowania komponentów React zgodnie z best practices
- MSW (Mock Service Worker) - mockowanie requestów API dla niezawodnych testów
- Faker.js - generowanie realistycznych danych testowych

Testy End-to-End:
- Playwright - framework do automatyzacji testów cross-browser, wspierający Chrome, Firefox, Safari i Edge
- Cypress - alternatywne narzędzie do testów E2E z przyjaznym interfejsem

Testy wydajnościowe i dostępności:
- Lighthouse - automatyczne audyty wydajności, dostępności, SEO i Progressive Web App
- Web Vitals - metryki Core Web Vitals dla monitorowania rzeczywistej wydajności
- axe DevTools - automatyczne testowanie dostępności zgodnie ze standardami WCAG

Monitoring i jakość kodu:
- Sentry - śledzenie błędów w produkcji
- Code coverage raporty z Vitest
- ESLint i Prettier dla spójności kodu

CI/CD i Hosting:
- Github Actions do tworzenia pipeline'ów CI/CD z automatycznym uruchamianiem testów
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker
- Supabase Dashboard do monitorowania bazy danych i użycia API

Ten stos technologiczny zapewnia:
- Wysoką jakość kodu dzięki testom jednostkowym (cel: >80% pokrycia)
- Pewność działania kluczowych funkcjonalności dzięki testom E2E
- Szybkie wykrywanie regresji dzięki automatyzacji w CI/CD
- Monitoring produkcyjny dla szybkiej reakcji na problemy