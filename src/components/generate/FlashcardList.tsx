import { FlashcardItem } from "./FlashcardItem";
import type { FlashcardWithStatus } from "@/types/generate.types";

interface FlashcardListProps {
  flashcards: FlashcardWithStatus[];
  onToggle: (id: number) => void;
}

export function FlashcardList({ flashcards, onToggle }: FlashcardListProps) {
  if (flashcards.length === 0) {
    return <div className="text-center py-8 text-gray-500">Brak wygenerowanych fiszek</div>;
  }

  return (
    <div className="space-y-4">
      {flashcards.map((flashcard) => (
        <FlashcardItem
          key={flashcard.flashcard_id}
          flashcard={flashcard}
          onToggle={() => onToggle(flashcard.flashcard_id)}
        />
      ))}
    </div>
  );
}
