import type { APIRoute } from "astro";
import { z } from "zod";
import type { ApiErrorResponse } from "../../../types";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import {
  getSingleFlashcardSetQuerySchema,
  setIdSchema,
  type GetSingleFlashcardSetQueryValidated,
} from "../../../lib/schemas/flashcard-schemas";
import { createFlashcardSetService, FlashcardSetError } from "../../../lib/services/flashcard-set.service";

/**
 * Enhanced logger for API endpoint with structured logging
 */
const ApiLogger = {
  formatError(error: unknown, context: Record<string, unknown> = {}, endpoint: string): string {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      endpoint,
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

  error(message: string, error: unknown, context: Record<string, unknown> = {}, endpoint: string): void {
    console.error(`[FlashcardSetAPI] ${message}`);
    console.error(this.formatError(error, context, endpoint));
  },

  info(message: string, context: Record<string, unknown> = {}, endpoint: string): void {
    const logInfo = {
      timestamp: new Date().toISOString(),
      endpoint,
      message,
      ...context,
    };
    console.log(`[FlashcardSetAPI] ${message}`, logInfo);
  },

  warn(message: string, context: Record<string, unknown> = {}, endpoint: string): void {
    console.warn(`[FlashcardSetAPI] ${message}`, context);
  },
} as const;

export const prerender = false;

/**
 * GET /api/flashcard-sets/{set_id}
 * Retrieves a single flashcard set with optional flashcard details
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const endpoint = "GET /api/flashcard-sets/{set_id}";

  ApiLogger.info("Starting single flashcard set request", { requestId }, endpoint);

  try {
    // Step 1: Authentication check
    const supabase = locals.supabase;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const isDevelopment = import.meta.env.NODE_ENV === "development" || import.meta.env.DEV;
    let authenticatedUserId: string | undefined = user?.id;

    if (authError || !authenticatedUserId) {
      if (isDevelopment) {
        ApiLogger.warn(
          "No authenticated user found — falling back to DEFAULT_USER_ID for development",
          {
            requestId,
            authError: authError?.message,
            fallbackUserId: DEFAULT_USER_ID,
          },
          endpoint
        );
        authenticatedUserId = DEFAULT_USER_ID;
      } else {
        ApiLogger.error(
          "Authentication failed",
          authError || new Error("No authenticated user"),
          {
            requestId,
            isDevelopment,
          },
          endpoint
        );

        return new Response(
          JSON.stringify({
            error: "UNAUTHORIZED",
            message: "Authentication required to access flashcard set",
            statusCode: 401,
          } as ApiErrorResponse),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    ApiLogger.info(
      "User authenticated successfully",
      {
        requestId,
        userId: authenticatedUserId,
        isDevelopment,
      },
      endpoint
    );

    // Step 2: Validate set_id parameter
    let setId: number;
    try {
      setId = setIdSchema.parse(params.set_id);

      ApiLogger.info(
        "Set ID parameter validation successful",
        {
          requestId,
          setId,
        },
        endpoint
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        ApiLogger.error(
          "Set ID parameter validation failed",
          error,
          {
            requestId,
            setIdParam: params.set_id,
            validationErrors: error.errors,
          },
          endpoint
        );

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

      ApiLogger.error("Failed to validate set ID parameter", error, { requestId }, endpoint);

      return new Response(
        JSON.stringify({
          error: "INVALID_REQUEST",
          message: "Invalid set ID parameter",
          statusCode: 400,
        } as ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Parse and validate query parameters
    let queryParams: GetSingleFlashcardSetQueryValidated;
    try {
      const searchParams = new URLSearchParams(url.search);
      const rawParams = {
        include_flashcard_details: searchParams.get("include_flashcard_details"),
      };

      ApiLogger.info(
        "Raw query parameters parsed",
        {
          requestId,
          rawParams,
        },
        endpoint
      );

      queryParams = getSingleFlashcardSetQuerySchema.parse(rawParams);

      ApiLogger.info(
        "Query parameters validation successful",
        {
          requestId,
          validatedParams: queryParams,
        },
        endpoint
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        ApiLogger.error(
          "Query parameters validation failed",
          error,
          {
            requestId,
            validationErrors: error.errors,
          },
          endpoint
        );

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

      ApiLogger.error("Failed to parse query parameters", error, { requestId }, endpoint);

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

    const { include_flashcard_details } = queryParams;

    // Step 4: Initialize flashcard set service and fetch data
    ApiLogger.info("Initializing flashcard set service for single set retrieval", { requestId }, endpoint);
    const flashcardSetService = createFlashcardSetService(supabase);

    try {
      ApiLogger.info(
        "Fetching single flashcard set",
        {
          requestId,
          userId: authenticatedUserId,
          setId,
          includeFlashcardDetails: include_flashcard_details,
        },
        endpoint
      );

      const result = await flashcardSetService.getSingleFlashcardSet(
        authenticatedUserId,
        setId,
        include_flashcard_details
      );

      ApiLogger.info(
        "Single flashcard set retrieved successfully",
        {
          requestId,
          setId: result.set_id,
          setName: result.name,
          flashcardCount: result.flashcard_count,
          includeFlashcardDetails: include_flashcard_details,
        },
        endpoint
      );

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      if (error instanceof FlashcardSetError) {
        ApiLogger.error(
          "Business logic error in flashcard set service",
          error,
          {
            requestId,
            errorCode: error.code,
            statusCode: error.statusCode,
          },
          endpoint
        );

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

      ApiLogger.error(
        "Unexpected error in flashcard set service",
        error,
        {
          requestId,
          phase: "service_execution",
        },
        endpoint
      );

      return new Response(
        JSON.stringify({
          error: "INTERNAL_ERROR",
          message: "An unexpected error occurred while retrieving flashcard set",
          statusCode: 500,
        } as ApiErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    ApiLogger.error(
      "Unhandled error in get single flashcard set endpoint",
      error,
      {
        requestId: requestId || "unknown",
        phase: "top_level_handler",
      },
      endpoint
    );

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
 * DELETE /api/flashcard-sets/{set_id}
 * Deletes a flashcard set and all its associations
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const endpoint = "DELETE /api/flashcard-sets/{set_id}";

  ApiLogger.info("Starting delete flashcard set request", { requestId }, endpoint);

  try {
    // Step 1: Authentication check
    const supabase = locals.supabase;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const isDevelopment = import.meta.env.NODE_ENV === "development" || import.meta.env.DEV;
    let authenticatedUserId: string | undefined = user?.id;

    if (authError || !authenticatedUserId) {
      if (isDevelopment) {
        ApiLogger.warn(
          "No authenticated user found — falling back to DEFAULT_USER_ID for development",
          {
            requestId,
            authError: authError?.message,
            fallbackUserId: DEFAULT_USER_ID,
          },
          endpoint
        );
        authenticatedUserId = DEFAULT_USER_ID;
      } else {
        ApiLogger.error(
          "Authentication failed",
          authError || new Error("No authenticated user"),
          {
            requestId,
            isDevelopment,
          },
          endpoint
        );

        return new Response(
          JSON.stringify({
            error: "UNAUTHORIZED",
            message: "Authentication required to delete flashcard set",
            statusCode: 401,
          } as ApiErrorResponse),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    ApiLogger.info(
      "User authenticated successfully",
      {
        requestId,
        userId: authenticatedUserId,
        isDevelopment,
      },
      endpoint
    );

    // Step 2: Validate set_id parameter
    let setId: number;
    try {
      setId = setIdSchema.parse(params.set_id);

      ApiLogger.info(
        "Set ID parameter validation successful",
        {
          requestId,
          setId,
        },
        endpoint
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        ApiLogger.error(
          "Set ID parameter validation failed",
          error,
          {
            requestId,
            setIdParam: params.set_id,
            validationErrors: error.errors,
          },
          endpoint
        );

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

      ApiLogger.error("Failed to validate set ID parameter", error, { requestId }, endpoint);

      return new Response(
        JSON.stringify({
          error: "INVALID_REQUEST",
          message: "Invalid set ID parameter",
          statusCode: 400,
        } as ApiErrorResponse),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Initialize flashcard set service and delete
    ApiLogger.info("Initializing flashcard set service for deletion", { requestId }, endpoint);
    const flashcardSetService = createFlashcardSetService(supabase);

    try {
      ApiLogger.info(
        "Deleting flashcard set",
        {
          requestId,
          userId: authenticatedUserId,
          setId,
        },
        endpoint
      );

      const result = await flashcardSetService.deleteFlashcardSet(authenticatedUserId, setId);

      ApiLogger.info(
        "Flashcard set deleted successfully",
        {
          requestId,
          setId,
          message: result.message,
        },
        endpoint
      );

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      if (error instanceof FlashcardSetError) {
        ApiLogger.error(
          "Business logic error in flashcard set service",
          error,
          {
            requestId,
            errorCode: error.code,
            statusCode: error.statusCode,
          },
          endpoint
        );

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

      ApiLogger.error(
        "Unexpected error in flashcard set service",
        error,
        {
          requestId,
          phase: "service_execution",
        },
        endpoint
      );

      return new Response(
        JSON.stringify({
          error: "INTERNAL_ERROR",
          message: "An unexpected error occurred while deleting flashcard set",
          statusCode: 500,
        } as ApiErrorResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    ApiLogger.error(
      "Unhandled error in delete flashcard set endpoint",
      error,
      {
        requestId: requestId || "unknown",
        phase: "top_level_handler",
      },
      endpoint
    );

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
