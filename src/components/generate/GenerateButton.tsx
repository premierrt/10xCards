import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface GenerateButtonProps {
  isLoading: boolean;
  disabled: boolean;
}

export function GenerateButton({ isLoading, disabled }: GenerateButtonProps) {
  return (
    <Button type="submit" disabled={disabled} className="w-full sm:w-auto">
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {isLoading ? "Generuję fiszki..." : "Wygeneruj fiszki"}
    </Button>
  );
}
