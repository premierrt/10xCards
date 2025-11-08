# Dokument wymagań produktu (PRD) – FlashLearn MVP

## 1. Przegląd produktu
FlashLearn to webowa aplikacja do nauki metodą powtórek rozłożonych w czasie (spaced repetition), której głównym celem jest skrócenie czasu potrzebnego na tworzenie fiszek edukacyjnych. Produkt umożliwia użytkownikowi wklejenie tekstu źródłowego (np. fragment artykułu, ebooka, notatek) i automatyczne wygenerowanie fiszek w formacie pytanie-odpowiedź. Użytkownik może następnie zaakceptować lub odrzucić wygenerowane fiszki i zapisać je w zestawie, który może zostać później użyty do powtórek.

## 2. Problem użytkownika
Samoucy korzystający z systemów fiszek często rezygnują z nauki, ponieważ ręczne tworzenie fiszek jest czasochłonne i wymaga dodatkowego zaangażowania. Mimo że metoda spaced repetition jest jedną z najbardziej efektywnych metod zapamiętywania, proces przygotowania materiałów do nauki hamuje jej wykorzystanie.

Produkt rozwiązuje ten problem, automatyzując etap tworzenia fiszek, skracając go do kilku kliknięć, co pozwala użytkownikowi skupić się na samej nauce.

## 3. Wymagania funkcjonalne

3.1 Generowanie i zarządzanie fiszkami
- Użytkownik może wkleić tekst w zakresie 1000–10000 słów.
- Użytkownik określa liczbę fiszek do wygenerowania (do maks. 20).
- Model AI generuje fiszki w formacie pytanie → odpowiedź.
- AI automatycznie skraca treści do 100–200 znaków, zachowując sens.
- Użytkownik widzi listę wygenerowanych fiszek i może każdą zaakceptować lub odrzucić.
- Po akceptacji fiszki nie podlegają edycji.
- Akceptowane fiszki zapisywane są w zestawie pod unikalną nazwą nadaną przez użytkownika.
- Użytkownik może usunąć cały zestaw fiszek.

3.2 System powtórek
- Zestawy fiszek są wyświetlane na stronie głównej.
- Przy każdym zestawie widoczny jest przycisk Powtórz teraz.
- Powtórki działają w kolejności losowej.
- Dla każdej fiszki użytkownik wskazuje Znam lub Nie znam.
- Fiszka oznaczona jako Znam znika z bieżącej sesji.
- Fiszki oznaczone jako Nie znam pozostają w sesji i mogą być powtarzane później.

3.3 Konta użytkowników
- Uwierzytelnianie przez email + hasło.
- Użytkownik może przechowywać maksymalnie 200 zestawów lub 10 000 fiszek.

3.4 Zachowanie systemu i ograniczenia
- Proces generowania jest synchroniczny.
- Jeśli tekst wejściowy przekracza dopuszczalny rozmiar, aplikacja wyświetla komunikat błędu.
- Brak funkcji eksportu, duplikowania i edycji fiszek po akceptacji.

## 4. Granice produktu

W ramach MVP nie są realizowane:
- Zaawansowane algorytmy powtórek (używana będzie gotowa biblioteka).
- Współdzielenie zestawów między użytkownikami.
- Integracje z zewnętrznymi źródłami treści (np. PDF, DOCX, platformy edukacyjne).
- Aplikacje mobilne (wersja tylko webowa).
- Funkcje onboardingu, tutoriali i testów użyteczności.
- Masowe operacje na fiszkach lub zestawach.
- Edycja fiszek po ich zaakceptowaniu.

## 5. Historyjki użytkowników

US-001  
Tytuł: Rejestracja konta  
Opis: Jako użytkownik chcę utworzyć konto za pomocą email + hasło, aby móc zapisywać i przechowywać swoje zestawy fiszek.  
Kryteria akceptacji:  
- Formularz rejestracji umożliwia wprowadzenie adresu email i hasła.  
- Po poprawnej rejestracji użytkownik zostaje zalogowany.  

US-002  
Tytuł: Logowanie do systemu  
Opis: Jako użytkownik chcę móc zalogować się na swoje konto, aby uzyskać dostęp do zapisanych fiszek.  
Kryteria akceptacji:  
- Formularz logowania przyjmuje email i hasło.  
- Przy poprawnej autoryzacji użytkownik trafia na stronę główną.  
- Przy błędnych danych pojawia się komunikat błędu.

US-003  
Tytuł: Wygenerowanie fiszek z tekstu  
Opis: Jako użytkownik chcę wkleić tekst i automatycznie wygenerować do 20 fiszek, aby zaoszczędzić czas na ich tworzeniu.  
Kryteria akceptacji:  
- System przyjmuje tekst wejściowy w zakresie 1000–10000 słów.  
- Użytkownik określa liczbę fiszek do wygenerowania.  
- System generuje fiszki w formacie pytanie-odpowiedź.

US-004  
Tytuł: Akceptacja lub odrzucenie wygenerowanych fiszek  
Opis: Jako użytkownik chcę zatwierdzić lub odrzucić wygenerowane fiszki, aby zachować tylko wartościowe.  
Kryteria akceptacji:  
- Każda fiszka posiada checkbox Akceptuj.  
- Akceptowane fiszki są zapisywane do zestawu.  
- Odrzucone fiszki są usuwane.

US-005  
Tytuł: Nadanie nazwy zestawowi fiszek  
Opis: Jako użytkownik chcę nazwać zestaw fiszek, aby później łatwo go odnaleźć.  
Kryteria akceptacji:  
- Zestaw musi mieć unikalną nazwę.  
- Próba użycia istniejącej nazwy powoduje komunikat błędu.

US-006  
Tytuł: Przegląd i usuwanie zestawów  
Opis: Jako użytkownik chcę przeglądać listę zestawów i usuwać dowolny z nich.  
Kryteria akceptacji:  
- Lista zestawów jest dostępna na stronie głównej.  
- Zestawy wymagające powtórki dziś są sortowane na górze.  
- Każdy zestaw posiada opcję Usuń zestaw.

US-007  
Tytuł: Powtarzanie fiszek  
Opis: Jako użytkownik chcę móc rozpocząć powtórkę zestawu, aby ćwiczyć pamięć.  
Kryteria akceptacji:  
- Fiszki pojawiają się losowo.  
- Użytkownik oznacza każdą fiszkę jako Znam lub Nie znam.  
- Fiszki Znam znikają z sesji.

## 6. Metryki sukcesu

- W trakcie pojedynczej sesji generowania co najmniej 75% fiszek zostaje zaakceptowanych.
- 75% wszystkich tworzonych fiszek pochodzi z generowania AI, a nie ręcznego tworzenia.
- Użytkownik powraca do aplikacji co najmniej 3 razy w tygodniu (metryka retencji – do zdefiniowania na etapie analityki).
- Maksymalny czas do wygenerowania fiszek z tekstu ≤ 10 sekund dla tekstów do 10000 słów.

