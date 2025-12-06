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

/**
 * Schema for validating GET /api/flashcards query parameters
 */
export const getFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort_by: z.enum(["created_at", "question", "answer"]).default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Schema for validating PATCH /api/flashcards/{flashcard_id} request body
 */
export const updateFlashcardSchema = z
  .object({
    question: z.string().min(1, "Question cannot be empty").max(500, "Question too long").optional(),
    answer: z.string().min(1, "Answer cannot be empty").max(1000, "Answer too long").optional(),
    status: z.string().min(1, "Status cannot be empty").max(50, "Status too long").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided for update" });

/**
 * Schema for validating flashcard_id parameter
 */
export const flashcardIdSchema = z.coerce.number().int().positive("Flashcard ID must be a positive integer");

/**
 * Schema for validating PATCH /api/flashcards/bulk request body
 */
export const bulkUpdateFlashcardsSchema = z.object({
  flashcard_ids: z
    .array(z.number().int().positive())
    .min(1, "At least one flashcard ID required")
    .max(100, "Cannot update more than 100 flashcards at once"),
  updates: z
    .object({
      question: z.string().min(1, "Question cannot be empty").max(500, "Question too long").optional(),
      answer: z.string().min(1, "Answer cannot be empty").max(1000, "Answer too long").optional(),
      status: z.string().min(1, "Status cannot be empty").max(50, "Status too long").optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided in updates" }),
});

/**
 * Schema for validating bulk delete request body
 */
export const bulkDeleteFlashcardsSchema = z.object({
  flashcard_ids: z
    .array(z.number().int().positive())
    .min(1, "At least one flashcard ID required")
    .max(100, "Cannot delete more than 100 flashcards at once"),
});

/**
 * Type inference for the validated query parameters
 */
export type GetFlashcardsQueryValidated = z.infer<typeof getFlashcardsQuerySchema>;

/**
 * Type inference for the validated update request
 */
export type UpdateFlashcardValidated = z.infer<typeof updateFlashcardSchema>;

/**
 * Type inference for the validated bulk update request
 */
export type BulkUpdateFlashcardsValidated = z.infer<typeof bulkUpdateFlashcardsSchema>;

/**
 * Type inference for the validated bulk delete request
 */
export type BulkDeleteFlashcardsValidated = z.infer<typeof bulkDeleteFlashcardsSchema>;

/**
 * Schema for validating GET /api/flashcard-sets query parameters
 */
export const getFlashcardSetsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  include_flashcards: z.coerce.boolean().default(true),
});

/**
 * Schema for validating GET /api/flashcard-sets/{set_id} query parameters
 */
export const getSingleFlashcardSetQuerySchema = z.object({
  include_flashcard_details: z.coerce.boolean().default(false),
});

/**
 * Schema for validating set_id parameter
 */
export const setIdSchema = z.coerce.number().int().positive("Set ID must be a positive integer");

/**
 * Type inference for the validated flashcard sets list query
 */
export type GetFlashcardSetsQueryValidated = z.infer<typeof getFlashcardSetsQuerySchema>;

/**
 * Type inference for the validated single flashcard set query
 */
export type GetSingleFlashcardSetQueryValidated = z.infer<typeof getSingleFlashcardSetQuerySchema>;
