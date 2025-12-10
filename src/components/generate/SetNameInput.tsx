import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { debounce } from "@/lib/utils";

interface SetNameInputProps {
  value: string;
  onChange: (name: string) => void;
  error?: string;
  onValidationChange: (error: string) => void;
}

export function SetNameInput({ value, onChange, error, onValidationChange }: SetNameInputProps) {
  const [isChecking, setIsChecking] = useState(false);

  const checkUniqueness = useCallback(
    debounce(async (name: string) => {
      if (!name.trim()) {
        onValidationChange("");
        setIsChecking(false);
        return;
      }

      setIsChecking(true);

      try {
        // Add required parameters for the endpoint
        const params = new URLSearchParams({
          page: "1",
          limit: "100", // Get more sets to check name collision
          include_flashcards: "false",
        });
        const response = await fetch(`/api/flashcard-sets?${params}`);

        if (response.ok) {
          const data = await response.json();
          // Check if any set has the same name (case-insensitive)
          const nameExists = data.sets && data.sets.some((set: any) => set.name.toLowerCase() === name.toLowerCase());
          if (nameExists) {
            onValidationChange("Zestaw o tej nazwie już istnieje");
          } else {
            onValidationChange("");
          }
        } else {
          onValidationChange("");
        }
      } catch (error) {
        // Error checking name uniqueness
        onValidationChange("");
      } finally {
        setIsChecking(false);
      }
    }, 500),
    [onValidationChange]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (!newValue.trim()) {
      onValidationChange("Nazwa zestawu jest wymagana");
    } else {
      onValidationChange("");
      checkUniqueness(newValue);
    }
  };

  const handleBlur = () => {
    if (!value.trim()) {
      onValidationChange("Nazwa zestawu jest wymagana");
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="set-name">Nazwa zestawu *</Label>
      <div className="relative">
        <Input
          id="set-name"
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Wprowadź nazwę zestawu..."
          className={`${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
        />
        {isChecking && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
          </div>
        )}
      </div>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
