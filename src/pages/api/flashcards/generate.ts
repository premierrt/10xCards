import type { APIRoute } from "astro";
import { z } from "zod";
import type {
  GenerateFlashcardsRequest,
  GenerateFlashcardsResponse,
  GeneratedFlashcard,
  ApiErrorResponse,
} from "../../../types";
import type { SupabaseClient } from "../../../db/supabase.client";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { generateFlashcardsSchema } from "../../../lib/schemas/flashcard-schemas";
import {
  flashcardService,
  getFlashcardService,
  FlashcardGenerationError,
} from "../../../lib/services/flashcard-generation-factory.service";

export const prerender = false;

/**
 * POST /api/flashcards/generate
 * Generates flashcards from input text using AI models via OpenRouter.ai
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Authentication check - verify user is authenticated
    const supabase = locals.supabase;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Determine if running in development mode
    const isDevelopment = import.meta.env.NODE_ENV === "development" || import.meta.env.DEV;

    // Use the authenticated user's ID when available; otherwise fall back to DEFAULT_USER_ID in development.
    let userId: string | undefined = user?.id;

    if (authError || !userId) {
      if (isDevelopment) {
        console.warn("No authenticated user found — falling back to DEFAULT_USER_ID for development");
        userId = DEFAULT_USER_ID;
      } else {
        return new Response(
          JSON.stringify({
            error: "UNAUTHORIZED",
            message: "Authentication required to generate flashcards",
            statusCode: 401,
          } as ApiErrorResponse),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Parse and validate request body
    let requestBody: GenerateFlashcardsRequest;
    try {
      const rawBody = await request.json();
      requestBody = generateFlashcardsSchema.parse(rawBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "VALIDATION_ERROR",
            message: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
            statusCode: 400,
          } as ApiErrorResponse),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "INVALID_REQUEST",
          message: "Invalid JSON format in request body",
          statusCode: 400,
        } as ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { text, count } = requestBody;

    // TODO: Implement rate limiting check here
    // Rate limiting will be implemented in next steps

    // Generate flashcards using AI service (real or mock)
    // Check for mock override in query params or headers for testing
    const url = new URL(request.url);
    const forceMock = url.searchParams.get("mock") === "true" || request.headers.get("X-Use-Mock") === "true";

    // In development, default to mock unless explicitly disabled
    const shouldUseMock = forceMock || (isDevelopment && url.searchParams.get("mock") !== "false");

    const serviceToUse = shouldUseMock ? getFlashcardService(true) : flashcardService;

    console.log("🗣️ API using service:", shouldUseMock ? "MOCK" : "REAL");

    let aiGeneratedFlashcards;
    try {
      aiGeneratedFlashcards = await serviceToUse.generateFlashcards(text, count);
    } catch (error) {
      if (error instanceof FlashcardGenerationError) {
        return new Response(
          JSON.stringify({
            error: "GENERATION_ERROR",
            message: error.message,
            statusCode: error.statusCode,
          } as ApiErrorResponse),
          {
            status: error.statusCode,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Log unexpected errors for debugging
      console.error("Unexpected error in flashcard generation:", error);

      return new Response(
        JSON.stringify({
          error: "INTERNAL_ERROR",
          message: "An unexpected error occurred while generating flashcards",
          statusCode: 500,
        } as ApiErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Save generated flashcards to database
    let savedFlashcards: GeneratedFlashcard[];
    try {
      savedFlashcards = await saveFlashcardsToDatabase(supabase, aiGeneratedFlashcards);
    } catch (error) {
      console.error("Database error while saving flashcards:", error);

      return new Response(
        JSON.stringify({
          error: "DATABASE_ERROR",
          message: "Failed to save generated flashcards to database",
          statusCode: 500,
        } as ApiErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return successful response
    const response: GenerateFlashcardsResponse = savedFlashcards;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Catch-all error handler for unexpected errors
    console.error("Unhandled error in generate flashcards endpoint:", error);

    return new Response(
      JSON.stringify({
        error: "INTERNAL_ERROR",
        message: "An unexpected server error occurred",
        statusCode: 500,
      } as ApiErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * Helper function to save generated flashcards to the database
 * @param supabase - Supabase client instance
 * @param flashcards - Array of AI-generated flashcards to save
 * @returns Array of saved flashcards with database IDs
 */
async function saveFlashcardsToDatabase(
  supabase: SupabaseClient,
  flashcards: { question: string; answer: string }[]
): Promise<GeneratedFlashcard[]> {
  // Prepare flashcards for database insertion
  const flashcardsToInsert = flashcards.map((card) => ({
    question: card.question,
    answer: card.answer,
    status: "generated" as const,
  }));

  // Insert flashcards into database using batch operation
  const { data, error } = await supabase
    .from("flashcards")
    .insert(flashcardsToInsert)
    .select("flashcard_id, question, answer");

  if (error) {
    throw new Error(`Database insertion failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("No flashcards were saved to database");
  }

  // Transform database response to match API response format
  return data.map((card) => ({
    flashcard_id: card.flashcard_id,
    question: card.question,
    answer: card.answer,
  }));
}
