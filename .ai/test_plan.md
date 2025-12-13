# Plan Testów - FlashLearn MVP

## 1. Wprowadzenie i cele testowania

### 1.1 Wprowadzenie
Plan testów dla aplikacji FlashLearn MVP został opracowany w celu zapewnienia wysokiej jakości produktu, który automatyzuje proces tworzenia fiszek edukacyjnych przy użyciu sztucznej inteligencji. Dokument ten definiuje kompleksową strategię testowania dostosowaną do specyfiki projektu wykorzystującego nowoczesny stos technologiczny.

### 1.2 Cele testowania
- **Zapewnienie funkcjonalności**: Weryfikacja, że wszystkie kluczowe funkcje działają zgodnie z wymaganiami
- **Bezpieczeństwo**: Sprawdzenie zabezpieczeń autentykacji, autoryzacji i ochrony danych użytkowników
- **Niezawodność**: Testowanie stabilności integracji z zewnętrznymi usługami (OpenRouter.ai, Supabase)
- **Wydajność**: Weryfikacja czasu generowania fiszek i responsywności aplikacji
- **Użyteczność**: Zapewnienie intuicyjnego interfejsu użytkownika
- **Dostępność**: Sprawdzenie zgodności z podstawowymi standardami dostępności

## 2. Zakres testów

### 2.1 W zakresie testów
- Moduł autentykacji (rejestracja, logowanie, wylogowanie)
- Generator fiszek wykorzystujący AI
- Zarządzanie zestawami fiszek (CRUD)
- System powtórek (review sessions)
- Walidacja danych wejściowych
- Integracja z bazą danych Supabase
- Integracja z OpenRouter.ai
- Responsywność interfejsu dla desktop
- Obsługa błędów i stanów wyjątkowych

### 2.2 Poza zakresem testów
- Aplikacje mobilne (tylko wersja webowa)
- Zaawansowane algorytmy spaced repetition
- Funkcje współdzielenia zestawów
- Integracje z zewnętrznymi formatami plików (PDF, DOCX)
- Testy obciążeniowe dla dużej liczby użytkowników

## 3. Typy testów do przeprowadzenia

### 3.1 Testy jednostkowe (Unit Tests)

#### Frontend Components
```typescript
// Przykładowe obszary testowania:
- FlashcardGenerationService
- Walidacja schematów Zod
- Utility functions (lib/utils.ts)
- Custom React hooks (useAuth, useFlashcardGenerator)
```

#### Backend Services
```typescript
// Przykładowe obszary testowania:
- API route handlers
- Supabase service methods
- OpenRouter client
- Error handling classes
```

### 3.2 Testy integracyjne (Integration Tests)

#### API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/flashcards/generate
- GET/POST/DELETE /api/flashcard-sets
- GET/PUT/DELETE /api/flashcard-sets/[set_id]
- POST /api/bulkflashcards

#### Database Integration
- Supabase authentication flow
- CRUD operations na tabelach flashcards i flashcard_sets
- Relacje między tabelami
- Row Level Security (RLS) policies

### 3.3 Testy End-to-End (E2E Tests)

#### Kluczowe ścieżki użytkownika
1. **Rejestracja i pierwszy login**
2. **Generowanie fiszek z tekstu**
3. **Akceptacja/odrzucanie wygenerowanych fiszek**
4. **Zapisywanie zestawu fiszek**
5. **Przeprowadzenie sesji powtórki**
6. **Usuwanie zestawu fiszek**

### 3.4 Testy wydajnościowe (Performance Tests)

- Czas generowania fiszek (cel: < 10 sekund)
- Czas ładowania dashboard z wieloma zestawami
- Responsywność UI podczas operacji asynchronicznych
- Optymalizacja zapytań do bazy danych

### 3.5 Testy bezpieczeństwa (Security Tests)

- Walidacja tokenów JWT
- Weryfikacja uprawnień do zasobów
- Testowanie SQL injection
- XSS prevention
- CORS configuration
- Secure API key storage

### 3.6 Testy dostępności (Accessibility Tests)

