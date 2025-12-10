# API Endpoint Implementation Plan: Flashcards CRUD

## 1. Przegląd punktu końcowego

Plan wdrożenia obejmuje zestaw operacji CRUD dla fiszek (flashcards). Poniższe punkty końcowe są rozważane:

- GET /api/flashcards – pobiera listę fiszek z paginacją i sortowaniem
- PATCH /api/flashcards/{flashcard_id} – aktualizuje wybraną fiszkę częściowo
- PATCH /api/flashcards/bulk – aktualizuje wiele fiszek jednocześnie (np. zmiana statusu)
- DELETE /api/flashcards/{flashcard_id} – usuwa pojedynczą fiszkę
- DELETE /api/flashcards – usuwa wiele fiszek jednocześnie

Celem tych operacji jest umożliwienie efektywnego zarządzania fiszkami przy jednoczesnym zachowaniu bezpieczeństwa i wydajności rozwiązania.

## 2. Szczegóły żądania

**GET /api/flashcards**

- Metoda HTTP: GET
- URL: `/api/flashcards`
- Query Parameters:
  - Wymagane: Brak
  - Opcjonalne:
    - `page` (default: 1)
    - `limit` (default: 10, max: 100)
    - `sort_by` (default: "created_at", opcje: "created_at", "question", "answer")
    - `sort_order` (default: "desc", opcje: "asc", "desc")

**PATCH /api/flashcards/{flashcard_id}**

- Metoda HTTP: PATCH
- URL: `/api/flashcards/{flashcard_id}`
- Request Body: Obiekt umożliwiający częściową aktualizację, np.
  - `{ "status": "accepted" }` lub
  - `{ "question": "Updated question?", "answer": "Updated answer" }`

**PATCH /api/flashcards/bulk**

- Metoda HTTP: PATCH
- URL: `/api/flashcards/bulk`
- Request Body: Obiekt zawierający tablicę `flashcard_ids` oraz obiekt `updates`, np.
  - `{ "flashcard_ids": [1, 3, 5, 7], "updates": { "status": "accepted" } }`

**DELETE /api/flashcards/{flashcard_id}**

- Metoda HTTP: DELETE
- URL: `/api/flashcards/{flashcard_id}`

**DELETE /api/flashcards**

- Metoda HTTP: DELETE
- URL: `/api/flashcards`
- Request Body: Obiekt zawierający `flashcard_ids`, np.
  - `{ "flashcard_ids": [1, 3, 5, 7] }`

## 3. Wykorzystywane typy

W implementacji wykorzystamy następujące DTO i Command Modele (zdefiniowane w pliku `src/types.ts`):

- Flashcard (Reprezentacja encji fiszki)
- GenerateFlashcardsResponse (dla generowania fiszek – używane gdy dotyczy generacji)
- GetFlashcardsQuery (dla parametrów zapytań przy pobieraniu listy fiszek)
- GetFlashcardsResponse (dla odpowiedzi listy fiszek wraz z paginacją)
- UpdateFlashcardRequest (dla częściowej aktualizacji pojedynczej fiszki)
- UpdateFlashcardResponse (dla zwrócenia zaktualizowanej fiszki)

Dodatkowo będą wykorzystywane odpowiednie typy błędów:

- ApiErrorResponse (struktura dla błędów)
- ApiSuccessResponse (dla operacji, które nie zwracają dodatkowych danych)

## 4. Szczegóły odpowiedzi

Poniżej znajduje się struktura odpowiedzi dla poszczególnych operacji:

- **GET /api/flashcards**:
  - Status: 200 OK
  - Body: `{ "flashcards": [Flashcard, ...], "pagination": { "page": <number>, "limit": <number>, "total": <number>, "total_pages": <number> } }`

- **PATCH /api/flashcards/{flashcard_id}**:
  - Status: 200 OK
  - Body: Zaktualizowana fiszka: `{ "flashcard_id": <number>, "question": <string>, "answer": <string>, "status": <string> }`

- **PATCH /api/flashcards/bulk**:
  - Status: 200 OK
  - Body: `{ "updated_count": <number>, "failed_count": <number>, "results": [{ "flashcard_id": <number>, "status": "updated" | "not_found" }, ...] }`

