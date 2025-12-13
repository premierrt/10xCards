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
    const trimmedText = text.trim();
    const wordCount = trimmedText.split(/\s+/).filter((word) => word.length > 0).length;

    console.log("📊 [FORM VALIDATION] Text analysis:", {
      originalLength: text.length,
      trimmedLength: trimmedText.length,
      wordCount: wordCount,
      firstWords: trimmedText.split(/\s+/).slice(0, 10).join(" ") + "...",
    });

    if (wordCount < 1000) {
      const errorMsg = "Tekst musi zawierać minimum 1000 słów";
      console.warn("⚠️ [FORM VALIDATION] Validation failed:", errorMsg, { wordCount });
      return errorMsg;
    }
    if (wordCount > 10000) {
      const errorMsg = "Tekst nie może przekraczać 10000 słów";
      console.warn("⚠️ [FORM VALIDATION] Validation failed:", errorMsg, { wordCount });
      return errorMsg;
    }

    console.log("✅ [FORM VALIDATION] Text validation passed");
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

    console.log("🚀 [FORM SUBMIT] Form submission started:", {
      textLength: formData.text.length,
      count: formData.count,
      hasText: !!formData.text.trim(),
    });

    const textValidationError = validateText(formData.text);
    if (textValidationError) {
      console.error("❌ [FORM SUBMIT] Form validation failed:", textValidationError);
      setTextError(textValidationError);
      return;
    }

    console.log("✅ [FORM SUBMIT] Form validation passed, calling onGenerate...");

    try {
      await onGenerate(formData.text, formData.count);
      console.log("✅ [FORM SUBMIT] onGenerate completed successfully");
    } catch (error) {
      console.error("❌ [FORM SUBMIT] onGenerate failed:", error);
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
