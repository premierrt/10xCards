import type { APIRoute } from "astro";
import { z } from "zod";
import type { ApiErrorResponse } from "../../types";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import { createFlashcardSetSchema, type CreateFlashcardSetValidated } from "../../lib/schemas/flashcard-schemas";
import { createFlashcardSetService, FlashcardSetError } from "../../lib/services/flashcard-set.service";

/**
 * Enhanced logger for API endpoint with structured logging
 */
const ApiLogger = {
  formatError(error: unknown, context: Record<string, unknown> = {}): string {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      endpoint: "POST /api/flashcard-sets",
      context,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
              ...(error instanceof FlashcardSetError
                ? {
                    code: error.code,
                    statusCode: error.statusCode,
                  }
                : {}),
            }
          : { message: String(error) },
    };
    return JSON.stringify(errorInfo, null, 2);
  },

  error(message: string, error: unknown, context: Record<string, unknown> = {}): void {
    console.error(`[FlashcardSetsAPI] ${message}`);
    console.error(this.formatError(error, context));
  },

  info(message: string, context: Record<string, unknown> = {}): void {
    const logInfo = {
      timestamp: new Date().toISOString(),
      endpoint: "POST /api/flashcard-sets",
      message,
      ...context,
    };
    console.log(`[FlashcardSetsAPI] ${message}`, logInfo);
  },

  warn(message: string, context: Record<string, unknown> = {}): void {
    console.warn(`[FlashcardSetsAPI] ${message}`, context);
  },
} as const;

export const prerender = false;

/**
 * POST /api/flashcard-sets
 * Creates a new flashcard set with accepted flashcards
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  ApiLogger.info("Starting flashcard set creation request", { requestId });

  try {
    // Step 1: Authentication check - verify user is authenticated
    const supabase = locals.supabase;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Determine if running in development mode
    const isDevelopment = import.meta.env.NODE_ENV === "development" || import.meta.env.DEV;

    // Use the authenticated user's ID when available; otherwise fall back to DEFAULT_USER_ID in development
    let authenticatedUserId: string | undefined = user?.id;

    if (authError || !authenticatedUserId) {
      if (isDevelopment) {
        ApiLogger.warn("No authenticated user found — falling back to DEFAULT_USER_ID for development", {
          requestId,
          authError: authError?.message,
          fallbackUserId: DEFAULT_USER_ID,
        });
        authenticatedUserId = DEFAULT_USER_ID;
      } else {
        ApiLogger.error("Authentication failed", authError || new Error("No authenticated user"), {
          requestId,
          isDevelopment,
        });

        return new Response(
          JSON.stringify({
            error: "UNAUTHORIZED",
            message: "Authentication required to create flashcard sets",
            statusCode: 401,
          } as ApiErrorResponse),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    ApiLogger.info("User authenticated successfully", {
      requestId,
      userId: authenticatedUserId,
      isDevelopment,
    });

    // Step 2: Parse and validate request body
    let requestBody: CreateFlashcardSetValidated;
    try {
      const rawBody = await request.json();
      ApiLogger.info("Request body parsed successfully", {
        requestId,
        bodySize: JSON.stringify(rawBody).length,
      });

      requestBody = createFlashcardSetSchema.parse(rawBody);

      ApiLogger.info("Request validation successful", {
        requestId,
        setName: requestBody.name,
        flashcardCount: requestBody.flashcard_ids.length,
        targetUserId: requestBody.user_id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        ApiLogger.error("Request validation failed", error, {
          requestId,
          validationErrors: error.errors,
        });

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

      ApiLogger.error("Failed to parse request JSON", error, { requestId });

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

    const { user_id, name, flashcard_ids } = requestBody;

    // Step 3: Authorization check - verify user can create sets for the specified user_id
    if (user_id !== authenticatedUserId) {
      ApiLogger.error("Authorization failed - user mismatch", new Error("User ID mismatch"), {
        requestId,
        requestedUserId: user_id,
        authenticatedUserId,
      });

      return new Response(
        JSON.stringify({
          error: "FORBIDDEN",
          message: "You can only create flashcard sets for your own account",
          statusCode: 403,
        } as ApiErrorResponse),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    ApiLogger.info("Authorization check passed", {
      requestId,
      userId: user_id,
    });

    // Step 4: Initialize flashcard set service
    ApiLogger.info("Initializing flashcard set service", { requestId });
    const flashcardSetService = createFlashcardSetService(supabase);

    try {
      // Step 5: Check if set name is already taken
      ApiLogger.info("Checking set name availability", { requestId, name });
      const isNameTaken = await flashcardSetService.isSetNameTaken(user_id, name);

      if (isNameTaken) {
        ApiLogger.info("Set name already exists", { requestId, name, userId: user_id });

        return new Response(
          JSON.stringify({
            error: "NAME_ALREADY_EXISTS",
            message: `A flashcard set with the name "${name}" already exists`,
            statusCode: 400,
          } as ApiErrorResponse),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      ApiLogger.info("Set name is available", { requestId, name });

      // Step 6: Verify all flashcards exist and are accepted
      ApiLogger.info("Verifying flashcards status", { requestId, flashcardIds: flashcard_ids });
      await flashcardSetService.verifyFlashcardsStatus(flashcard_ids);
      ApiLogger.info("All flashcards verified successfully", { requestId, verifiedCount: flashcard_ids.length });

      // Step 7: Create the flashcard set
      ApiLogger.info("Creating flashcard set", { requestId, name, flashcardCount: flashcard_ids.length });
      const result = await flashcardSetService.createFlashcardSet(user_id, name, flashcard_ids);

      ApiLogger.info("Flashcard set created successfully", {
        requestId,
        setId: result.set_id,
        flashcardsAdded: result.flashcards_added,
        createdAt: result.created_at,
      });

      // Step 8: Return successful response
      return new Response(JSON.stringify(result), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      if (error instanceof FlashcardSetError) {
        ApiLogger.error("Business logic error in flashcard set service", error, {
          requestId,
          errorCode: error.code,
          statusCode: error.statusCode,
        });

        return new Response(
          JSON.stringify({
            error: error.code,
            message: error.message,
            statusCode: error.statusCode,
          } as ApiErrorResponse),
          {
            status: error.statusCode,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Log unexpected service errors for debugging
      ApiLogger.error("Unexpected error in flashcard set service", error, {
        requestId,
        phase: "service_execution",
      });

      return new Response(
        JSON.stringify({
          error: "INTERNAL_ERROR",
          message: "An unexpected error occurred while creating the flashcard set",
          statusCode: 500,
        } as ApiErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    // Catch-all error handler for unexpected errors
    ApiLogger.error("Unhandled error in create flashcard set endpoint", error, {
      requestId: requestId || "unknown",
      phase: "top_level_handler",
    });

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
