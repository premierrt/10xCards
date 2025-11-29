import type { SupabaseClient } from "../../../src/db/supabase.client";

/**
 * Mock Supabase client for development and testing
 * Simulates database operations without requiring real Supabase connection
 */
export class MockSupabaseClient {
  private mockFlashcardId = 1;

  /**
   * Mock auth.getUser() - always returns a mock user
   */
  auth = {
    getUser: async () => ({
      data: {
        user: {
          id: "mock-user-id",
          email: "test@example.com",
        },
      },
      error: null,
    }),
  };

  /**
   * Mock database operations
   */
  from(table: string) {
    if (table === "flashcards") {
      return {
        insert: (data: any[]) => ({
          select: (fields: string) => ({
            then: async (resolve: (result: any) => void) => {
              // Simulate database insert with generated IDs
              const mockData = data.map((item) => ({
                ...item,
                flashcard_id: this.mockFlashcardId++,
              }));

              resolve({ data: mockData, error: null });
              return { data: mockData, error: null };
            },
          }),
        }),
      };
    }

    // Default mock for other tables
    return {
      insert: () => ({
        select: () => ({
          then: async (resolve: (result: any) => void) => {
            resolve({ data: [], error: null });
            return { data: [], error: null };
          },
        }),
      }),
    };
  }
}

/**
 * Create mock Supabase client instance
 */
export function createMockSupabaseClient(): any {
  return new MockSupabaseClient();
}
