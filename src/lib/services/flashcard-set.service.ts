import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreateFlashcardSetResponse,
  GetFlashcardSetsResponse,
  FlashcardSetListItem,
  GetSingleFlashcardSetResponse,
  FlashcardDetails,
  DeleteFlashcardSetResponse,
  PaginationInfo,
} from "../../types";

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

  /**
   * Get a list of flashcard sets for a user with pagination
   * @param userId - The user ID
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   * @param includeFlashcards - Whether to include flashcard IDs in response
   * @returns Promise<GetFlashcardSetsResponse>
   */
  async getFlashcardSets(
    userId: string,
    page = 1,
    limit = 10,
    includeFlashcards = true
  ): Promise<GetFlashcardSetsResponse> {
    const context = { userId, page, limit, includeFlashcards };
    ServiceLogger.info("Getting flashcard sets list", context);

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    try {
      // First, get the total count
      const { count, error: countError } = await this.supabase
        .from("flashcard_sets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countError) {
        ServiceLogger.error("Failed to get flashcard sets count", countError, context);
        throw new FlashcardSetError(`Failed to get flashcard sets count: ${countError.message}`, 500, "DATABASE_ERROR");
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Get the flashcard sets with flashcard counts
      const { data: setsData, error: setsError } = await this.supabase
        .from("flashcard_sets")
        .select(
          `
          set_id,
          name,
          created_at,
          flashcard_set_flashcards(flashcard_id)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (setsError) {
        ServiceLogger.error("Failed to get flashcard sets", setsError, context);
        throw new FlashcardSetError(`Failed to get flashcard sets: ${setsError.message}`, 500, "DATABASE_ERROR");
      }

      // Define the structure of the data returned from Supabase
      interface SetWithFlashcards {
        set_id: number;
        name: string;
        created_at: string | null;
        flashcard_set_flashcards: { flashcard_id: number | null }[] | null;
      }

      // Transform the data to match our DTO structure
      const sets: FlashcardSetListItem[] = ((setsData as SetWithFlashcards[]) || []).map((set) => {
        const flashcardIds =
          set.flashcard_set_flashcards?.map((f) => f.flashcard_id).filter((id): id is number => id !== null) || [];

        const baseSet: FlashcardSetListItem = {
          set_id: set.set_id,
          name: set.name,
          flashcard_count: flashcardIds.length,
          created_at: set.created_at || new Date().toISOString(),
        };

        // Include flashcard IDs if requested
        if (includeFlashcards) {
          baseSet.flashcard_ids = flashcardIds;
        }

        return baseSet;
      });

      const pagination: PaginationInfo = {
        page,
        limit,
        total: totalCount,
        total_pages: totalPages,
      };

      const result = { sets, pagination };

      ServiceLogger.info("Flashcard sets list retrieved successfully", {
        ...context,
        resultCount: sets.length,
        totalCount,
        totalPages,
      });

      return result;
    } catch (error) {
      if (error instanceof FlashcardSetError) {
        throw error;
      }

      ServiceLogger.error("Unexpected error getting flashcard sets", error, context);
      throw new FlashcardSetError(
        `Unexpected error getting flashcard sets: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
        "INTERNAL_ERROR"
      );
    }
  }

  /**
   * Get a single flashcard set with optional flashcard details
   * @param userId - The user ID
   * @param setId - The set ID
   * @param includeFlashcardDetails - Whether to include full flashcard details
   * @returns Promise<GetSingleFlashcardSetResponse>
   */
  async getSingleFlashcardSet(
    userId: string,
    setId: number,
    includeFlashcardDetails = false
  ): Promise<GetSingleFlashcardSetResponse> {
    const context = { userId, setId, includeFlashcardDetails };
    ServiceLogger.info("Getting single flashcard set", context);

    try {
      // Verify the set exists and belongs to the user
      const { data: setData, error: setError } = await this.supabase
        .from("flashcard_sets")
        .select("set_id, name, created_at")
        .eq("set_id", setId)
        .eq("user_id", userId)
        .single();

      if (setError || !setData) {
        if (setError?.code === "PGRST116") {
          ServiceLogger.info("Flashcard set not found or access denied", { ...context, errorCode: setError.code });
          throw new FlashcardSetError("Flashcard set not found", 404, "SET_NOT_FOUND");
        }

        ServiceLogger.error("Failed to get flashcard set", setError, context);
        throw new FlashcardSetError(
          `Failed to get flashcard set: ${setError?.message || "Unknown error"}`,
          500,
          "DATABASE_ERROR"
        );
      }

      // Get flashcards associated with the set
      const flashcardsQuery = this.supabase
        .from("flashcard_set_flashcards")
        .select(includeFlashcardDetails ? "flashcard_id, flashcards(question, answer)" : "flashcard_id")
        .eq("set_id", setId);

      const { data: flashcardsData, error: flashcardsError } = await flashcardsQuery;

      if (flashcardsError) {
        ServiceLogger.error("Failed to get flashcards for set", flashcardsError, context);
        throw new FlashcardSetError(
          `Failed to get flashcards for set: ${flashcardsError.message}`,
          500,
          "DATABASE_ERROR"
        );
      }

      // Define the structure of the data returned from Supabase
      interface FlashcardSetFlashcardWithDetails {
        flashcard_id: number | null;
        flashcards?: {
          question: string;
          answer: string;
        } | null;
      }

      interface FlashcardSetFlashcardBasic {
        flashcard_id: number | null;
      }

      // Transform flashcards data based on includeFlashcardDetails flag
      let flashcards: number[] | FlashcardDetails[];

      if (includeFlashcardDetails) {
        flashcards = ((flashcardsData || []) as unknown as FlashcardSetFlashcardWithDetails[]).map((item) => ({
          flashcard_id: item.flashcard_id || 0,
          question: item.flashcards?.question || "",
          answer: item.flashcards?.answer || "",
        }));
      } else {
        flashcards = ((flashcardsData || []) as unknown as FlashcardSetFlashcardBasic[])
          .map((item) => item.flashcard_id)
          .filter((id): id is number => id !== null);
      }

      const result: GetSingleFlashcardSetResponse = {
        set_id: setData.set_id,
        name: setData.name,
        flashcard_count: flashcards.length,
        created_at: setData.created_at || new Date().toISOString(),
        flashcards,
      };

      ServiceLogger.info("Single flashcard set retrieved successfully", {
        ...context,
        flashcardCount: flashcards.length,
      });

      return result;
    } catch (error) {
      if (error instanceof FlashcardSetError) {
        throw error;
      }

      ServiceLogger.error("Unexpected error getting single flashcard set", error, context);
      throw new FlashcardSetError(
        `Unexpected error getting flashcard set: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
        "INTERNAL_ERROR"
      );
    }
  }

  /**
   * Delete a flashcard set and all its associations
   * @param userId - The user ID
   * @param setId - The set ID to delete
   * @returns Promise<DeleteFlashcardSetResponse>
   */
  async deleteFlashcardSet(userId: string, setId: number): Promise<DeleteFlashcardSetResponse> {
    const context = { userId, setId };
    ServiceLogger.info("Deleting flashcard set", context);

    try {
      // First verify the set exists and belongs to the user
      const { data: setData, error: verifyError } = await this.supabase
        .from("flashcard_sets")
        .select("set_id, name")
        .eq("set_id", setId)
        .eq("user_id", userId)
        .single();

      if (verifyError || !setData) {
        if (verifyError?.code === "PGRST116") {
          ServiceLogger.info("Flashcard set not found or access denied for deletion", {
            ...context,
            errorCode: verifyError.code,
          });
          throw new FlashcardSetError("Flashcard set not found", 404, "SET_NOT_FOUND");
        }

        ServiceLogger.error("Failed to verify flashcard set for deletion", verifyError, context);
        throw new FlashcardSetError(
          `Failed to verify flashcard set: ${verifyError?.message || "Unknown error"}`,
          500,
          "DATABASE_ERROR"
        );
      }

      // Delete the flashcard set (cascade will handle flashcard_set_flashcards)
      const { error: deleteError } = await this.supabase
        .from("flashcard_sets")
        .delete()
        .eq("set_id", setId)
        .eq("user_id", userId);

      if (deleteError) {
        ServiceLogger.error("Failed to delete flashcard set", deleteError, context);
        throw new FlashcardSetError(`Failed to delete flashcard set: ${deleteError.message}`, 500, "DATABASE_ERROR");
      }

      const result: DeleteFlashcardSetResponse = {
        message: `Flashcard set "${setData.name}" has been successfully deleted`,
      };

      ServiceLogger.info("Flashcard set deleted successfully", {
        ...context,
        setName: setData.name,
      });

      return result;
    } catch (error) {
      if (error instanceof FlashcardSetError) {
        throw error;
      }

      ServiceLogger.error("Unexpected error deleting flashcard set", error, context);
      throw new FlashcardSetError(
        `Unexpected error deleting flashcard set: ${error instanceof Error ? error.message : "Unknown error"}`,
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
