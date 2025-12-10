import { useFlashcardGenerator } from "../hooks/useFlashcardGenerator";
import { BackButton } from "./BackButton";
import { GenerateForm } from "./GenerateForm";
import { FlashcardReview } from "./FlashcardReview";

export function GenerateView() {
  const {
    viewState,
    generatedFlashcards,
    generation,
    reset,
    setViewState,
    generateFlashcards,
    formData,
    setName,
    nameError,
    setSetName,
    setNameError,
    toggleFlashcard,
    updateFlashcard,
    acceptAll,
    rejectAll,
    updateFlashcardStatuses,
    createFlashcardSet,
  } = useFlashcardGenerator();

  const handleGenerate = async (text: string, count: number) => {
    await generateFlashcards(text, count);
  };

  const handleSave = async () => {
    const acceptedFlashcards = generatedFlashcards.filter((f) => f.isAccepted);

    if (acceptedFlashcards.length === 0) {
      return;
    }

    if (!setName.trim()) {
      setNameError("Nazwa zestawu jest wymagana");
      return;
    }

    if (nameError) {
      return;
    }

    try {
      // Update flashcard statuses
      const flashcardIds = acceptedFlashcards.map((f) => f.flashcard_id);

      await updateFlashcardStatuses(flashcardIds);

      // Create flashcard set
      // Note: We need user_id from session/context
      const userId = "current-user-id"; // TODO: Get from auth context

      await createFlashcardSet(userId, setName, flashcardIds);

      // Reset to initial state after save
      reset();
      // Redirect to dashboard could be handled here
      window.location.href = "/dashboard";
    } catch (error) {
      // Error saving flashcard set
      console.error("Error saving flashcard set:", error);
      // TODO: Show error toast
    }
  };

  const handleRegenerate = () => {
    setViewState("input");
  };

  // Pass flashcards with status to the review component
  const flashcardsForReview = generatedFlashcards;

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton />

      {generation.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{generation.error}</p>
        </div>
      )}

      {viewState === "input" ? (
        <GenerateForm
          onGenerate={handleGenerate}
          isLoading={generation.isLoading}
          initialText={formData.text}
          initialCount={formData.count}
        />
      ) : (
        <FlashcardReview
          flashcards={flashcardsForReview}
          setName={setName}
          nameError={nameError}
          onSave={handleSave}
          onRegenerate={handleRegenerate}
          onToggleFlashcard={toggleFlashcard}
          onUpdateFlashcard={updateFlashcard}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onSetNameChange={setSetName}
          onNameErrorChange={setNameError}
        />
      )}
    </div>
  );
}