- Nawigacja klawiaturą
- Kontrast kolorów
- ARIA labels
- Screen reader compatibility
- Focus management

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1 Autentykacja

#### TC-AUTH-001: Rejestracja nowego użytkownika
**Warunki wstępne**: Użytkownik nie posiada konta
**Kroki**:
1. Przejdź do /register
2. Wypełnij formularz (email, hasło, potwierdzenie hasła)
3. Kliknij "Zarejestruj się"
**Oczekiwany rezultat**: Konto utworzone, przekierowanie do /login

#### TC-AUTH-002: Logowanie z poprawnymi danymi
**Warunki wstępne**: Użytkownik posiada konto
**Kroki**:
1. Przejdź do /login
2. Wprowadź email i hasło
3. Kliknij "Zaloguj się"
**Oczekiwany rezultat**: Zalogowanie, przekierowanie do /dashboard

### 4.2 Generowanie fiszek

#### TC-GEN-001: Generowanie fiszek z prawidłowego tekstu
**Warunki wstępne**: Użytkownik zalogowany
**Kroki**:
1. Przejdź do /generate
2. Wprowadź tekst (1000-10000 słów)
3. Wybierz liczbę fiszek (5-20)
4. Kliknij "Generuj fiszki"
**Oczekiwany rezultat**: Wyświetlenie listy wygenerowanych fiszek

#### TC-GEN-002: Walidacja minimalnej długości tekstu
**Warunki wstępne**: Użytkownik zalogowany
**Kroki**:
1. Przejdź do /generate
2. Wprowadź tekst < 1000 słów
3. Kliknij "Generuj fiszki"
**Oczekiwany rezultat**: Komunikat o błędzie walidacji

### 4.3 Zarządzanie zestawami

#### TC-SET-001: Zapisywanie zestawu fiszek
**Warunki wstępne**: Wygenerowane fiszki oczekują na akceptację
**Kroki**:
1. Zaakceptuj wybrane fiszki
2. Wprowadź nazwę zestawu
3. Kliknij "Zapisz zestaw"
**Oczekiwany rezultat**: Zestaw zapisany, widoczny w dashboard

#### TC-SET-002: Usuwanie zestawu fiszek
**Warunki wstępne**: Istnieje co najmniej jeden zestaw
**Kroki**:
1. Przejdź do /dashboard
2. Kliknij "Usuń" przy wybranym zestawie
3. Potwierdź w oknie modalnym
**Oczekiwany rezultat**: Zestaw usunięty z listy

### 4.4 System powtórek

#### TC-REV-001: Przeprowadzenie pełnej sesji powtórki
**Warunki wstępne**: Zestaw z co najmniej 5 fiszkami
**Kroki**:
1. Kliknij "Powtórz" przy zestawie
2. Dla każdej fiszki: przeczytaj pytanie, odkryj odpowiedź, zaznacz "Wiem"/"Nie wiem"
3. Dokończ sesję
**Oczekiwany rezultat**: Wyświetlenie podsumowania z wynikami

## 5. Środowisko testowe

### 5.1 Środowisko lokalne (Development)
- **System operacyjny**: Windows 10/11, macOS, Linux
- **Node.js**: v22.14.0 (zgodnie z .nvmrc)
- **Przeglądarki**: Chrome 120+, Firefox 120+, Safari 16+
- **Rozdzielczość**: 1920x1080, 1366x768, 1280x720
- **Baza danych**: Supabase lokalny lub sandbox

### 5.2 Środowisko stagingowe (Staging)
- **Hosting**: DigitalOcean App Platform
- **Baza danych**: Supabase (dedykowana instancja testowa)
- **OpenRouter**: Klucz API z limitem testowym
- **URL**: https://staging.flashlearn.app

### 5.3 Środowisko produkcyjne (Production)
- **Hosting**: DigitalOcean (Docker)
- **Baza danych**: Supabase (instancja produkcyjna)
- **OpenRouter**: Klucz API produkcyjny z limitami
- **URL**: https://flashlearn.app

## 6. Narzędzia do testowania

