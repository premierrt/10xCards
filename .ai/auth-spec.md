# Specyfikacja architektury modułu autentykacji - FlashLearn

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1 Struktura stron i komponentów

#### Strony Astro (Server-Side Rendered)
- **`/login`** - Strona logowania
  - Renderowana server-side dla SEO i szybkiego pierwszego ładowania
  - Zawiera formularz logowania jako komponent React
  - Przekierowuje zalogowanych użytkowników na stronę główną
  - Zawiera link do rejestracji i odzyskiwania hasła

- **`/register`** - Strona rejestracji
  - Renderowana server-side
  - Zawiera formularz rejestracji jako komponent React
  - Po pomyślnej rejestracji przekierowuje na stronę logowania
  - Zawiera link powrotny do logowania

<!-- Funkcjonalność odzyskiwania hasła nie jest wymagana w MVP zgodnie z PRD -->

#### Komponenty React (Client-Side Interactive)

**`LoginForm.tsx`**
- Pola: email (type="email"), hasło (type="password")
- Przycisk "Zaloguj się"
- Link "Nie masz konta? Zarejestruj się"
- Walidacja w czasie rzeczywistym
- Obsługa stanów: loading, error, success
- Integracja z Supabase Auth SDK

**`RegisterForm.tsx`**
- Pola: email, hasło, potwierdzenie hasła
- Przycisk "Zarejestruj się"
- Link "Masz już konto? Zaloguj się"
- Walidacja zgodności haseł po stronie klienta
- Wymagania hasła: minimum 8 znaków, przynajmniej jedna cyfra
- Obsługa stanów: loading, error, success
- Komunikat sukcesu z informacją o przejściu do logowania

<!-- Komponenty odzyskiwania hasła nie są wymagane w MVP zgodnie z PRD -->

**`AuthGuard.tsx`**
- Komponent opakowujący chroniące strony wymagające autoryzacji
- Sprawdza sesję użytkownika przy użyciu Supabase
- Przekierowuje niezalogowanych na `/login`
- Wyświetla spinner podczas weryfikacji sesji

### 1.2 Layout i nawigacja

**`BaseLayout.astro`**
- Layout główny aplikacji
- Warunkowe renderowanie elementów nawigacji:
  - Dla niezalogowanych: linki "Zaloguj się", "Zarejestruj się"
  - Dla zalogowanych: avatar użytkownika, menu dropdown z opcją wylogowania
- Integracja z Supabase do sprawdzania sesji server-side

**`AuthLayout.astro`**
- Dedykowany layout dla stron autentykacji
- Minimalistyczny design skupiony na formularzu
- Logo aplikacji i powrót do strony głównej
- Bez pełnej nawigacji

### 1.3 Walidacja i komunikaty błędów

#### Walidacja po stronie klienta
- **Email**: format RFC 5322, sprawdzanie przed wysłaniem
- **Hasło**: minimum 8 znaków, co najmniej 1 cyfra
- **Potwierdzenie hasła**: zgodność z hasłem głównym
- Wyświetlanie błędów inline pod polami formularza
- Czerwone obramowanie pól z błędami

#### Komunikaty błędów z serwera
- **"Nieprawidłowy email lub hasło"** - błąd logowania
- **"Email jest już zarejestrowany"** - błąd rejestracji
- **"Hasło jest zbyt słabe"** - niespełnienie wymagań Supabase
<!-- Komunikaty błędów resetowania hasła nie są wymagane w MVP -->

### 1.4 Scenariusze użytkowania

**Scenariusz rejestracji:**
1. Użytkownik klika "Zarejestruj się" na stronie logowania
2. Wypełnia formularz rejestracji
3. System waliduje dane lokalnie
4. Wysyła żądanie do Supabase Auth
5. Po pomyślnej rejestracji - przekierowanie na `/login`
6. Wyświetla komunikat "Konto utworzone pomyślnie. Możesz się zalogować."

**Scenariusz logowania:**
1. Użytkownik wprowadza dane logowania
2. System weryfikuje dane z Supabase Auth
3. Tworzy sesję użytkownika
4. Przekierowuje na stronę główną aplikacji
5. Aktualizuje UI (nawigacja, dostępne funkcje)

