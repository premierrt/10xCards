# Architektura UI dla FlashLearn MVP

## 1. Przegląd struktury UI

FlashLearn to minimalistyczna aplikacja webowa dedykowana dla desktop, skupiona na efektywnym przepływie pracy związanym z tworzeniem i powtarzaniem fiszek. Interfejs użytkownika został zaprojektowany bez zbędnych animacji, z naciskiem na prostotę i funkcjonalność. Aplikacja wykorzystuje ograniczony kontener (max-width: 1200px) i synchroniczną komunikację z API bez lokalnego cachowania danych.

## 2. Lista widoków

### 2.1 Ekran powitalny (Landing Page)
- **Ścieżka widoku**: `/`
- **Główny cel**: Prezentacja wartości produktu i konwersja nowych użytkowników
- **Kluczowe informacje do wyświetlenia**:
  - Opis metody spaced repetition
  - Korzyści z automatycznego generowania fiszek
  - Oszczędność czasu w porównaniu do ręcznego tworzenia
- **Kluczowe komponenty widoku**:
  - Nagłówek z logo i nazwą aplikacji
  - Sekcja hero z opisem wartości
  - Przyciski CTA: "Zaloguj się" i "Zarejestruj się"
- **UX, dostępność i względy bezpieczeństwa**:
  - Wysoki kontrast przycisków CTA
  - Czytelna typografia
  - Responsywny layout w ramach ograniczonego kontenera

### 2.2 Widok logowania
- **Ścieżka widoku**: `/login`
- **Główny cel**: Autoryzacja istniejących użytkowników
- **Kluczowe informacje do wyświetlenia**:
  - Formularz logowania
  - Link do rejestracji
  - Komunikaty błędów
- **Kluczowe komponenty widoku**:
  - Pole email
  - Pole hasła
  - Przycisk "Zaloguj się"
  - Link "Nie masz konta? Zarejestruj się"
- **UX, dostępność i względy bezpieczeństwa**:
  - Inline walidacja formularza
  - Maskowanie hasła
  - Komunikaty błędów pod polami
  - Autofocus na pierwszym polu

### 2.3 Widok rejestracji
- **Ścieżka widoku**: `/register`
- **Główny cel**: Utworzenie nowego konta użytkownika
- **Kluczowe informacje do wyświetlenia**:
  - Formularz rejestracji
  - Wymagania dotyczące hasła
  - Link do logowania
- **Kluczowe komponenty widoku**:
  - Pole email
  - Pole hasła z wymaganiami
  - Pole potwierdzenia hasła
  - Przycisk "Zarejestruj się"
  - Link "Masz już konto? Zaloguj się"
- **UX, dostępność i względy bezpieczeństwa**:
  - Walidacja siły hasła
  - Sprawdzenie unikalności email
  - Komunikaty o wymaganiach hasła
  - Potwierdzenie zgodności haseł

### 2.4 Strona główna (Dashboard)
- **Ścieżka widoku**: `/sets`
- **Główny cel**: Przegląd i zarządzanie zestawami fiszek
- **Kluczowe informacje do wyświetlenia**:
  - Lista zestawów użytkownika
  - Liczba fiszek w zestawie
  - Data utworzenia
  - Badge "Nowy" dla zestawów bez powtórek
- **Kluczowe komponenty widoku**:
  - Przycisk "Wyloguj" w prawym górnym rogu
  - Przycisk "Stwórz nowy zestaw"
  - Lista kart zestawów
  - Przyciski "Powtórz teraz" i "Usuń zestaw"
  - Pusty stan z ilustracją i CTA
- **UX, dostępność i względy bezpieczeństwa**:
  - Sortowanie po dacie (najnowsze na górze)
  - Modalne potwierdzenie usunięcia
  - Komunikat o limitach po przekroczeniu
  - Wizualne wyróżnienie nowych zestawów

### 2.5 Generator fiszek
- **Ścieżka widoku**: `/generate`
- **Główny cel**: Wprowadzenie tekstu i wygenerowanie fiszek
- **Kluczowe informacje do wyświetlenia**:
  - Pole tekstowe na treść źródłową
  - Licznik słów
  - Wybór liczby fiszek
  - Wskazówki o optymalnej długości
- **Kluczowe komponenty widoku**:
  - Przycisk "← Powrót do zestawów"
  - Textarea o stałej wysokości (400px) ze scrollem
  - Licznik słów (aktualnie/10000)
  - Selektor liczby fiszek (1-20)
  - Przycisk "Wygeneruj fiszki"
  - Podpowiedź o optymalnej długości tekstu
- **UX, dostępność i względy bezpieczeństwa**:
  - Walidacja długości tekstu (1000-10000 słów)
  - Komunikat błędu przy przekroczeniu limitów
  - Timeout error po 10 sekundach
  - Zachowanie tekstu w formularzu

### 2.6 Przegląd wygenerowanych fiszek
- **Ścieżka widoku**: `/generate` (ten sam widok, zmiana stanu)
- **Główny cel**: Akceptacja lub odrzucenie wygenerowanych fiszek
- **Kluczowe informacje do wyświetlenia**:
  - Lista wygenerowanych fiszek
  - Pytanie i odpowiedź dla każdej fiszki
  - Status akceptacji
- **Kluczowe komponenty widoku**:
  - Lista fiszek z checkboxami
  - Przyciski "Zaakceptuj wszystkie" / "Odrzuć wszystkie"
  - Pole nazwy zestawu
  - Przycisk "Zapisz zaakceptowane"
  - Przycisk "Wygeneruj ponownie"
