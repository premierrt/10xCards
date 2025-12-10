import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TextInput } from "./TextInput";
import { FlashcardCountSelector } from "./FlashcardCountSelector";
import { GenerateButton } from "./GenerateButton";

interface GenerateFormData {
  text: string;
  count: number;
}

interface GenerateFormProps {
  onGenerate: (text: string, count: number) => Promise<void>;
  isLoading?: boolean;
  initialText?: string;
  initialCount?: number;
}

export function GenerateForm({ onGenerate, isLoading = false, initialText = "", initialCount = 5 }: GenerateFormProps) {
  const [formData, setFormData] = useState<GenerateFormData>({
    text: initialText,
    count: initialCount,
  });
  const [textError, setTextError] = useState<string>("");

  const validateText = (text: string): string => {
    const wordCount = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    if (wordCount < 1000) {
      return "Tekst musi zawierać minimum 1000 słów";
    }
    if (wordCount > 10000) {
      return "Tekst nie może przekraczać 10000 słów";
    }
    return "";
  };

  const handleTextChange = (text: string) => {
    setFormData((prev) => ({ ...prev, text }));
    if (textError) {
      setTextError("");
    }
  };

  const handleTextBlur = () => {
    const error = validateText(formData.text);
    setTextError(error);
  };

  const handleCountChange = (count: number) => {
    setFormData((prev) => ({ ...prev, count }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const textValidationError = validateText(formData.text);
    if (textValidationError) {
      setTextError(textValidationError);
      return;
    }

    try {
      await onGenerate(formData.text, formData.count);
    } catch (error) {
      // Error handling is now done in the hook
      // Form submission error
    }
  };

  const isFormValid = formData.text.trim().length > 0 && !textError;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Generator fiszek</CardTitle>
        <CardDescription>
          Wklej tekst źródłowy, a my automatycznie wygenerujemy fiszki w formacie pytanie-odpowiedź
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <TextInput value={formData.text} onChange={handleTextChange} onBlur={handleTextBlur} error={textError} />

          <FlashcardCountSelector value={formData.count} onChange={handleCountChange} />

          <p className="text-sm text-gray-600">
            💡 Optymalna długość tekstu to 2000-5000 słów dla najlepszych rezultatów
          </p>

          <GenerateButton isLoading={isLoading} disabled={!isFormValid || isLoading} />
        </form>
      </CardContent>
    </Card>
  );
}
