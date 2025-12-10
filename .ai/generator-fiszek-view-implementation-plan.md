# Plan implementacji widoku Generator fiszek

## 1. Przegląd

Widok generatora fiszek umożliwia użytkownikowi wklejenie tekstu źródłowego i automatyczne wygenerowanie fiszek w formacie pytanie-odpowiedź. Widok składa się z dwóch stanów: formularza wprowadzania tekstu oraz przeglądu wygenerowanych fiszek z możliwością ich akceptacji lub odrzucenia.

## 2. Routing widoku

`/generate` - główna ścieżka widoku dostępna dla zalogowanych użytkowników

## 3. Struktura komponentów

```
GenerateView (główny komponent widoku)
├── BackButton (przycisk powrotu)
├── GenerateForm (stan 1: formularz generowania)
│   ├── TextInput (pole tekstowe z licznikiem słów)
│   ├── FlashcardCountSelector (wybór liczby fiszek)
│   └── GenerateButton (przycisk generowania)
└── FlashcardReview (stan 2: przegląd fiszek)
    ├── FlashcardList (lista wygenerowanych fiszek)
    │   └── FlashcardItem (pojedyncza fiszka z checkboxem)
    ├── BulkActions (przyciski masowych akcji)
    ├── SetNameInput (pole nazwy zestawu)
    └── ActionButtons (zapisz/generuj ponownie)
```

## 4. Szczegóły komponentów

### GenerateView

- Opis komponentu: Główny kontener zarządzający stanem widoku i przełączaniem między formularzem a przeglądem fiszek
- Główne elementy:
  - Fragment lub div jako kontener
  - BackButton
  - GenerateForm lub FlashcardReview w zależności od stanu
- Obsługiwane zdarzenia:
  - Przełączanie między stanami po wygenerowaniu fiszek
  - Reset stanu po zapisaniu lub anulowaniu
- Warunki walidacji: Brak
- Typy: `ViewState`, `GeneratedFlashcard[]`
- Propsy: Brak (komponent główny)

### BackButton

- Opis komponentu: Przycisk nawigacji powrotnej do listy zestawów
- Główne elementy:
  - Link/a element z ikoną strzałki i tekstem "Powrót do zestawów"
- Obsługiwane zdarzenia: onClick (nawigacja)
- Warunki walidacji: Brak
- Typy: Brak
- Propsy: Brak

### GenerateForm

- Opis komponentu: Formularz wprowadzania tekstu i parametrów generowania
- Główne elementy:
  - form element
  - TextInput
  - FlashcardCountSelector
  - GenerateButton
  - p element z podpowiedzią o optymalnej długości
- Obsługiwane zdarzenia:
  - onSubmit (walidacja i wywołanie API)
  - onChange dla pól formularza
- Warunki walidacji:
  - Tekst musi mieć 1000-10000 słów
  - Liczba fiszek 1-20
- Typy: `GenerateFormData`, `GenerateFlashcardsRequest`
- Propsy: `onGenerate: (flashcards: GeneratedFlashcard[]) => void`

### TextInput

- Opis komponentu: Pole tekstowe z licznikiem słów do wprowadzania tekstu źródłowego
- Główne elementy:
  - textarea o wysokości 400px ze scrollem
  - span z licznikiem słów (format: "aktualnie/10000")
- Obsługiwane zdarzenia:
  - onChange (aktualizacja tekstu i licznika)
  - onBlur (walidacja długości)
- Warunki walidacji:
  - Minimum 1000 słów
  - Maksimum 10000 słów
- Typy: `TextInputValue`
- Propsy:
  - `value: string`
  - `onChange: (value: string) => void`
  - `error?: string`

### FlashcardCountSelector

- Opis komponentu: Wybór liczby fiszek do wygenerowania
- Główne elementy:
  - label element
  - select element z opcjami 1-20
- Obsługiwane zdarzenia: onChange
- Warunki walidacji: Wartość 1-20
- Typy: number
- Propsy:
  - `value: number`
  - `onChange: (count: number) => void`

### GenerateButton

- Opis komponentu: Przycisk uruchamiający generowanie fiszek
- Główne elementy:
  - button element z tekstem "Wygeneruj fiszki"
  - Opcjonalny spinner podczas ładowania
- Obsługiwane zdarzenia: onClick (przez formularz)
- Warunki walidacji: Aktywny tylko gdy formularz jest poprawny
- Typy: Brak
- Propsy:
  - `isLoading: boolean`
  - `disabled: boolean`

### FlashcardReview

- Opis komponentu: Widok przeglądu i akceptacji wygenerowanych fiszek
- Główne elementy:
  - FlashcardList
  - BulkActions
  - SetNameInput
  - ActionButtons