- **UX, dostępność i względy bezpieczeństwa**:
  - Pełny tekst fiszek bez przycinania
  - Walidacja unikalności nazwy zestawu
  - Minimum jedna zaakceptowana fiszka
  - Możliwość ponownego generowania

### 2.7 Widok powtórki
- **Ścieżka widoku**: `/review/{setId}`
- **Główny cel**: Przeprowadzenie sesji powtórki fiszek
- **Kluczowe informacje do wyświetlenia**:
  - Aktualna fiszka (pytanie/odpowiedź)
  - Postęp sesji
  - Przyciski akcji
- **Kluczowe komponenty widoku**:
  - Pasek postępu (np. "5/20")
  - Obszar wyświetlania pytania
  - Przycisk "Pokaż odpowiedź"
  - Obszar wyświetlania odpowiedzi
  - Przyciski "Znam" (zielony) i "Nie znam" (czerwony)
  - Przycisk "Zakończ sesję"
- **UX, dostępność i względy bezpieczeństwa**:
  - Kolorowe kodowanie przycisków
  - Losowa kolejność fiszek
  - Ostrzeżenie przy opuszczaniu niezakończonej sesji
  - Reset sesji bez zapisywania przy wyjściu

### 2.8 Podsumowanie powtórki
- **Ścieżka widoku**: `/review/{setId}/summary`
- **Główny cel**: Prezentacja statystyk sesji powtórki
- **Kluczowe informacje do wyświetlenia**:
  - Liczba poznanych fiszek
  - Liczba niepoznanych fiszek
  - Procentowy wskaźnik sukcesu
- **Kluczowe komponenty widoku**:
  - Statystyki sesji
  - Przycisk "Powrót do zestawów"
  - Przycisk "Powtórz nieznane" (jeśli są)
- **UX, dostępność i względy bezpieczeństwa**:
  - Czytelna prezentacja statystyk
  - Jasne opcje dalszych działań

## 3. Mapa podróży użytkownika

### 3.1 Pierwsza wizyta (Onboarding)
1. Użytkownik wchodzi na stronę powitalną
2. Klika "Zarejestruj się"
3. Wypełnia formularz rejestracji
4. Po pomyślnej rejestracji zostaje automatycznie zalogowany
5. Trafia na pustą stronę główną z komunikatem zachęcającym
6. Klika "Stwórz pierwszy zestaw"
7. Przechodzi do generatora fiszek

### 3.2 Tworzenie zestawu fiszek
1. Użytkownik wkleja tekst źródłowy
2. Wybiera liczbę fiszek do wygenerowania
3. Klika "Wygeneruj fiszki"
4. Przegląda wygenerowane fiszki
5. Akceptuje/odrzuca poszczególne fiszki
6. Nadaje nazwę zestawowi
7. Zapisuje zestaw
8. Pozostaje w generatorze z możliwością stworzenia kolejnego zestawu

### 3.3 Powtórka zestawu
1. Użytkownik wybiera zestaw z listy na stronie głównej
2. Klika "Powtórz teraz"
3. Widzi pytanie pierwszej fiszki
4. Klika "Pokaż odpowiedź"
5. Ocenia znajomość: "Znam" lub "Nie znam"
6. Przechodzi przez wszystkie fiszki
7. Widzi podsumowanie sesji
8. Wraca do listy zestawów

### 3.4 Powrót użytkownika
1. Użytkownik wchodzi na stronę powitalną
2. Klika "Zaloguj się"
3. Wprowadza dane logowania
4. Trafia na stronę główną z listą zestawów
5. Zestawy wymagające powtórki są na górze listy

## 4. Układ i struktura nawigacji

### 4.1 Minimalna nawigacja
- Brak stałego menu nawigacyjnego
- Przycisk "← Powrót do zestawów" w widokach szczegółowych
- Przycisk "Wyloguj" zawsze widoczny w prawym górnym rogu (dla zalogowanych)

### 4.2 Przepływ między widokami
- Nawigacja oparta na akcjach użytkownika
- Proste ścieżki URL dla łatwej orientacji
- Przekierowania po zakończonych akcjach

### 4.3 Hierarchia widoków
```
/ (Landing)
├── /login
├── /register
└── /sets (wymaga autoryzacji)
    ├── /generate
    └── /review/{setId}
        └── /review/{setId}/summary
```

## 5. Kluczowe komponenty

### 5.1 Przycisk akcji
- Warianty: główny (zielony), drugorzędny (szary), destrukcyjny (czerwony)
- Używany do wszystkich głównych akcji w aplikacji

### 5.2 Karta zestawu
- Wyświetla nazwę, liczbę fiszek, datę utworzenia
- Zawiera przyciski akcji: "Powtórz teraz", "Usuń"
- Badge "Nowy" dla zestawów bez powtórek

### 5.3 Formularz z walidacją
- Inline komunikaty błędów
- Walidacja w czasie rzeczywistym
- Czytelne etykiety i podpowiedzi

### 5.4 Modal potwierdzenia
- Używany dla akcji destrukcyjnych
- Jasny komunikat o konsekwencjach
- Przyciski: "Anuluj" i "Potwierdź"

### 5.5 Pasek postępu
- Pokazuje postęp w sesji powtórki
- Format: "X/Y" gdzie X to aktualna fiszka, Y to całkowita liczba

### 5.6 Komunikat statusu
- Informacje o sukcesie, błędzie lub ostrzeżeniu
- Wyświetlany inline lub jako toast

### 5.7 Pusty stan
- Ilustracja lub ikona
- Opis sytuacji
- CTA zachęcające do akcji

### 5.8 Licznik
- Pokazuje aktualne wykorzystanie limitów
- Format: "X/200 zestawów" lub "X/10000 fiszek"