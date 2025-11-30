import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateFlashcardSetResponse } from "../../types";

/**
 * Logger utility for structured logging in FlashcardSetService
 */
const ServiceLogger = {
  formatError(error: unknown, context: Record<string, unknown> = {}): string {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      service: "FlashcardSetService",
      context,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : { message: String(error) },
    };
    return JSON.stringify(errorInfo, null, 2);
  },

  error(message: string, error: unknown, context: Record<string, unknown> = {}): void {
    console.error(`[FlashcardSetService] ${message}`);
    console.error(this.formatError(error, context));
  },

  info(message: string, context: Record<string, unknown> = {}): void {
    const logInfo = {
      timestamp: new Date().toISOString(),
      service: "FlashcardSetService",
      message,
      ...context,
    };
    console.log(`[FlashcardSetService] ${message}`, logInfo);
  },

  warn(message: string, context: Record<string, unknown> = {}): void {
    console.warn(`[FlashcardSetService] ${message}`, context);
  },
} as const;

/**
 * Custom error class for flashcard set operations
 */
export class FlashcardSetError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code = "FLASHCARD_SET_ERROR"
  ) {
    super(message);
    this.name = "FlashcardSetError";
  }
}

/**
 * Service for managing flashcard sets operations
 */
export class FlashcardSetService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Check if a flashcard set name is already taken by the user
   * @param userId - The user ID
   * @param name - The set name to check
   * @returns Promise<boolean> - true if name is taken, false if available
   */
  async isSetNameTaken(userId: string, name: string): Promise<boolean> {
    const context = { userId, name };
    ServiceLogger.info("Checking set name availability", context);

    const { data, error } = await this.supabase
      .from("flashcard_sets")
      .select("set_id")
      .eq("user_id", userId)
      .eq("name", name)
      .limit(1);

    if (error) {
      ServiceLogger.error("Failed to check set name availability", error, context);
      throw new FlashcardSetError(`Failed to check set name availability: ${error.message}`, 500, "DATABASE_ERROR");
    }

    const isTaken = data && data.length > 0;
    ServiceLogger.info(`Set name availability check completed`, {
      ...context,
      isTaken,
      foundRecords: data?.length || 0,
    });

    return isTaken;
  }

  /**
   * Verify that all provided flashcard IDs exist and have 'accepted' status
   * @param flashcardIds - Array of flashcard IDs to verify
   * @returns Promise<void> - throws error if any flashcards are invalid
   */
  async verifyFlashcardsStatus(flashcardIds: number[]): Promise<void> {
    const context = { flashcardIds, count: flashcardIds.length };
    ServiceLogger.info("Verifying flashcards status", context);

    const { data, error } = await this.supabase
      .from("flashcards")
      .select("flashcard_id, status")
      .in("flashcard_id", flashcardIds);

    if (error) {
      ServiceLogger.error("Failed to query flashcards for verification", error, context);
      throw new FlashcardSetError(`Failed to verify flashcards: ${error.message}`, 500, "DATABASE_ERROR");
    }

    ServiceLogger.info("Flashcards query completed", { ...context, foundCount: data?.length || 0 });

    // Check if all flashcards were found
    if (!data || data.length !== flashcardIds.length) {
      const foundIds = data?.map((f) => f.flashcard_id) || [];
      const missingIds = flashcardIds.filter((id) => !foundIds.includes(id));

      const errorContext = { ...context, foundIds, missingIds, foundCount: data?.length || 0 };
      ServiceLogger.error("Some flashcards not found in database", new Error("Missing flashcards"), errorContext);

      throw new FlashcardSetError(`Flashcards not found: ${missingIds.join(", ")}`, 400, "FLASHCARDS_NOT_FOUND");
    }

    // Check if all flashcards have 'accepted' status
    const nonAcceptedFlashcards = data.filter((f) => f.status !== "accepted");
    if (nonAcceptedFlashcards.length > 0) {
      const nonAcceptedIds = nonAcceptedFlashcards.map((f) => f.flashcard_id);
      const nonAcceptedStatuses = nonAcceptedFlashcards.map((f) => ({ id: f.flashcard_id, status: f.status }));

      const errorContext = { ...context, nonAcceptedIds, nonAcceptedStatuses };
      ServiceLogger.error(
        "Some flashcards are not in accepted status",
        new Error("Non-accepted flashcards"),
        errorContext
      );

      throw new FlashcardSetError(
        `Flashcards must be accepted before adding to set. Non-accepted flashcards: ${nonAcceptedIds.join(", ")}`,
        400,
        "FLASHCARDS_NOT_ACCEPTED"
      );
    }

    ServiceLogger.info("All flashcards verified successfully", { ...context, acceptedCount: data.length });
  }

  /**
   * Create a new flashcard set with associated flashcards in a transaction
   * @param userId - The user ID creating the set
   * @param name - The name of the flashcard set
   * @param flashcardIds - Array of flashcard IDs to add to the set
   * @returns Promise<CreateFlashcardSetResponse>
   */
  async createFlashcardSet(userId: string, name: string, flashcardIds: number[]): Promise<CreateFlashcardSetResponse> {
    const context = { userId, name, flashcardIds: flashcardIds.length };
    ServiceLogger.info("Starting flashcard set creation with pseudo-transaction", context);

    let createdSetId: number | null = null;

    try {
      // Step 1: Create the flashcard set
      ServiceLogger.info("Creating flashcard set record", context);

      const { data: setData, error: setError } = await this.supabase
        .from("flashcard_sets")
        .insert({
          user_id: userId,
          name: name,
        })
        .select("set_id, created_at")
        .single();

      if (setError || !setData) {
        ServiceLogger.error(
          "Failed to create flashcard set record",
          setError || new Error("No data returned"),
          context
        );
        throw new FlashcardSetError(
          `Failed to create flashcard set: ${setError?.message || "Unknown error"}`,
          500,
          "DATABASE_ERROR"
        );
      }

      createdSetId = setData.set_id;
      ServiceLogger.info("Flashcard set record created successfully", {
        ...context,
        setId: createdSetId,
        createdAt: setData.created_at,
      });

      // Step 2: Add flashcards to the set (pseudo-transaction continues)
      const flashcardSetEntries = flashcardIds.map((flashcardId) => ({
        set_id: setData.set_id,
        flashcard_id: flashcardId,
      }));

      ServiceLogger.info("Inserting flashcard-set relationships", {
        ...context,
        setId: createdSetId,
        entriesCount: flashcardSetEntries.length,
      });

      const { error: flashcardSetError } = await this.supabase
        .from("flashcard_set_flashcards")
        .insert(flashcardSetEntries);

      if (flashcardSetError) {
        ServiceLogger.error("Failed to insert flashcard-set relationships", flashcardSetError, {
          ...context,
          setId: createdSetId,
          entriesCount: flashcardSetEntries.length,
        });

        // PSEUDO-TRANSACTION ROLLBACK: Attempt to clean up the created set
        ServiceLogger.warn("Attempting rollback: deleting created flashcard set", { setId: createdSetId });

        const { error: deleteError } = await this.supabase.from("flashcard_sets").delete().eq("set_id", setData.set_id);

        if (deleteError) {
          ServiceLogger.error("CRITICAL: Failed to rollback created set - manual cleanup required", deleteError, {
            setId: createdSetId,
            originalError: flashcardSetError.message,
          });
        } else {
          ServiceLogger.info("Rollback successful: created set deleted", { setId: createdSetId });
        }

        throw new FlashcardSetError(
          `Failed to add flashcards to set: ${flashcardSetError.message}`,
          500,
          "DATABASE_ERROR"
        );
      }

      ServiceLogger.info("Flashcard-set relationships created successfully", {
        ...context,
        setId: createdSetId,
        relationshipsAdded: flashcardIds.length,
      });

      // Pseudo-transaction completed successfully
      const result = {
        set_id: setData.set_id,
        created_at: setData.created_at || new Date().toISOString(),
        flashcards_added: flashcardIds.length,
      };

      ServiceLogger.info("Flashcard set creation completed successfully", {
        ...context,
        result,
      });

      return result;
    } catch (error) {
      if (error instanceof FlashcardSetError) {
        ServiceLogger.error("Business logic error during set creation", error, {
          ...context,
          createdSetId,
          errorCode: error.code,
        });
        throw error;
      }

      ServiceLogger.error("Unexpected error during flashcard set creation", error, {
        ...context,
        createdSetId,
        phase: "unknown",
      });

      throw new FlashcardSetError(
        `Unexpected error creating flashcard set: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
        "INTERNAL_ERROR"
      );
    }
  }
}

/**
 * Factory function to create a FlashcardSetService instance
 * @param supabase - Supabase client instance
 * @returns FlashcardSetService instance
 */
export function createFlashcardSetService(supabase: SupabaseClient): FlashcardSetService {
  ServiceLogger.info("Creating new FlashcardSetService instance");
  return new FlashcardSetService(supabase);
}
