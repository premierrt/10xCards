import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit, Save, X, Loader2 } from "lucide-react";
import type { FlashcardWithStatus } from "@/types/generate.types";

interface FlashcardItemProps {
  flashcard: FlashcardWithStatus;
  onToggle: () => void;
  onUpdate?: (flashcardId: number, question: string, answer: string) => void;
}

export function FlashcardItem({ flashcard, onToggle, onUpdate }: FlashcardItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(flashcard.question);
  const [editedAnswer, setEditedAnswer] = useState(flashcard.answer);
  const [error, setError] = useState<string>("");

  const handleEdit = () => {
    setIsEditing(true);
    setEditedQuestion(flashcard.question);
    setEditedAnswer(flashcard.answer);
    setError("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedQuestion(flashcard.question);
    setEditedAnswer(flashcard.answer);
    setError("");
  };

  const handleSave = async () => {
    if (!editedQuestion.trim() || !editedAnswer.trim()) {
      setError("Pytanie i odpowiedź nie mogą być puste");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/flashcards/${flashcard.flashcard_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: editedQuestion.trim(),
          answer: editedAnswer.trim(),
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Fiszka nie została znaleziona");
        } else if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Nieprawidłowe dane");
        } else if (response.status === 401) {
          window.location.href = "/login";
          return;
        } else {
          throw new Error("Błąd podczas zapisywania zmian");
        }
      }

      const updatedFlashcard = await response.json();

      // Notify parent component about the update
      if (onUpdate) {
        onUpdate(flashcard.flashcard_id, updatedFlashcard.question, updatedFlashcard.answer);
      }

      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <Card
      className={`transition-all duration-200 ${
        flashcard.isAccepted ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
      } ${isEditing ? "border-blue-200 bg-blue-50" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id={`flashcard-${flashcard.flashcard_id}`}
            checked={flashcard.isAccepted}
            onCheckedChange={onToggle}
            className="mt-1 flex-shrink-0"
            disabled={isEditing}
          />
          <div className="flex-1 space-y-3">
            {isEditing ? (
              // Edit mode
              <>
                <div className="space-y-2">
                  <Label htmlFor={`question-${flashcard.flashcard_id}`} className="text-sm font-medium">
                    Pytanie:
                  </Label>
                  <Textarea
                    id={`question-${flashcard.flashcard_id}`}
                    value={editedQuestion}
                    onChange={(e) => setEditedQuestion(e.target.value)}
                    className="min-h-[80px] resize-none"
                    placeholder="Wprowadź pytanie..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`answer-${flashcard.flashcard_id}`} className="text-sm font-medium">
                    Odpowiedź:
                  </Label>
                  <Textarea
                    id={`answer-${flashcard.flashcard_id}`}
                    value={editedAnswer}
                    onChange={(e) => setEditedAnswer(e.target.value)}
                    className="min-h-[80px] resize-none"
                    placeholder="Wprowadź odpowiedź..."
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={isSaving} size="sm" className="flex items-center gap-2">
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {isSaving ? "Zapisuję..." : "Zapisz"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={isSaving}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <X size={14} />
                    Anuluj
                  </Button>
                </div>
              </>
            ) : (
              // View mode
              <>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Pytanie:</h4>
                  <p className="text-gray-700 leading-relaxed">{flashcard.question}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Odpowiedź:</h4>
                  <p className="text-gray-700 leading-relaxed">{flashcard.answer}</p>
                </div>
              </>
            )}
          </div>
          {!isEditing && (
            <Button
              onClick={handleEdit}
              variant="ghost"
              size="sm"
              className="flex-shrink-0 h-8 w-8 p-0"
              title="Edytuj fiszkę"
            >
              <Edit size={14} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
