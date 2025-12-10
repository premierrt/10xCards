import { Button } from "@/components/ui/button";
import { CheckCheck, X } from "lucide-react";

interface BulkActionsProps {
  onAcceptAll: () => void;
  onRejectAll: () => void;
}

export function BulkActions({ onAcceptAll, onRejectAll }: BulkActionsProps) {
  return (
    <div className="flex gap-2 mb-4">
      <Button variant="outline" size="sm" onClick={onAcceptAll} className="flex items-center gap-2">
        <CheckCheck size={16} />
        Zaakceptuj wszystkie
      </Button>
      <Button variant="outline" size="sm" onClick={onRejectAll} className="flex items-center gap-2">
        <X size={16} />
        Odrzuć wszystkie
      </Button>
    </div>
  );
}
