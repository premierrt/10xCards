# Generator Fiszek - Komponenty

## Struktura komponentów

```
GenerateView (główny komponent)
├── BackButton
├── GenerateForm (stan 'input')
│   ├── TextInput
│   ├── FlashcardCountSelector
│   └── GenerateButton
└── FlashcardReview (stan 'review')
    ├── FlashcardList
    │   └── FlashcardItem
    ├── BulkActions
    ├── SetNameInput
    └── ActionButtons
```

## Testowanie manualne

### Scenariusz 1: Podstawowy przepływ generowania fiszek

1. Otwórz `/generate`
2. Wklej tekst o długości 1000+ słów
3. Wybierz liczbę fiszek (1-20)
4. Kliknij "Wygeneruj fiszki"
5. Sprawdź, czy przełącza się na widok przeglądu

### Scenariusz 2: Walidacja formularza

1. Wpisz tekst krótszy niż 1000 słów - sprawdź komunikat błędu
2. Wpisz tekst dłuższy niż 10000 słów - sprawdź komunikat błędu
3. Sprawdź licznik słów w czasie rzeczywistym

### Scenariusz 3: Przegląd i akceptacja fiszek

1. Po wygenerowaniu fiszek:
   - Sprawdź czy wszystkie są domyślnie zaakceptowane
   - Odznacz niektóre fiszki
   - Użyj "Zaakceptuj wszystkie" / "Odrzuć wszystkie"
   - Wprowadź nazwę zestawu i sprawdź walidację unikalności

### Scenariusz 4: Obsługa błędów

1. Sprawdź timeout dla generowania (symuluj opóźnienie API)
2. Sprawdź błędy HTTP (404, 500)
3. Sprawdź walidację nazwy zestawu

## API Endpointy wymagane

- `POST /api/flashcards/generate` - generowanie fiszek
- `PATCH /api/bulk-flashcards` - aktualizacja statusów
- `POST /api/flashcard-sets` - tworzenie zestawu
- `GET /api/flashcard-sets?name=X` - sprawdzenie unikalności nazwy

## Stan implementacji

✅ Struktura komponentów  
✅ Zarządzanie stanem (useFlashcardGenerator hook)  
✅ Walidacja formularza  
✅ UI/UX z Tailwind + Shadcn/ui  
✅ Obsługa błędów i timeoutów  
✅ Strona Astro z integracją React  
⚠️ API endpoints (do implementacji backend)  
⚠️ Autentykacja użytkownika (user_id)  
⚠️ Testy automatyczne
