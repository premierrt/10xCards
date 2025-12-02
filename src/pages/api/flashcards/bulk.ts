import type { APIRoute } from "astro";
import { z } from "zod";
import type { UpdateFlashcardRequest, BulkFlashcardOperationResponse, ApiErrorResponse } from "../../../types";

import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { bulkUpdateFlashcardsSchema } from "../../../lib/schemas/flashcard-schemas";

export const prerender = false;

// ============================================================================
// PATCH /api/flashcards/bulk - Bulk update flashcards
// ============================================================================

export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    // Authentication check
    const supabase = locals.supabase;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const isDevelopment = import.meta.env.NODE_ENV === "development" || import.meta.env.DEV;
    let userId: string | undefined = user?.id;

    if (authError || !userId) {
      if (isDevelopment) {
        console.warn("No authenticated user found — using DEFAULT_USER_ID for development");
        userId = DEFAULT_USER_ID;
      } else {
        return new Response(
          JSON.stringify({
            error: "UNAUTHORIZED",
            message: "Authentication required to update flashcards",
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
    let requestBody: { flashcard_ids: number[]; updates: UpdateFlashcardRequest };
    try {
      const rawBody = await request.json();
      requestBody = bulkUpdateFlashcardsSchema.parse(rawBody);
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

    const { flashcard_ids, updates } = requestBody;

    try {
      // First, check which flashcards exist
      const { data: existingFlashcards, error: fetchError } = await supabase
        .from("flashcards")
        .select("flashcard_id")
        .in("flashcard_id", flashcard_ids);

      if (fetchError) {
        throw new Error(`Failed to fetch existing flashcards: ${fetchError.message}`);
      }

      const existingIds = existingFlashcards?.map((f) => f.flashcard_id) || [];
      const notFoundIds = flashcard_ids.filter((id) => !existingIds.includes(id));

      // Update existing flashcards
      let updatedCount = 0;
      if (existingIds.length > 0) {
        const { error: updateError } = await supabase
          .from("flashcards")
          .update(updates)
          .in("flashcard_id", existingIds);

        if (updateError) {
          throw new Error(`Failed to update flashcards: ${updateError.message}`);
        }

        updatedCount = existingIds.length;
      }

      // Prepare detailed results
      const results = flashcard_ids.map((id) => ({
        flashcard_id: id,
        status: existingIds.includes(id) ? ("updated" as const) : ("not_found" as const),
      }));

      const response: BulkFlashcardOperationResponse = {
        updated_count: updatedCount,
        failed_count: notFoundIds.length,
        results,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Database error while bulk updating flashcards:", error);

      return new Response(
        JSON.stringify({
          error: "DATABASE_ERROR",
          message: "Failed to update flashcards in database",
          statusCode: 500,
        } as ApiErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Unhandled error in PATCH /api/flashcards/bulk:", error);

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
