# API Endpoint Implementation Plan: Flashcard Sets CRUD

## 1. Przegląd punktu końcowego
Ten plan obejmuje implementację trzech związanych endpointów interfejsu API do zarządzania zestawami fiszek użytkownika. Endpointy umożliwiają:

- Pobranie listy zestawów fiszek (GET /api/flashcard-sets) z opcjonalnym dołączaniem identyfikatorów fiszek.
- Pobranie szczegółowych informacji o pojedynczym zestawie (GET /api/flashcard-sets/{set_id}) z opcjonalnymi szczegółami fiszek (pytanie i odpowiedź).
- Usunięcie określonego zestawu fiszek (DELETE /api/flashcard-sets/{set_id}).

## 2. Szczegóły żądania

### GET /api/flashcard-sets
- **Metoda HTTP**: GET
- **URL**: /api/flashcard-sets
- **Parametry zapytania**:
  - `page` (opcjonalne, domyślnie `1`)
  - `limit` (opcjonalne, domyślnie `10`, maksymalnie `100`)
  - `include_flashcards` (opcjonalne, domyślnie `true`, wartości: `true` lub `false`) – decyduje, czy zwrócić listę identyfikatorów fiszek w zestawie

### GET /api/flashcard-sets/{set_id}
- **Metoda HTTP**: GET
- **URL**: /api/flashcard-sets/{set_id}
- **Parametry zapytania**:
  - `include_flashcard_details` (opcjonalne, domyślnie `false`, wartości: `true` lub `false`) – decyduje, czy zwrócić pełne szczegóły fiszek (pytanie i odpowiedź) czy tylko identyfikatory

### DELETE /api/flashcard-sets/{set_id}
- **Metoda HTTP**: DELETE
- **URL**: /api/flashcard-sets/{set_id}
- Nie wymaga dodatkowych parametrów ani body.

## 3. Wykorzystywane typy (DTO i modele)

- **GetFlashcardSetsResponse**: 
  - Zawiera: lista elementów typu FlashcardSetListItem oraz metadane paginacji (PaginationInfo).
  - FlashcardSetListItem: identyfikator zestawu, nazwa, liczba fiszek, data utworzenia oraz (opcjonalnie) lista identyfikatorów fiszek, jeżeli `include_flashcards` jest true.

- **Generated DTO dla pojedynczego zestawu (GET /api/flashcard-sets/{set_id})**:
  - Jeśli `include_flashcard_details` jest false: zwracane identyfikatory fiszek.
  - Jeśli `include_flashcard_details` jest true: zwracane są pełne szczegóły fiszek (flashcard_id, question, answer).

- **DeleteFlashcardSetResponse**:
  - Zawiera komunikat potwierdzający usunięcie zestawu.


## 4. Przepływ danych

1. Weryfikacja tożsamości użytkownika (autoryzacja) przy użyciu Supabase Auth.
2. Walidacja parametrów zapytania przy użyciu Zod lub innej biblioteki walidującej dane.
3. Pobranie danych z bazy PostgreSQL:
   - Dla listy zestawów: 
     - Wyszukiwanie w tabeli `flashcard_sets` oraz zliczenie powiązanych wpisów w `flashcard_set_flashcards`
     - Jeśli parametr `include_flashcards` jest true, dołączamy listę identyfikatorów powiązanych fiszek.
   - Dla pojedynczego zestawu: 
     - Weryfikacja, czy zestaw istnieje oraz należy do aktualnie zalogowanego użytkownika.
     - Jeśli `include_flashcard_details` jest true, wykonanie join z tabelą `flashcards`, aby pobrać pytania i odpowiedzi.
4. Zwrócenie odpowiedniego formatu JSON zgodnego z dokumentacją.

## 5. Względy bezpieczeństwa

- Użytkownik musi być uwierzytelniony. W przeciwnym wypadku zwracany jest błąd 401 Unauthorized.
- Weryfikacja, czy żądany zestaw należy do zalogowanego użytkownika (ograniczenie dostępu do zasobów). Jeśli nie, zwrócenie 404 Not Found.
- Walidacja wszystkich parametrów wejściowych, aby zapobiec atakom SQL Injection i innym zagrożeniom.
- Ograniczenie wyników zapytań (paginacja) w celu ochrony przed atakami Denial-of-Service.

## 6. Obsługa błędów

- 200 OK: Pomyślne wykonanie operacji GET lub DELETE.
- 400 Bad Request: Błędne lub niekompletne dane wejściowe (np. nieprawidłowy format parametrów).
- 401 Unauthorized: Użytkownik nie jest zalogowany lub token jest nieważny.
- 404 Not Found: Zestaw nie istnieje lub użytkownik nie posiada dostępu do żądanego zasobu.
- 500 Internal Server Error: Problemy wewnątrz serwera lub bazy danych.

## 7. Rozważania dotyczące wydajności

- Wykorzystanie indeksów na kolumnach takich jak `user_id` w tabeli `flashcard_sets` oraz odpowiednich kluczach obcych w tabeli `flashcard_set_flashcards` dla szybkich zapytań.
- Paginacja wyników zapytań, aby ograniczyć rozmiar wysyłanych danych.
- Używanie joinów tylko wtedy, gdy jest to niezbędne, np. dołączanie szczegółów fiszek gdy `include_flashcard_details` jest ustawione na true.

## 8. Etapy wdrożenia

1. Utworzenie lub aktualizacja endpointu GET /api/flashcard-sets:
   - Implementacja walidacji parametrów (page, limit, include_flashcards).
   - Pobranie listy zestawów fiszek z bazy danych z uwzględnieniem paginacji.
   - Dołączenie listy identyfikatorów fiszek, jeśli `include_flashcards` jest true.
   - Zwrócenie odpowiedniego JSON z metadanymi paginacji.

2. Utworzenie lub aktualizacja endpointu GET /api/flashcard-sets/{set_id}:
   - Walidacja i weryfikacja istnienia zestawu oraz autoryzacja dostępu.
   - Pobranie danych zestawu z bazy danych.
   - W zależności od wartości `include_flashcard_details`, wykonanie:
     - Zwrócenie listy identyfikatorów fiszek (domyślne), lub 
     - Dołączenie szczegółowych danych każdej fiszki (join z tabelą flashcards).
   - Zwrócenie odpowiedniego JSON.

3. Utworzenie lub aktualizacja endpointu DELETE /api/flashcard-sets/{set_id}:
   - Walidacja i weryfikacja istnienia zestawu oraz autoryzacja dostępu (czy zestaw należy do użytkownika).
   - Usunięcie wpisu z tabeli `flashcard_sets` i powiązanych wpisów w `flashcard_set_flashcards` (ON DELETE CASCADE powinno to obsłużyć automatycznie).
   - Zwrócenie komunikatu potwierdzającego usunięcie.

4. Wyodrębnienie logiki do serwisu (np. w pliku src/lib/services/flashcardSetService.ts):
   - Funkcje do pobierania, szczegółowego pobierania i usuwania zestawów.
   - Ujednolicona walidacja oraz operacje bazodanowe.

7. Aktualizacja dokumentacji API (np. w Swagger/OpenAPI) i komunikacja zmian z zespołem.