<!-- Scenariusz odzyskiwania hasła nie jest wymagany w MVP zgodnie z PRD -->

## 2. LOGIKA BACKENDOWA

### 2.1 Endpointy API

Supabase zapewnia gotowe endpointy Auth API, ale aplikacja będzie używać SDK, które abstrahuje te wywołania:

**Funkcje Supabase Auth wykorzystywane w aplikacji:**
- `supabase.auth.signUp()` - rejestracja użytkownika
- `supabase.auth.signInWithPassword()` - logowanie
- `supabase.auth.signOut()` - wylogowanie
<!-- Funkcje resetowania hasła nie są wymagane w MVP zgodnie z PRD -->
- `supabase.auth.getSession()` - pobranie aktualnej sesji
- `supabase.auth.onAuthStateChange()` - nasłuchiwanie zmian stanu autoryzacji

### 2.2 Modele danych

**Tabela `profiles` (rozszerzenie auth.users Supabase):**
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  flashcard_sets_count INTEGER DEFAULT 0,
  total_flashcards_count INTEGER DEFAULT 0
);
```

**RLS (Row Level Security) Policies:**
- Użytkownik może czytać i modyfikować tylko swój profil
- Automatyczne tworzenie profilu przy rejestracji (trigger)
- Ograniczenia: max 200 zestawów, max 10000 fiszek

### 2.3 Walidacja danych wejściowych

**Walidacja server-side (przez Supabase):**
- Email: unikalność, poprawny format
- Hasło: minimum 6 znaków (domyślne Supabase, rozszerzone do 8 w konfiguracji)
- Rate limiting: max 3 próby logowania na minutę
- Ochrona przed SQL injection (automatyczna w Supabase)

**Walidacja w middleware Astro:**
```typescript
interface ValidationRules {
  email: {
    pattern: RegExp;
    maxLength: number;
  };
  password: {
    minLength: number;
    pattern: RegExp; // wymaga cyfry
    maxLength: number;
  };
}
```

### 2.4 Obsługa wyjątków

**Kategorie błędów:**
1. **Błędy autentykacji** (401):
   - Nieprawidłowe dane logowania
   - Wygasła sesja
   - Brak uprawnień

2. **Błędy walidacji** (400):
   - Niepoprawny format danych
   - Niespełnienie wymagań hasła
   - Email już istnieje

3. **Błędy serwera** (500):
   - Problemy z połączeniem do Supabase
   - Timeout operacji
   - Błędy bazy danych

**Strategia obsługi:**
- Logowanie błędów do konsoli (development)
- Wysyłanie do systemu monitorowania (production)
- Przyjazne komunikaty dla użytkownika
- Fallback do strony błędu

### 2.5 Renderowanie server-side

**Middleware autoryzacji (`src/middleware/auth.ts`):**
```typescript
interface AuthMiddleware {
  protectedRoutes: string[];
  publicRoutes: string[];
  checkSession: (request: Request) => Promise<Session | null>;
  redirectIfAuthenticated: string[];
  redirectIfNotAuthenticated: string[];
}
```

**Integracja z Astro:**
- Sprawdzanie sesji w `Astro.locals`
- Przekazywanie stanu autoryzacji do komponentów
- Server-side redirects dla chronionych stron
- Hydracja komponentów React z danymi sesji

## 3. SYSTEM AUTENTYKACJI

### 3.1 Konfiguracja Supabase Auth

**Inicjalizacja klienta (`src/lib/supabase.ts`):**
```typescript
interface SupabaseConfig {
  url: string;
  anonKey: string;
  auth: {
    persistSession: boolean;
    detectSessionInUrl: boolean;
    autoRefreshToken: boolean;
    storage: AsyncStorage;
  };
}
```

**Ustawienia projektu Supabase:**
- Włączona autentykacja email/hasło
- Wyłączone potwierdzenie email (dla MVP)
- Customowy template emaila resetującego
- Redirect URL: `{APP_URL}/reset-password`
- Session timeout: 7 dni
- JWT expiry: 1 godzina (z auto-refresh)

### 3.2 Zarządzanie sesjami

**Storage sesji:**
- Cookies httpOnly dla tokenów refresh
- LocalStorage dla access token (client-side)
- Server-side session validation przy każdym żądaniu

**Cykl życia sesji:**
1. Utworzenie przy logowaniu
2. Automatyczne odświeżanie co 55 minut
3. Weryfikacja przy chronionych trasach
4. Wygaśnięcie po 7 dniach nieaktywności
5. Manualne zakończenie przy wylogowaniu

### 3.3 Bezpieczeństwo

**Zabezpieczenia:**
- HTTPS wymagane w produkcji
- CSRF protection przez Supabase
- Rate limiting na endpointy auth
- Hashowanie haseł (bcrypt przez Supabase)
- Secure cookies z flagami SameSite i HttpOnly
- Content Security Policy headers
- XSS protection przez sanityzację inputów

### 3.4 Integracja z aplikacją

**Hook `useAuth` dla komponentów React:**
```typescript
interface AuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Funkcje resetowania hasła nie są wymagane w MVP
}
```

**Server-side helpers dla Astro:**
```typescript
interface AstroAuthHelpers {
  getUser: (request: Request) => Promise<User | null>;
  requireAuth: (request: Request) => Promise<User>;
  createServerClient: (request: Request) => SupabaseClient;
}
```

## 4. PRZEPŁYW DANYCH

### 4.1 Rejestracja
1. `RegisterForm` → walidacja lokalna
2. `supabase.auth.signUp()` → Supabase Auth
3. Trigger bazy danych → utworzenie profilu
4. Response → przekierowanie na `/login`
5. Komunikat sukcesu

### 4.2 Logowanie
1. `LoginForm` → walidacja lokalna
2. `supabase.auth.signInWithPassword()` → Supabase Auth
3. Otrzymanie tokenów (access + refresh)
4. Zapisanie w storage
5. Przekierowanie na stronę główną
6. Pobranie danych użytkownika

### 4.3 Autoryzacja żądań
1. Middleware sprawdza ciasteczka/headers
2. Weryfikacja tokenu z Supabase
3. Dodanie użytkownika do kontekstu
4. Przekazanie do route handlera
5. RLS w bazie danych jako druga warstwa

## 5. MIGRACJA I WDROŻENIE

### 5.1 Kroki implementacji
1. Konfiguracja projektu Supabase
2. Utworzenie tabel i policies
3. Implementacja komponentów formularzy
4. Utworzenie stron autentykacji
5. Dodanie middleware autoryzacji
6. Integracja z istniejącymi funkcjami
7. Testy E2E przepływów autoryzacji

### 5.2 Zgodność z istniejącą aplikacją
- Wszystkie istniejące trasy stają się chronione (poza auth)
- Dodanie sprawdzania sesji do operacji CRUD
- Powiązanie fiszek i zestawów z user_id
- Aktualizacja zapytań do bazy o filtry użytkownika

## 6. ZGODNOŚĆ Z USER STORIES

### Realizacja US-001 (Rejestracja konta)
- Formularz rejestracji dostępny ze strony logowania ✓
- Wymagane pola: email, hasło, potwierdzenie hasła ✓
- Po rejestracji przekierowanie na stronę logowania ✓
- Komunikaty błędów przy niepoprawnych danych ✓

### Realizacja US-002 (Logowanie do systemu)
- Formularz logowania z polami email i hasło ✓
- Po zalogowaniu przekierowanie na stronę główną ✓
- Komunikaty błędów przy niepoprawnych danych ✓

### Wsparcie dla US-003 do US-007
- AuthGuard zapewnia ochronę tras dla funkcji generowania fiszek
- Sesja użytkownika dostępna w kontekście dla operacji CRUD
- RLS policies w Supabase zapewniają izolację danych użytkowników
- Limity (200 zestawów, 10000 fiszek) egzekwowane przez policies

## 7. PODSUMOWANIE

Architektura modułu autentykacji jest zaprojektowana zgodnie z wymaganiami PRD dla MVP FlashLearn. Wykorzystuje Supabase Auth dla prostej autentykacji email/hasło, bez zaawansowanych funkcji jak resetowanie hasła. System zapewnia bezpieczną autoryzację i izolację danych między użytkownikami, umożliwiając realizację wszystkich User Stories zdefiniowanych w PRD.