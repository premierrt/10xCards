import type { APIRoute } from "astro";
import { z } from "zod";
import type {
  GetFlashcardsResponse,
  BulkFlashcardOperationResponse,
  ApiErrorResponse,
  PaginationInfo,
} from "../../../types";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import {
  getFlashcardsQuerySchema,
  bulkDeleteFlashcardsSchema,
  type GetFlashcardsQueryValidated,
  type BulkDeleteFlashcardsValidated,
} from "../../../lib/schemas/flashcard-schemas";

export const prerender = false;

// ============================================================================
// GET /api/flashcards - List flashcards with pagination and sorting
// ============================================================================

export const GET: APIRoute = async ({ locals, url }) => {
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
        // eslint-disable-next-line no-console
        console.warn("No authenticated user found — using DEFAULT_USER_ID for development");
        userId = DEFAULT_USER_ID;
      } else {
        return new Response(
          JSON.stringify({
            error: "UNAUTHORIZED",
            message: "Authentication required to access flashcards",
            statusCode: 401,
          } as ApiErrorResponse),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Parse and validate query parameters
    let queryParams: GetFlashcardsQueryValidated;
    try {
      const searchParams = new URLSearchParams(url.search);
      const rawParams = {
        page: searchParams.get("page") || undefined,
        limit: searchParams.get("limit") || undefined,
        sort_by: searchParams.get("sort_by") || undefined,
        sort_order: searchParams.get("sort_order") || undefined,
      };

      queryParams = getFlashcardsQuerySchema.parse(rawParams);
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
          message: "Invalid query parameters",
          statusCode: 400,
        } as ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { page, limit, sort_by, sort_order } = queryParams;

    try {
      // Get total count for pagination
      const { count: totalCount, error: countError } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true });

      if (countError) {
        throw new Error(`Failed to get flashcards count: ${countError.message}`);
      }

      const total = totalCount || 0;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;

      // Fetch flashcards with pagination and sorting
      const { data: flashcards, error: flashcardsError } = await supabase
        .from("flashcards")
        .select("*")
        .order(sort_by, { ascending: sort_order === "asc" })
        .range(offset, offset + limit - 1);

      if (flashcardsError) {
        throw new Error(`Failed to fetch flashcards: ${flashcardsError.message}`);
      }

      // Prepare pagination info
      const pagination: PaginationInfo = {
        page,
        limit,
        total,
        total_pages: totalPages,
      };

      // Prepare response
      const response: GetFlashcardsResponse = {
        flashcards: flashcards || [],
        pagination,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Database error while fetching flashcards:", error);

      return new Response(
        JSON.stringify({
          error: "DATABASE_ERROR",
          message: "Failed to fetch flashcards from database",
          statusCode: 500,
        } as ApiErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unhandled error in GET /api/flashcards:", error);

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
// DELETE /api/flashcards - Bulk delete flashcards
// ============================================================================

export const DELETE: APIRoute = async ({ request, locals }) => {
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
        // eslint-disable-next-line no-console
        console.warn("No authenticated user found — using DEFAULT_USER_ID for development");
        userId = DEFAULT_USER_ID;
      } else {
        return new Response(
          JSON.stringify({
            error: "UNAUTHORIZED",
            message: "Authentication required to delete flashcards",
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
    let requestBody: BulkDeleteFlashcardsValidated;
    try {
      const rawBody = await request.json();
      requestBody = bulkDeleteFlashcardsSchema.parse(rawBody);
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

    const { flashcard_ids } = requestBody;

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

      // Delete existing flashcards
      let deletedCount = 0;
      if (existingIds.length > 0) {
        const { error: deleteError } = await supabase.from("flashcards").delete().in("flashcard_id", existingIds);

        if (deleteError) {
          throw new Error(`Failed to delete flashcards: ${deleteError.message}`);
        }

        deletedCount = existingIds.length;
      }

      // Prepare detailed results
      const results = flashcard_ids.map((id) => ({
        flashcard_id: id,
        status: existingIds.includes(id) ? ("deleted" as const) : ("not_found" as const),
      }));

      const response: BulkFlashcardOperationResponse = {
        deleted_count: deletedCount,
        failed_count: notFoundIds.length,
        results,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Database error while deleting flashcards:", error);

      return new Response(
        JSON.stringify({
          error: "DATABASE_ERROR",
          message: "Failed to delete flashcards from database",
          statusCode: 500,
        } as ApiErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unhandled error in DELETE /api/flashcards:", error);

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
