import { useState, useCallback } from "react";
import type { GeneratedFlashcard, CreateFlashcardSetRequest } from "@/types";
import type { ViewState, FlashcardWithStatus, GenerateFormData, GenerationState } from "@/types/generate.types";

export function useFlashcardGenerator() {
  // Stan główny
  const [viewState, setViewState] = useState<ViewState>("input");
  const [formData, setFormData] = useState<GenerateFormData>({
    text: "",
    count: 5,
  });
  const [generatedFlashcards, setGeneratedFlashcards] = useState<FlashcardWithStatus[]>([]);
  const [setName, setSetName] = useState("");
  const [generation, setGeneration] = useState<GenerationState>({
    isLoading: false,
    timeoutError: false,
  });
  const [nameError, setNameError] = useState<string>("");

  // Generowanie fiszek
  const generateFlashcards = useCallback(async (text: string, count: number) => {
    // Update form data
    setFormData({ text, count });
    setGeneration({ isLoading: true, timeoutError: false, error: undefined });

    let timeoutId: number | undefined;

    try {
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, count }),
        signal: controller.signal,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const flashcards: GeneratedFlashcard[] = await response.json();
      const flashcardsWithStatus: FlashcardWithStatus[] = flashcards.map((flashcard) => ({
        ...flashcard,
        isAccepted: true, // Default to accepted
      }));

      setGeneratedFlashcards(flashcardsWithStatus);
      setViewState("review");
      setGeneration({ isLoading: false, timeoutError: false, error: undefined });
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        setGeneration({
          isLoading: false,
          timeoutError: true,
          error: "Generowanie fiszek trwa zbyt długo. Spróbuj ponownie z krótszym tekstem.",
        });
      } else if (error instanceof Error) {
        let errorMessage = error.message;

        // Handle common HTTP errors
        if (errorMessage.includes("400")) {
          errorMessage = "Dane wejściowe są nieprawidłowe. Sprawdź długość tekstu.";
        } else if (errorMessage.includes("500")) {
          errorMessage = "Wystąpił błąd serwera. Spróbuj ponownie za chwilę.";
        }

        setGeneration({
          isLoading: false,
          timeoutError: false,
          error: errorMessage,
        });
      } else {
        setGeneration({
          isLoading: false,
          timeoutError: false,
          error: "Wystąpił nieoczekiwany błąd",
        });
      }
    }
  }, []);

  // Aktualizacja statusów fiszek
  const updateFlashcardStatuses = useCallback(async (flashcardIds: number[]) => {
    const response = await fetch("/api/bulkflashcards", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        flashcard_ids: flashcardIds,
        updates: { status: "accepted" },
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Błąd aktualizacji statusów fiszek: ${response.status}`);
    }

    return await response.json();
  }, []);

  // Tworzenie zestawu fiszek
  const createFlashcardSet = useCallback(async (userId: string, name: string, flashcardIds: number[]) => {
    const createRequest: CreateFlashcardSetRequest = {
      user_id: userId,
      name: name,
      flashcard_ids: flashcardIds,
    };

    const response = await fetch("/api/flashcard-sets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createRequest),
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.message || `Błąd tworzenia zestawu: ${response.status}`;

      if (response.status === 409) {
        errorMessage = "Zestaw o tej nazwie już istnieje";
      }

      throw new Error(errorMessage);
    }

    return await response.json();
  }, []);

  // Sprawdzanie unikalności nazwy zestawu
  const checkSetNameUniqueness = useCallback(async (name: string): Promise<boolean> => {
    if (!name.trim()) {
      return false;
    }

    try {
      // Add required parameters for the endpoint
      const params = new URLSearchParams({
        page: "1",
        limit: "1",
        include_flashcards: "false",
      });
      const response = await fetch(`/api/flashcard-sets?${params}`);

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return false;
        }
        return true; // Assume unique if we can't check
      }

      const data = await response.json();
      // Check if any set has the same name (case-insensitive)
      const nameExists = data.sets.some((set: any) => set.name.toLowerCase() === name.toLowerCase());
      return !nameExists; // Return true if name is unique
    } catch (error) {
      // Network or parsing error - assume unique to avoid blocking user
      return true;
    }
  }, []);

  // Toggle single flashcard acceptance
  const toggleFlashcard = useCallback((flashcardId: number) => {
    setGeneratedFlashcards((prev) =>
      prev.map((flashcard) =>
        flashcard.flashcard_id === flashcardId ? { ...flashcard, isAccepted: !flashcard.isAccepted } : flashcard
      )
    );
  }, []);

  // Update flashcard content
  const updateFlashcard = useCallback((flashcardId: number, question: string, answer: string) => {
    setGeneratedFlashcards((prev) =>
      prev.map((flashcard) => (flashcard.flashcard_id === flashcardId ? { ...flashcard, question, answer } : flashcard))
    );
  }, []);

  // Accept all flashcards
  const acceptAll = useCallback(() => {
    setGeneratedFlashcards((prev) => prev.map((flashcard) => ({ ...flashcard, isAccepted: true })));
  }, []);

  // Reject all flashcards
  const rejectAll = useCallback(() => {
    setGeneratedFlashcards((prev) => prev.map((flashcard) => ({ ...flashcard, isAccepted: false })));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setViewState("input");
    setFormData({ text: "", count: 5 });
    setGeneratedFlashcards([]);
    setSetName("");
    setNameError("");
    setGeneration({ isLoading: false, timeoutError: false, error: undefined });
  }, []);

  // Computed values
  const acceptedFlashcards = generatedFlashcards.filter((f) => f.isAccepted);
  const canSave = setName.trim().length > 0 && acceptedFlashcards.length > 0 && !nameError;

  return {
    // State
    viewState,
    formData,
    generatedFlashcards,
    setName,
    generation,
    nameError,
    acceptedFlashcards,
    canSave,

    // Actions
    setFormData,
    setSetName,
    setNameError,
    generateFlashcards,
    updateFlashcardStatuses,
    createFlashcardSet,
    checkSetNameUniqueness,
    toggleFlashcard,
    updateFlashcard,
    acceptAll,
    rejectAll,
    reset,
    setViewState,
  };
}