- Obsługiwane zdarzenia:
  - Zmiana statusu akceptacji fiszek
  - Zapisanie zestawu
  - Ponowne generowanie
- Warunki walidacji:
  - Minimum jedna zaakceptowana fiszka
  - Unikalna nazwa zestawu
- Typy: `ReviewState`, `FlashcardWithStatus[]`
- Propsy:
  - `flashcards: GeneratedFlashcard[]`
  - `onSave: () => void`
  - `onRegenerate: () => void`

### FlashcardList

- Opis komponentu: Lista wygenerowanych fiszek z możliwością akceptacji
- Główne elementy:
  - ul/div kontener
  - Kolekcja FlashcardItem
- Obsługiwane zdarzenia: Brak (delegowane do dzieci)
- Warunki walidacji: Brak
- Typy: `FlashcardWithStatus[]`
- Propsy:
  - `flashcards: FlashcardWithStatus[]`
  - `onToggle: (id: number) => void`

### FlashcardItem

- Opis komponentu: Pojedyncza fiszka z pytaniem, odpowiedzią i checkboxem
- Główne elementy:
  - li/div kontener
  - input type="checkbox"
  - div z pytaniem (pełny tekst)
  - div z odpowiedzią (pełny tekst)
- Obsługiwane zdarzenia: onChange dla checkbox
- Warunki walidacji: Brak
- Typy: `FlashcardWithStatus`
- Propsy:
  - `flashcard: FlashcardWithStatus`
  - `onToggle: () => void`

### BulkActions

- Opis komponentu: Przyciski do masowej akceptacji/odrzucenia fiszek
- Główne elementy:
  - button "Zaakceptuj wszystkie"
  - button "Odrzuć wszystkie"
- Obsługiwane zdarzenia: onClick dla każdego przycisku
- Warunki walidacji: Brak
- Typy: Brak
- Propsy:
  - `onAcceptAll: () => void`
  - `onRejectAll: () => void`

### SetNameInput

- Opis komponentu: Pole do wprowadzania nazwy zestawu
- Główne elementy:
  - label element
  - input type="text"
  - span z komunikatem błędu (opcjonalnie)
- Obsługiwane zdarzenia:
  - onChange
  - onBlur (sprawdzenie unikalności)
- Warunki walidacji:
  - Nazwa nie może być pusta
  - Nazwa musi być unikalna dla użytkownika
- Typy: string
- Propsy:
  - `value: string`
  - `onChange: (name: string) => void`
  - `error?: string`

### ActionButtons

- Opis komponentu: Przyciski akcji zapisania lub ponownego generowania
- Główne elementy:
  - button "Zapisz zaakceptowane"
  - button "Wygeneruj ponownie"
- Obsługiwane zdarzenia: onClick dla każdego przycisku
- Warunki walidacji:
  - Przycisk zapisu aktywny tylko gdy: nazwa niepusta, minimum 1 fiszka zaakceptowana, nazwa unikalna
- Typy: Brak
- Propsy:
  - `onSave: () => void`
  - `onRegenerate: () => void`
  - `canSave: boolean`

## 5. Typy

```typescript
// Stan widoku
type ViewState = "input" | "review";

// Rozszerzona fiszka ze statusem akceptacji
interface FlashcardWithStatus extends GeneratedFlashcard {
  isAccepted: boolean;
}

// Dane formularza generowania
interface GenerateFormData {
  text: string;
  count: number;
}

// Stan licznika słów
interface TextInputValue {
  text: string;
  wordCount: number;
}

// Stan przeglądu fiszek
interface ReviewState {
  flashcards: FlashcardWithStatus[];
  setName: string;
  isNameValid: boolean;
  nameError?: string;
}

// Błąd walidacji
interface ValidationError {
  field: string;
  message: string;
}

// Stan generowania
interface GenerationState {
  isLoading: boolean;
  error?: string;
  timeoutError: boolean;
}
```

## 6. Zarządzanie stanem

Komponent będzie używał wbudowanego stanu React (useState) oraz customowego hooka `useFlashcardGenerator`:

```typescript
const useFlashcardGenerator = () => {
  // Stan główny
  const [viewState, setViewState] = useState<ViewState>("input");
  const [formData, setFormData] = useState<GenerateFormData>({ text: "", count: 5 });
  const [generatedFlashcards, setGeneratedFlashcards] = useState<FlashcardWithStatus[]>([]);
  const [setName, setSetName] = useState("");
  const [generation, setGeneration] = useState<GenerationState>({ isLoading: false });

  // Metody
  const generateFlashcards = async () => {
    /* ... */
  };
  const updateFlashcardStatuses = async () => {
    /* ... */
  };
  const createFlashcardSet = async () => {
    /* ... */
  };
  const checkSetNameUniqueness = async (name: string) => {
    /* ... */
  };

  return {
    viewState,
    formData,
    generatedFlashcards,
    setName,
    generation,
    // ... metody
  };
};
```