### 6.1 Testy jednostkowe i integracyjne
- **Vitest**: Framework testowy kompatybilny z Vite
- **React Testing Library**: Testowanie komponentów React
- **MSW (Mock Service Worker)**: Mockowanie API requests
- **Faker.js**: Generowanie danych testowych

### 6.2 Testy E2E
- **Playwright**: Cross-browser automation
- **Cypress**: Alternatywa dla testów E2E

### 6.3 Testy wydajności
- **Lighthouse**: Audyt wydajności i dostępności
- **Web Vitals**: Metryki Core Web Vitals

### 6.4 Testy dostępności
- **axe DevTools**: Automated accessibility testing
- **WAVE**: Web Accessibility Evaluation Tool

### 6.5 Monitoring i logowanie
- **Sentry**: Error tracking
- **Supabase Dashboard**: Monitoring bazy danych

## 7. Harmonogram testów

### Faza 1: Przygotowanie (Tydzień 1)
- Konfiguracja środowisk testowych
- Instalacja i konfiguracja narzędzi
- Przygotowanie danych testowych
- Utworzenie test fixtures

### Faza 2: Testy jednostkowe (Tydzień 2-3)
- Implementacja testów dla serwisów
- Testy komponentów React
- Testy walidacji danych
- Code coverage > 80%

### Faza 3: Testy integracyjne (Tydzień 4-5)
- Testy API endpoints
- Testy integracji z Supabase
- Testy integracji z OpenRouter
- Testy middleware autentykacji

### Faza 4: Testy E2E (Tydzień 6-7)
- Implementacja scenariuszy E2E
- Testy cross-browser
- Testy responsywności
- Smoke tests dla krytycznych ścieżek

### Faza 5: Testy niefunkcjonalne (Tydzień 8)
- Testy wydajności
- Testy bezpieczeństwa
- Testy dostępności
- Testy obciążeniowe (podstawowe)

### Faza 6: Testy regresyjne (Ongoing)
- Po każdym sprint/release
- Automated test suite
- Manual exploratory testing

## 8. Kryteria akceptacji testów

### 8.1 Kryteria wejścia (Entry Criteria)
- Kod źródłowy dostępny w repozytorium
- Środowisko testowe skonfigurowane
- Test data przygotowane
- Dokumentacja techniczna dostępna

### 8.2 Kryteria wyjścia (Exit Criteria)
- Wszystkie testy krytyczne wykonane (100%)
- Code coverage > 80%
- Zero krytycznych błędów
- Maksymalnie 5 błędów średniej wagi
- Wszystkie user stories spełniają Definition of Done
- Raport z testów zaakceptowany

### 8.3 Kryteria zawieszenia/wznowienia
**Zawieszenie testów gdy**:
- Środowisko testowe niedostępne > 4 godziny
- Blokujące błędy uniemożliwiające dalsze testy
- Brak dostępu do zewnętrznych API

**Wznowienie testów gdy**:
- Błędy blokujące naprawione
- Środowisko przywrócone
- Nowa wersja dostępna do testów

## 9. Role i odpowiedzialności w procesie testowania

### 9.1 QA Lead
- Zarządzanie planem testów
- Koordynacja zespołu testerów
- Raportowanie postępów
- Eskalacja krytycznych problemów

### 9.2 Test Engineer
- Projektowanie przypadków testowych
- Wykonywanie testów manualnych
- Implementacja testów automatycznych
- Dokumentowanie wyników

### 9.3 Developer
- Implementacja unit testów
- Naprawa zgłoszonych błędów
- Code review testów
- Wsparcie w debugowaniu

### 9.4 Product Owner
- Akceptacja kryteriów testowych
- Priorytetyzacja błędów
- Decyzje o release
- Walidacja user stories

### 9.5 DevOps Engineer
- Konfiguracja CI/CD dla testów
- Zarządzanie środowiskami testowymi
- Monitoring i logi
- Deployment procesów

## 10. Procedury raportowania błędów

### 10.1 Klasyfikacja błędów

#### Krytyczne (Critical)
- Aplikacja się nie uruchamia
- Brak możliwości logowania
- Utrata danych użytkownika
- Błędy bezpieczeństwa

