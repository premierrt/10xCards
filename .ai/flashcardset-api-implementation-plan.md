# API Endpoint Implementation Plan: Flashcard Sets Creation Endpoint

## 1. Przegląd punktu końcowego

Endpoint POST /api/flashcard-sets jest odpowiedzialny za tworzenie zestawu fiszek (flashcard set) dla użytkownika. Proces obejmuje walidację danych wejściowych, sprawdzenie dostępności unikalnej nazwy zestawu oraz akceptację fiszek, a następnie zapisanie nowego rekordu w tabeli `flashcard_sets` i powiązanych wpisów w tabeli `flashcard_set_flashcards`.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: /api/flashcard-sets
- **Parametry**:
  - **Wymagane**:
    - `user_id` (number lub string) – identyfikator użytkownika tworzącego zestaw
    - `name` (string) – unikalna nazwa zestawu
    - `flashcard_ids` (array of numbers) – lista identyfikatorów fiszek, które mają być dodane do zestawu
  - **Opcjonalne**: Brak
- **Request Body**: JSON w formacie:
  ```json
  {
    "user_id": 1,
    "name": "Unique Set Name",
    "flashcard_ids": [1, 3, 5]
  }
  ```

## 3. Wykorzystywane typy

- **DTO dla żądania**: `CreateFlashcardSetRequest` (zdefiniowany w src/types.ts)
- **DTO dla odpowiedzi**: `CreateFlashcardSetResponse` (zdefiniowany w src/types.ts)

## 4. Szczegóły odpowiedzi

- **Succcess**:
  - Kod statusu: 201 Created
  - Body:
    ```json
    {
      "set_id": 1,
      "created_at": "2023-01-01T00:00:00Z",
      "flashcards_added": 3
    }
    ```

- **Błędy**:
  - 400 Bad Request: gdy nazwa zestawu jest zajęta lub przynajmniej jedna z fiszek nie jest w stanie "zaakceptowanym" (accepted)
  - 401 Unauthorized: gdy użytkownik nie jest uwierzytelniony
  - 500 Internal Server Error: w przypadku nieoczekiwanych błędów serwera

## 5. Przepływ danych

1. Użytkownik wysyła żądanie POST /api/flashcard-sets z danymi: `user_id`, `name`, oraz `flashcard_ids`.
2. Endpoint waliduje dane wejściowe przy użyciu Zod (lub innego walidatora) zgodnie z DTO:
   - Sprawdzanie wymaganego formatu danych (typy, struktura)
   - Upewnienie się, że `name` nie jest już zajęta w tabeli `flashcard_sets`
   - Sprawdzenie, czy wszystkie `flashcard_ids` odpowiadają fiszkom, które są w stanie "accepted" (odniesienie do tabeli `flashcards` i sprawdzenie kolumny status, np. `status = 'accepted'`)
3. Po pozytywnej walidacji, wywołana zostaje logika usługi (service layer):
   - Utworzenie nowego rekordu w tabeli `flashcard_sets` z danymi `user_id` i `name`.
   - Dla każdego podanego `flashcard_id` dodanie wpisu do tabeli `flashcard_set_flashcards` z referencjami do `set_id` oraz `flashcard_id`.
4. Endpoint zwraca obiekt CreateFlashcardSetResponse z informacjami o utworzonym zestawie.

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie i autoryzacja**:
  - Upewnij się, że żądanie pochodzi od uwierzytelnionego użytkownika. Użyj mechanizmu uwierzytelniania Supabase (sprawdzenie `context.locals` lub podobnego mechanizmu)
  - Waliduj `user_id` w żądaniu, aby potwierdzić, że użytkownik ma prawo tworzyć zestaw fiszek (np. porównaj z danymi uwierzytelnienia)

- **Walidacja danych wejściowych**:
  - Stosuj walidację przy użyciu Zod dla danych wejściowych
  - Zabezpiecz się przed atakami typu injection przez odpowiednie używanie zapytań parametrów

- **Bezpieczne operacje na bazie**:
  - Upewnij się, że operacje DML są wykonywane w transakcji w celu zachowania spójności danych
  - Korzystaj z referencyjnych kluczy zgodnie z planem bazy danych

## 7. Obsługa błędów

- **Błędy walidacji (400 Bad Request)**:
  - Nazwa zestawu już istnieje
  - Jeden lub więcej `flashcard_ids` odnosi się do fiszek, które nie są zaakceptowane

- **Błąd uwierzytelnienia (401 Unauthorized)**:
  - Brak ważnego tokenu lub sesji użytkownika

- **Błąd serwera (500 Internal Server Error)**:
  - Niespodziewane wyjątki bazy danych lub serwera

Każdy błąd powinien być odpowiednio zalogowany oraz opakowany w standardowy format `ApiErrorResponse`.

## 8. Rozważania dotyczące wydajności

- **Kwerendy do bazy**:
  - Optymalizacja zapytań przez indeksy (np. indeks na kolumnie `name` w `flashcard_sets`)
  - Minimalizacja liczby zapytań: wstawienie wpisów w `flashcard_set_flashcards` może być zbiorcze

- **Transakcje**:
  - Wykorzystanie transakcji w przypadku operacji wieloetapowych (utworzenie zestawu + powiązanych rekordów), aby zapewnić spójność danych

## 9. Etapy wdrożenia

1. **Uwierzytelnienie**:
   - Sprawdzenie, czy użytkownik jest uwierzytelniony i zgodny z danymi `user_id` przekazanymi w żądaniu

2. **Walidacja wejściowa**:
   - Implementacja walidacji danych wejściowych przy użyciu Zod zgodnie z typem `CreateFlashcardSetRequest`
   - Sprawdzenie unikalności nazwy zestawu oraz statusu fiszek

3. **Logika serwisowa**:
   - Utworzenie nowego modułu serwisowego w `src/lib/services` (np. flashcardSetService.ts), który zawiera logikę tworzenia zestawu fiszek i powiązanych rekordów
   - Implementacja transakcji bazy danych w celu dodania wpisu do `flashcard_sets` oraz rekordów w `flashcard_set_flashcards`

4. **Interakcja z bazą danych**:
   - Wykorzystanie Supabase client (zgodnie z zasadami w `backend.mdc`), zwłaszcza poprzez korzystanie z `context.locals`
   - Upewnienie się, że zapytania są zoptymalizowane i korzystają z odpowiednich indeksów

5. **Obsługa błędów i logowanie**:
   - Implementacja globalnego middleware do obsługi błędów (zgodnie z zasadami z `shared.mdc`)
   - Zapisywanie błędów systemowych do dedykowanego logu
