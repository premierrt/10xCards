import { Button } from "@/components/ui/button";
import { Save, RotateCcw, Loader2 } from "lucide-react";

interface ActionButtonsProps {
  onSave: () => void;
  onRegenerate: () => void;
  canSave: boolean;
  isSaving?: boolean;
  acceptedCount: number;
}

export function ActionButtons({ onSave, onRegenerate, canSave, isSaving = false, acceptedCount }: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-6">
      <Button onClick={onSave} disabled={!canSave || isSaving} className="flex items-center gap-2">
        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {isSaving ? "Zapisuję..." : `Zapisz zaakceptowane (${acceptedCount})`}
      </Button>

      <Button variant="outline" onClick={onRegenerate} disabled={isSaving} className="flex items-center gap-2">
        <RotateCcw size={16} />
        Wygeneruj ponownie
      </Button>

      {!canSave && acceptedCount === 0 && (
        <p className="text-sm text-red-600 mt-2">Zaakceptuj przynajmniej jedną fiszkę</p>
      )}
    </div>
  );
}
