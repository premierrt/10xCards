<conversation_summary>

Interfejs MVP ma skupić się wyłącznie na widoku generowania i bulk akceptacji fiszek, bez dodatkowych widoków do zarządzania zestawami czy powtórkami.
Formularz generowania fiszek umożliwi wklejanie tekstu oraz wybór liczby fiszek, a informacje o ograniczeniach będą umieszczone inline.
Bulk akceptacja fiszek zostanie zrealizowana za pomocą endpointu /api/flashcards/bulk, bez możliwości edycji pojedynczych fiszek.
Komunikaty błędów będą prezentowane inline przy poszczególnych polach formularza oraz jako globalny alert dla błędów systemowych.
Routing zostanie zrealizowany poprzez prosty mechanizm udostępniany przez Astro.
Zarządzanie stanem aplikacji będzie odbywać się przy użyciu mechanizmów React (hooki lub React Context).
Projekt interfejsu zakłada prosty, desktopowy widok bez responsywności dla urządzeń mobilnych.
Wygląd UI będzie utrzymany przy użyciu Tailwind CSS i komponentów shadcn/ui dla spójności stylistycznej.
Interfejs zawiera potwierdzenie operacji bulk oraz krótkie podsumowanie operacji po zatwierdzeniu fiszek.
Istotne funkcje zostały ograniczone do niezbędnych elementów MVP, rezygnując z dodatkowych opcji, takich jak licznik słów, edycja poszczególnych fiszek, czy zaawansowana walidacja.