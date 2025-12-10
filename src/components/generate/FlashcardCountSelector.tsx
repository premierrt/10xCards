import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FlashcardCountSelectorProps {
  value: number;
  onChange: (count: number) => void;
}

export function FlashcardCountSelector({ value, onChange }: FlashcardCountSelectorProps) {
  const options = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <div className="space-y-2">
      <Label htmlFor="flashcard-count">Liczba fiszek do wygenerowania</Label>
      <Select value={value.toString()} onValueChange={(stringValue) => onChange(parseInt(stringValue, 10))}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((count) => (
            <SelectItem key={count} value={count.toString()}>
              {count} {count === 1 ? "fiszka" : count <= 4 ? "fiszki" : "fiszek"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
