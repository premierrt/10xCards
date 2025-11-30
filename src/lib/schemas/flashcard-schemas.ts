import { z } from "zod";

/**
 * Validation schema for generating flashcards from text input
 * Validates request body for POST /api/flashcards/generate
 */
export const generateFlashcardsSchema = z.object({
  text: z
    .string()
    .min(1, "Text content is required")
    .max(10000, "Text content must not exceed 10,000 characters")
    .transform((text) => text.trim()),
  count: z
    .number()
    .int("Count must be an integer")
    .min(1, "Count must be at least 1")
    .max(50, "Count cannot exceed 50 flashcards"),
});

/**
 * Type inference for the validated request
 */
export type GenerateFlashcardsValidated = z.infer<typeof generateFlashcardsSchema>;

/**
 * Schema for validating AI-generated flashcard response
 * Ensures the AI service returns properly formatted flashcards
 */
export const aiGeneratedFlashcardSchema = z.object({
  question: z.string().min(1, "Question cannot be empty").max(500, "Question too long"),
  answer: z.string().min(1, "Answer cannot be empty").max(1000, "Answer too long"),
});

/**
 * Schema for validating array of AI-generated flashcards
 */
export const aiGeneratedFlashcardsArraySchema = z
  .array(aiGeneratedFlashcardSchema)
  .min(1, "At least one flashcard must be generated")
  .max(50, "Too many flashcards generated");

/**
 * Type inference for AI-generated flashcard
 */
export type AIGeneratedFlashcard = z.infer<typeof aiGeneratedFlashcardSchema>;

/**
 * Validation schema for creating flashcard sets
 * Validates request body for POST /api/flashcard-sets
 */
export const createFlashcardSetSchema = z.object({
  user_id: z.string().uuid("User ID must be a valid UUID"),
  name: z
    .string()
    .min(1, "Set name is required")
    .max(100, "Set name must not exceed 100 characters")
    .transform((name) => name.trim()),
  flashcard_ids: z
    .array(z.number().int("Flashcard ID must be an integer").positive("Flashcard ID must be positive"))
    .min(1, "At least one flashcard is required")
    .max(100, "Cannot add more than 100 flashcards to a set"),
});

/**
 * Type inference for the validated flashcard set creation request
 */
export type CreateFlashcardSetValidated = z.infer<typeof createFlashcardSetSchema>;