- **DELETE /api/flashcards/{flashcard_id}**:
  - Status: 200 OK
  - Body: `{ "message": "Flashcard deleted successfully." }`

- **DELETE /api/flashcards**:
  - Status: 200 OK
  - Body: `{ "deleted_count": <number>, "failed_count": <number>, "results": [{ "flashcard_id": <number>, "status": "deleted" | "not_found" }, ...] }`

## 5. Przepływ danych

1. Odbiór żądania z odpowiednimi parametrami lub danymi JSON.
2. Weryfikacja autentykacji i autoryzacji użytkownika (np. używając Supabase Auth).
3. Walidacja danych wejściowych:
   - Sprawdzenie poprawności parametrów query (dla GET) lub struktury request body (dla PATCH/DELETE), przy użyciu np. Zod.
   - Upewnienie się, że liczby stron, limit i opcje sortowania są zgodne ze specyfikacją.
4. Interakcja z bazą danych PostgreSQL przy pomocy Supabase:
   - Dla GET, wykonanie zapytań z paginacją, sortowaniem, oraz ewentualnym filtrowaniem.
   - Dla PATCH i DELETE, aktualizacja lub usunięcie rekordów przy jednoczesnym sprawdzeniu istnienia zasobów.
   - Dla operacji bulk, iteracja po tablicach ID i wykonywanie operacji w transakcji, aby zapewnić spójność.
5. Przygotowanie odpowiedzi zgodnie z opisanymi strukturami odpowiedzi z DTO.

## 6. Względy bezpieczeństwa

- Uwierzytelnianie i autoryzacja: Zapewnić, że tylko uprawnieni użytkownicy mają dostęp do operacji CRUD, np. poprzez integrację z Supabase Auth.
- Walidacja danych wejściowych: Używać Zod lub analogicznej biblioteki aby zapobiec atakom typu injection lub przekazywaniu nieprawidłowych danych.
- Spójność danych: Dla operacji bulk wykorzystywać transakcje, aby uniknąć częściowych aktualizacji przy awariach.

## 7. Obsługa błędów

Poniższe scenariusze błędów powinny być zaimplementowane:

- 400 Bad Request:
  - Nieprawidłowe parametry query (np. niepoprawna wartość `limit` lub `page` poza zakresem)
  - Błędna struktura request body (np. brak wymaganych pól lub niewłaściwy format danych)
- 401 Unauthorized:
  - Próba dostępu bez autoryzacji lub niewystarczające uprawnienia
- 404 Not Found:
  - Fiszki lub zbiór fiszek nie istniejący w bazie danych
- 500 Internal Server Error:
  - Niespodziewane błędy na serwerze, np. problemy z połączeniem do bazy danych

Każdy błąd powinien być logowany zgodnie z polityką logowania serwera, umożliwiając późniejszą analizę i debugowanie.

## 9. Etapy wdrożenia

1. Utworzenie i walidacja nowego endpointu GET /api/flashcards:
   - Opracowanie walidacji parametrów query
   - Implementacja logiki pobierającej dane z bazy z paginacją oraz sortowaniem

2. Implementacja endpointu PATCH /api/flashcards/{flashcard_id}:
   - Prowadzenie częściowej aktualizacji rekordów przy użyciu UpdateFlashcardRequest
   - Weryfikacja istnienia fiszki przed aktualizacją

3. Implementacja operacji bulk (PATCH /api/flashcards/bulk i DELETE /api/flashcards):
   - Obsługa żądań z tablicą identyfikatorów, transakcji, oraz zbiorczych operacji
   - Logika wyznaczająca status operacji dla poszczególnych ID

4. Implementacja endpointu DELETE /api/flashcards/{flashcard_id}:
   - Weryfikacja istnienia rekordu przed usunięciem
   - Użycie odpowiednich metod bazy danych Supabase

---

Plan wdrożenia został przygotowany z uwzględnieniem specyfikacji API, istniejącej struktury bazy danych, zdefiniowanych typów DTO, oraz stosowanego stacku technologicznego (Astro, TypeScript, React, Tailwind, Supabase). Wszystkie zasady implementacji, w tym bezpieczeństwo i wydajność, zostały ujęte aby zapewnić niezawodność i skalowalność rozwiązania.
