import type { APIRoute } from "astro";
import { z } from "zod";
import type {
  UpdateFlashcardRequest,
  UpdateFlashcardResponse,
  DeleteFlashcardResponse,
  ApiErrorResponse,
} from "../../../types";

import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { updateFlashcardSchema, flashcardIdSchema } from "../../../lib/schemas/flashcard-schemas";

export const prerender = false;

// ============================================================================
// PATCH /api/flashcards/{flashcard_id} - Update single flashcard
// ============================================================================

export const PATCH: APIRoute = async ({ request, locals, params }) => {
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
            message: "Authentication required to update flashcard",
            statusCode: 401,
          } as ApiErrorResponse),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Validate flashcard_id parameter
    let flashcardId: number;
    try {
      flashcardId = flashcardIdSchema.parse(params.flashcard_id);
    } catch (_error) {
      return new Response(
        JSON.stringify({
          error: "VALIDATION_ERROR",
          message: "Invalid flashcard ID. Must be a positive integer.",
          statusCode: 400,
        } as ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    let updateData: UpdateFlashcardRequest;
    try {
      const rawBody = await request.json();
      updateData = updateFlashcardSchema.parse(rawBody);
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

    try {
      // First, check if flashcard exists
      const { data: existingFlashcard, error: fetchError } = await supabase
        .from("flashcards")
        .select("flashcard_id")
        .eq("flashcard_id", flashcardId)
        .single();

      if (fetchError || !existingFlashcard) {
        return new Response(
          JSON.stringify({
            error: "NOT_FOUND",
            message: `Flashcard with ID ${flashcardId} not found`,
            statusCode: 404,
          } as ApiErrorResponse),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Update the flashcard
      const { data: updatedFlashcard, error: updateError } = await supabase
        .from("flashcards")
        .update(updateData)
        .eq("flashcard_id", flashcardId)
        .select("flashcard_id, question, answer, status")
        .single();

      if (updateError) {
        throw new Error(`Failed to update flashcard: ${updateError.message}`);
      }

      if (!updatedFlashcard) {
        throw new Error("Update operation did not return updated data");
      }

      // Prepare response
      const response: UpdateFlashcardResponse = {
        flashcard_id: updatedFlashcard.flashcard_id,
        question: updatedFlashcard.question,
        answer: updatedFlashcard.answer,
        status: updatedFlashcard.status,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Database error while updating flashcard:", error);

      return new Response(
        JSON.stringify({
          error: "DATABASE_ERROR",
          message: "Failed to update flashcard in database",
          statusCode: 500,
        } as ApiErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Unhandled error in PATCH /api/flashcards/[flashcard_id]:", error);

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

// ============================================================================
// DELETE /api/flashcards/{flashcard_id} - Delete single flashcard
// ============================================================================

export const DELETE: APIRoute = async ({ locals, params }) => {
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
            message: "Authentication required to delete flashcard",
            statusCode: 401,
          } as ApiErrorResponse),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Validate flashcard_id parameter
    let flashcardId: number;
    try {
      flashcardId = flashcardIdSchema.parse(params.flashcard_id);
    } catch (_error) {
      return new Response(
        JSON.stringify({
          error: "VALIDATION_ERROR",
          message: "Invalid flashcard ID. Must be a positive integer.",
          statusCode: 400,
        } as ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    try {
      // First, check if flashcard exists
      const { data: existingFlashcard, error: fetchError } = await supabase
        .from("flashcards")
        .select("flashcard_id")
        .eq("flashcard_id", flashcardId)
        .single();

      if (fetchError || !existingFlashcard) {
        return new Response(
          JSON.stringify({
            error: "NOT_FOUND",
            message: `Flashcard with ID ${flashcardId} not found`,
            statusCode: 404,
          } as ApiErrorResponse),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Delete the flashcard
      const { error: deleteError } = await supabase.from("flashcards").delete().eq("flashcard_id", flashcardId);

      if (deleteError) {
        throw new Error(`Failed to delete flashcard: ${deleteError.message}`);
      }

      const response: DeleteFlashcardResponse = {
        message: "Flashcard deleted successfully.",
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Database error while deleting flashcard:", error);

      return new Response(
        JSON.stringify({
          error: "DATABASE_ERROR",
          message: "Failed to delete flashcard from database",
          statusCode: 500,
        } as ApiErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Unhandled error in DELETE /api/flashcards/[flashcard_id]:", error);

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