#### Wysoki (High)
- Funkcja core nie działa (np. generowanie fiszek)
- Błędy uniemożliwiające korzystanie z funkcji
- Poważne problemy z wydajnością

#### Średni (Medium)
- Funkcja działa nieprawidłowo w edge cases
- Problemy z UI/UX
- Nieoptymalna wydajność

#### Niski (Low)
- Drobne błędy wizualne
- Literówki
- Ulepszenia UX

### 10.2 Szablon zgłoszenia błędu

```markdown
**Tytuł**: [MODUŁ] Krótki opis błędu

**Priorytet**: Krytyczny/Wysoki/Średni/Niski
**Środowisko**: Dev/Staging/Production
**Przeglądarka**: Chrome 120/Firefox 120/Safari 16

**Kroki reprodukcji**:
1. [Krok 1]
2. [Krok 2]
3. [Krok 3]

**Oczekiwany rezultat**: 
[Opis oczekiwanego zachowania]

**Aktualny rezultat**:
[Opis aktualnego zachowania]

**Załączniki**:
- Screenshot/video
- Logi konsoli
- Network logs

**Dodatkowe informacje**:
[Wszelkie przydatne konteksty]
```

### 10.3 Workflow zgłoszeń
1. **Utworzenie**: Tester tworzy issue w GitHub
2. **Triage**: QA Lead przypisuje priorytet i osobę
3. **Analiza**: Developer analizuje problem
4. **Naprawa**: Implementacja rozwiązania
5. **Review**: Code review i testy
6. **Weryfikacja**: QA weryfikuje naprawę
7. **Zamknięcie**: Issue zamknięte po weryfikacji

### 10.4 Narzędzia raportowania
- **GitHub Issues**: Główne narzędzie do śledzenia błędów
- **Labels**: bug, enhancement, documentation, etc.
- **Milestones**: Przypisanie do konkretnych release
- **Projects**: Kanban board dla zarządzania workflow

## 11. Metryki i KPI

### 11.1 Metryki jakości
- **Defect Density**: Liczba błędów na 1000 linii kodu
- **Test Coverage**: Procent kodu pokrytego testami
- **Defect Removal Efficiency**: % błędów znalezionych przed release
- **Mean Time to Detect**: Średni czas wykrycia błędu
- **Mean Time to Repair**: Średni czas naprawy błędu

### 11.2 Metryki procesu testowego
- **Test Execution Rate**: Liczba testów/dzień
- **Test Pass Rate**: % testów zakończonych sukcesem
- **Automation Rate**: % testów zautomatyzowanych
- **Test Cycle Time**: Czas wykonania pełnego cyklu testów

### 11.3 Cele KPI
- Code coverage > 80%
- Test automation > 60%
- Critical bugs = 0 przed release
- Test pass rate > 95%
- MTTR < 24h dla błędów krytycznych

## 12. Zarządzanie ryzykiem

### 12.1 Zidentyfikowane ryzyka

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| Niedostępność OpenRouter API | Średnie | Wysoki | Mock service jako fallback |
| Limity Supabase free tier | Wysokie | Średni | Monitoring użycia, plan B |
| Opóźnienia w development | Średnie | Średni | Buffer time w harmonogramie |
| Brak zasobów QA | Niskie | Wysoki | Cross-training developerów |

### 12.2 Plan awaryjny
- Backup środowisk testowych
- Alternatywne API dla AI (fallback)
- Procedury rollback
- Komunikacja z interesariuszami

## 13. Podsumowanie

Plan testów dla FlashLearn MVP zapewnia kompleksowe podejście do weryfikacji jakości aplikacji. Kluczowe elementy sukcesu to:

1. **Automatyzacja**: Maksymalna automatyzacja powtarzalnych testów
2. **Continuous Testing**: Integracja testów w CI/CD pipeline
3. **Shift Left**: Wczesne wykrywanie błędów w cyklu rozwoju
4. **Współpraca**: Ścisła współpraca między QA, Dev i Product
5. **Monitoring**: Ciągłe monitorowanie jakości i metryk

Regularne przeglądy i aktualizacje tego planu zapewnią jego aktualność i efektywność w miarę rozwoju projektu.