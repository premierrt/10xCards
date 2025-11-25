import type { Tables, TablesUpdate } from "./db/database.types";

// ============================================================================
// Base Entity Types (derived from database models)
// ============================================================================

export type Flashcard = Tables<"flashcards">;
export type FlashcardSet = Tables<"flashcard_sets">;
export type FlashcardSetFlashcard = Tables<"flashcard_set_flashcards">;

// ============================================================================
// Flashcard Generation DTOs
// ============================================================================

/**
 * Request DTO for generating flashcards from input text
 * POST /api/flashcards/generate
 */
export interface GenerateFlashcardsRequest {
  text: string;
  count: number;
}

/**
 * Response DTO for generated flashcard (subset of full flashcard entity)
 */
export interface GeneratedFlashcard {
  flashcard_id: number;
  question: string;
  answer: string;
}

/**
 * Response DTO for flashcard generation endpoint
 * Returns array of generated flashcards
 */
export type GenerateFlashcardsResponse = GeneratedFlashcard[];

// ============================================================================
// Flashcard Query and List DTOs
// ============================================================================

/**
 * Query parameters for retrieving flashcards list
 * GET /api/flashcards
 */
export interface GetFlashcardsQuery {
  page?: number;
  limit?: number;
  sort_by?: "created_at" | "question" | "answer";
  sort_order?: "asc" | "desc";
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Response DTO for flashcards list endpoint
 * GET /api/flashcards
 */
export interface GetFlashcardsResponse {
  flashcards: Flashcard[];
  pagination: PaginationInfo;
}

// ============================================================================
// Flashcard Update DTOs
// ============================================================================

/**
 * Request DTO for partial flashcard updates
 * PATCH /api/flashcards/{flashcard_id}
 * Allows updating any combination of question, answer, or status
 */
export type UpdateFlashcardRequest = Partial<Pick<TablesUpdate<"flashcards">, "question" | "answer" | "status">>;

/**
 * Response DTO for flashcard update operation
 * Returns the updated flashcard with selected fields
 */
export type UpdateFlashcardResponse = Pick<Flashcard, "flashcard_id" | "question" | "answer" | "status">;

// ============================================================================
// Flashcard Set DTOs
// ============================================================================

/**
 * Request DTO for creating a new flashcard set
 * POST /api/flashcard-sets
 */
export interface CreateFlashcardSetRequest {
  user_id: string;
  name: string;
}

/**
 * Response DTO for flashcard set creation
 * Returns minimal set information after successful creation
 */
export interface CreateFlashcardSetResponse {
  set_id: number;
  created_at: string;
}

/**
 * Response DTO for flashcard set deletion
 * DELETE /api/flashcard-sets/{set_id}
 */
export interface DeleteFlashcardSetResponse {
  message: string;
}

// ============================================================================
// Common Response Types
// ============================================================================

/**
 * Standard error response structure for API endpoints
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

/**
 * Generic success response wrapper for operations that don't return specific data
 */
export interface ApiSuccessResponse {
  success: boolean;
  message?: string;
}
