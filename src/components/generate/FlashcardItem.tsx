import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import type { FlashcardWithStatus } from "@/types/generate.types";

interface FlashcardItemProps {
  flashcard: FlashcardWithStatus;
  onToggle: () => void;
}

export function FlashcardItem({ flashcard, onToggle }: FlashcardItemProps) {
  return (
    <Card
      className={`transition-all duration-200 ${flashcard.isAccepted ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id={`flashcard-${flashcard.flashcard_id}`}
            checked={flashcard.isAccepted}
            onCheckedChange={onToggle}
            className="mt-1"
          />
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Pytanie:</h4>
              <p className="text-gray-700 leading-relaxed">{flashcard.question}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Odpowiedź:</h4>
              <p className="text-gray-700 leading-relaxed">{flashcard.answer}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
