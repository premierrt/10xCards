import type { AIGeneratedFlashcard } from "../schemas/flashcard-schemas";
import { flashcardGenerationService as flashcardGenerationMockService } from "./flashcard-generation-mock.service";

// Re-export error class from mock service to avoid static import of real service
export { FlashcardGenerationError } from "./flashcard-generation-mock.service";

/**
 * Interface for flashcard generation services
 */
export interface IFlashcardGenerationService {
  generateFlashcards(text: string, count: number): Promise<AIGeneratedFlashcard[]>;
}

/**
 * Wrapper class for lazy-loaded real service
 */
class LazyRealFlashcardService implements IFlashcardGenerationService {
  private servicePromise: Promise<IFlashcardGenerationService> | null = null;

  private async getService(): Promise<IFlashcardGenerationService> {
    if (!this.servicePromise) {
      this.servicePromise = import("./flashcard-generation.service").then((module) => {
        try {
          console.log("🔍 LazyRealFlashcardService: Loaded real service module", {
            hasFlashcardGenerationService: !!module.flashcardGenerationService,
            moduleKeys: Object.keys(module),
          });
          return module.flashcardGenerationService;
        } catch (error) {
          console.error("❌ LazyRealFlashcardService: Failed to initialize real flashcard service", error);
          throw error;
        }
      });
    }
    return this.servicePromise;
  }

  async generateFlashcards(text: string, count: number): Promise<AIGeneratedFlashcard[]> {
    console.log("🔍 LazyRealFlashcardService: Generating flashcards with real service");
    const service = await this.getService();
    console.log("🔍 LazyRealFlashcardService: Got service instance", {
      serviceType: service.constructor.name,
      isRealService: service !== flashcardGenerationMockService,
    });
    return service.generateFlashcards(text, count);
  }
}

/**
 * Factory service that returns the appropriate flashcard generation service
 * based on environment configuration
 */
export class FlashcardGenerationFactory {
  // Prevent instantiation
  private constructor() {
    // Factory class - no instantiation allowed
  }

  /**
   * Get the flashcard generation service instance
   * Returns mock service if USE_MOCK_AI is true or OPENROUTER_API_KEY is not set
   * Returns real service otherwise (lazy loaded to avoid initialization errors)
   */
  static getService(): IFlashcardGenerationService {
    const useMockEnv = import.meta.env.USE_MOCK_AI;
    const useMock = useMockEnv === "true" || useMockEnv === true;
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    const hasApiKey = typeof apiKey === "string" && apiKey.trim().length > 0;
    const nodeEnv = import.meta.env.NODE_ENV;
    const isDevelopment = nodeEnv === "development" || import.meta.env.DEV === true;
    const useRealAI = import.meta.env.USE_REAL_AI;
    const useRealAINormalized = useRealAI === "true" || useRealAI === true;

    // Debug logging to diagnose service selection
    console.log("🔍 Flashcard Service Selection Debug:", {
      useMockEnv: useMockEnv,
      useMockEnvType: typeof useMockEnv,
      useMock: useMock,
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : "NOT_SET",
      hasApiKey: hasApiKey,
      nodeEnv: nodeEnv,
      isDevelopment: isDevelopment,
      useRealAI: useRealAI,
      useRealAIType: typeof useRealAI,
      finalCondition: useMock || !hasApiKey || (isDevelopment && useRealAI !== "true"),
    });

    // Always use mock service in development unless explicitly disabled
    // OR if explicitly requested
    // OR if no API key is provided
    // Simplified condition: use mock only if explicitly requested OR no API key
    if (useMock || !hasApiKey) {
      // Using mock flashcard generation service
      return flashcardGenerationMockService;
    }

    // Using OpenRouter.ai flashcard generation service
    // Return lazy-loaded wrapper to avoid initialization errors
    return new LazyRealFlashcardService();
  }
}

/**
 * Default export - gets the appropriate service instance
 * Note: To force mock usage, set USE_MOCK_AI=true in your environment
 */
export const flashcardService = FlashcardGenerationFactory.getService();

/**
 * Force mock service (useful for testing/development)
 */
export const mockFlashcardService = flashcardGenerationMockService;

/**
 * Get service with explicit mock flag
 */
export function getFlashcardService(forceMock = false): IFlashcardGenerationService {
  if (forceMock) {
    // Forcing mock flashcard generation service
    return flashcardGenerationMockService;
  }
  return FlashcardGenerationFactory.getService();
}
