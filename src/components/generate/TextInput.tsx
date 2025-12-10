import { useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
}

export function TextInput({ value, onChange, onBlur, error }: TextInputProps) {
  const wordCount = useMemo(() => {
    return value
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }, [value]);

  const getWordCountColor = () => {
    if (wordCount < 1000) return "text-red-600";
    if (wordCount > 10000) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="source-text">Tekst źródłowy *</Label>
      <Textarea
        id="source-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Wklej tutaj tekst, z którego mają zostać wygenerowane fiszki..."
        className={`min-h-[400px] resize-none ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
      />
      <div className="flex justify-between items-center">
        <span className={`text-sm ${getWordCountColor()}`}>{wordCount}/10000 słów</span>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}
