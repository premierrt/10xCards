import type { GeneratedFlashcard } from "@/types";

// Stan widoku
export type ViewState = "input" | "review";

// Rozszerzona fiszka ze statusem akceptacji
export interface FlashcardWithStatus extends GeneratedFlashcard {
  isAccepted: boolean;
}

// Dane formularza generowania
export interface GenerateFormData {
  text: string;
  count: number;
}

// Stan licznika słów
export interface TextInputValue {
  text: string;
  wordCount: number;
}

// Stan przeglądu fiszek
export interface ReviewState {
  flashcards: FlashcardWithStatus[];
  setName: string;
  isNameValid: boolean;
  nameError?: string;
}

// Błąd walidacji
export interface ValidationError {
  field: string;
  message: string;
}

// Stan generowania
export interface GenerationState {
  isLoading: boolean;
  error?: string;
  timeoutError: boolean;
}