## 7. Integracja API

### Generowanie fiszek

- **Endpoint**: `POST /api/flashcards/generate`
- **Request**: `GenerateFlashcardsRequest` - `{ text: string, count: number }`
- **Response**: `GenerateFlashcardsResponse` - `GeneratedFlashcard[]`
- **Obsługa błędów**: Timeout po 10 sekundach, walidacja długości tekstu

### Aktualizacja statusów fiszek

- **Endpoint**: `PATCH /api/bulk-flashcards`
- **Request**: `{ flashcard_ids: number[], updates: { status: "accepted" } }`
- **Response**: `BulkFlashcardOperationResponse`

### Tworzenie zestawu

- **Endpoint**: `POST /api/flashcard-sets`
- **Request**: `CreateFlashcardSetRequest` - `{ user_id: string, name: string, flashcard_ids: number[] }`
- **Response**: `CreateFlashcardSetResponse`

## 8. Interakcje użytkownika

1. **Wklejenie/wpisanie tekstu**: Aktualizacja pola tekstowego z bieżącym liczeniem słów
2. **Wybór liczby fiszek**: Aktualizacja selektora (domyślnie 5)
3. **Kliknięcie "Wygeneruj fiszki"**:
   - Walidacja formularza
   - Wywołanie API z timeoutem 10s
   - Przejście do stanu przeglądu
4. **Zaznaczenie/odznaczenie fiszki**: Zmiana statusu akceptacji pojedynczej fiszki
5. **"Zaakceptuj wszystkie"**: Oznaczenie wszystkich jako zaakceptowanych
6. **"Odrzuć wszystkie"**: Oznaczenie wszystkich jako odrzuconych
7. **Wpisanie nazwy zestawu**: Walidacja unikalności podczas blur
8. **"Zapisz zaakceptowane"**:
   - Aktualizacja statusów w bazie
   - Utworzenie zestawu
   - Nawigacja do listy zestawów
9. **"Wygeneruj ponownie"**: Powrót do formularza z zachowanym tekstem

## 9. Warunki i walidacja

### Formularz generowania

- **Tekst**:
  - Minimum 1000 słów (komunikat: "Tekst musi zawierać minimum 1000 słów")
  - Maksimum 10000 słów (komunikat: "Tekst nie może przekraczać 10000 słów")
  - Walidacja podczas blur i przed wysłaniem
- **Liczba fiszek**:
  - Zakres 1-20 (ograniczony przez select)

### Przegląd fiszek

- **Minimum jedna zaakceptowana**:
  - Przycisk "Zapisz" nieaktywny gdy wszystkie odrzucone
  - Komunikat: "Zaakceptuj przynajmniej jedną fiszkę"
- **Nazwa zestawu**:
  - Nie może być pusta (komunikat: "Nazwa zestawu jest wymagana")
  - Musi być unikalna (komunikat: "Zestaw o tej nazwie już istnieje")
  - Sprawdzanie podczas blur

## 10. Obsługa błędów

### Błędy walidacji

- Wyświetlanie komunikatów pod odpowiednimi polami
- Blokowanie akcji przy błędach

### Błędy API

- **Timeout (10s)**: "Generowanie fiszek trwa zbyt długo. Spróbuj ponownie z krótszym tekstem."
- **401 Unauthorized**: Przekierowanie do logowania
- **400 Bad Request**: Wyświetlenie szczegółowego komunikatu z API
- **500 Server Error**: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."

### Błędy biznesowe

- **Nazwa już istnieje**: Komunikat pod polem nazwy
- **Brak zaakceptowanych fiszek**: Komunikat informacyjny

## 11. Kroki implementacji

1. Utworzenie struktury plików komponentów w `src/components/generate/`
2. Implementacja typów w `src/types/generate.types.ts`
3. Utworzenie customowego hooka `useFlashcardGenerator`
4. Implementacja komponentu TextInput z licznikiem słów
5. Implementacja GenerateForm z walidacją
6. Implementacja FlashcardItem i FlashcardList
7. Implementacja SetNameInput z walidacją unikalności
8. Implementacja FlashcardReview z akcjami masowymi
9. Złożenie GenerateView z przełączaniem stanów
10. Integracja z API (generowanie, aktualizacja statusów, tworzenie zestawu)
11. Obsługa timeoutów i błędów
12. Testy manualne wszystkich przepływów
13. Dostosowanie stylów Tailwind zgodnie z projektem
