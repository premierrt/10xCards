import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FlashcardWithStatus } from "@/types/generate.types";

import { FlashcardList } from "./FlashcardList";
import { BulkActions } from "./BulkActions";
import { SetNameInput } from "./SetNameInput";
import { ActionButtons } from "./ActionButtons";

interface FlashcardReviewProps {
  flashcards: FlashcardWithStatus[];
  setName: string;
  nameError: string;
  onSave: () => void;
  onRegenerate: () => void;
  onToggleFlashcard: (id: number) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSetNameChange: (name: string) => void;
  onNameErrorChange: (error: string) => void;
}

export function FlashcardReview({
  flashcards,
  setName,
  nameError,
  onSave,
  onRegenerate,
  onToggleFlashcard,
  onAcceptAll,
  onRejectAll,
  onSetNameChange,
  onNameErrorChange,
}: FlashcardReviewProps) {
  const [isSaving, setIsSaving] = useState(false);

  const acceptedFlashcards = flashcards.filter((f) => f.isAccepted);
  const acceptedCount = acceptedFlashcards.length;
  const canSave = setName.trim().length > 0 && acceptedCount > 0 && !nameError;

  const handleSave = async () => {
    if (acceptedCount === 0) {
      return;
    }

    if (!setName.trim()) {
      onNameErrorChange("Nazwa zestawu jest wymagana");
      return;
    }

    if (nameError) {
      return;
    }

    setIsSaving(true);
    onSave();
    setIsSaving(false);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Przegląd wygenerowanych fiszek</CardTitle>
        <CardDescription>
          Sprawdź wygenerowane fiszki i zaakceptuj te, które chcesz zapisać. Następnie nadaj nazwę swojemu zestawowi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <BulkActions onAcceptAll={onAcceptAll} onRejectAll={onRejectAll} />

        <FlashcardList flashcards={flashcards} onToggle={onToggleFlashcard} />

        <div className="border-t pt-6">
          <SetNameInput
            value={setName}
            onChange={onSetNameChange}
            error={nameError}
            onValidationChange={onNameErrorChange}
          />
        </div>

        <ActionButtons
          onSave={handleSave}
          onRegenerate={onRegenerate}
          canSave={canSave}
          isSaving={isSaving}
          acceptedCount={acceptedCount}
        />
      </CardContent>
    </Card>
  );
}
