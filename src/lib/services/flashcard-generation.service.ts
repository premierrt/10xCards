import type { AIGeneratedFlashcard } from "../schemas/flashcard-schemas";
import { aiGeneratedFlashcardsArraySchema } from "../schemas/flashcard-schemas";

/**
 * Configuration for OpenRouter.ai API
 */
interface OpenRouterConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  timeout: number;
}

/**
 * OpenRouter.ai API request structure
 */
interface OpenRouterRequest {
  model: string;
  messages: {
    role: "system" | "user";
    content: string;
  }[];
  temperature: number;
  max_tokens: number;
}

/**
 * OpenRouter.ai API response structure
 */
interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Custom error class for flashcard generation failures
 */
export class FlashcardGenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly statusCode = 500
  ) {
    super(message);
    this.name = "FlashcardGenerationError";
  }
}

/**
 * Service class for generating flashcards using AI models via OpenRouter.ai
 */
export class FlashcardGenerationService {
  private config: OpenRouterConfig | null = null;

  constructor() {
    // Don't validate API key during construction to allow for lazy loading
    // Validation will happen when the service is first used
  }

  /**
   * Initialize the configuration (lazy initialization)
   */
  private ensureConfigured(): void {
    if (this.config) return;

    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new FlashcardGenerationError("OPENROUTER_API_KEY environment variable is required", undefined, 500);
    }

    this.config = {
      apiKey,
      model: import.meta.env.OPENROUTER_MODEL || "anthropic/claude-3-haiku",
      baseUrl: "https://openrouter.ai/api/v1/chat/completions",
      timeout: 30000, // 30 seconds timeout
    };
  }

  /**
   * Generate flashcards from input text using AI
   * @param text - Input text to generate flashcards from
   * @param count - Number of flashcards to generate
   * @returns Array of generated flashcards
   */
  async generateFlashcards(text: string, count: number): Promise<AIGeneratedFlashcard[]> {
    try {
      // Ensure configuration is initialized
      this.ensureConfigured();

      const prompt = this.buildPrompt(text, count);
      const aiResponse = await this.callOpenRouterAPI(prompt);
      const flashcards = this.parseAIResponse(aiResponse);

      // Validate the response format
      const validatedFlashcards = aiGeneratedFlashcardsArraySchema.parse(flashcards);

      return validatedFlashcards;
    } catch (error) {
      if (error instanceof FlashcardGenerationError) {
        throw error;
      }

      // Handle different types of errors
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new FlashcardGenerationError("Request timeout - AI service took too long to respond", error, 408);
        }

        if (error.message.includes("fetch")) {
          throw new FlashcardGenerationError("Failed to connect to AI service", error, 503);
        }
      }

      throw new FlashcardGenerationError(
        "Unexpected error occurred during flashcard generation",
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Build optimized prompt for flashcard generation
   */
  private buildPrompt(text: string, count: number): string {
    return `You are an expert at creating educational flashcards. Generate exactly ${count} high-quality flashcards from the following text content.

Requirements:
- Create questions that test understanding, not just memorization
- Provide clear, concise answers
- Focus on key concepts, definitions, and relationships
- Vary question types (what, how, why, when, etc.)
- Ensure questions are answerable from the given text
- Return ONLY a valid JSON array in this exact format:

[
  {
    "question": "Your question here?",
    "answer": "Your answer here."
  }
]

Text to analyze:
${text}

Generate exactly ${count} flashcards as a JSON array:`;
  }

  /**
   * Make API call to OpenRouter.ai
   */
  private async callOpenRouterAPI(prompt: string): Promise<string> {
    if (!this.config) {
      throw new FlashcardGenerationError("Service not properly initialized", undefined, 500);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const requestBody: OpenRouterRequest = {
        model: this.config.model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent output
        max_tokens: 2000,
      };

      const response = await fetch(this.config.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config!.apiKey}`,
          "HTTP-Referer": import.meta.env.SITE || "http://localhost:4321",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");

        if (response.status === 401) {
          throw new FlashcardGenerationError("Invalid API key for AI service", undefined, 500);
        }

        if (response.status === 429) {
          throw new FlashcardGenerationError("AI service rate limit exceeded. Please try again later.", undefined, 429);
        }

        throw new FlashcardGenerationError(
          `AI service returned error: ${response.status} ${errorText}`,
          undefined,
          response.status >= 500 ? 503 : 400
        );
      }

      const data: OpenRouterResponse = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        throw new FlashcardGenerationError("AI service returned invalid response format", undefined, 502);
      }

      return data.choices[0].message.content;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse AI response and extract flashcards
   */
  private parseAIResponse(response: string): AIGeneratedFlashcard[] {
    try {
      // Clean up the response - remove any markdown code blocks or extra text
      const cleanedResponse = response
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      // Try to find JSON array in the response
      const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanedResponse;

      const parsed = JSON.parse(jsonString);

      if (!Array.isArray(parsed)) {
        throw new Error("Response is not an array");
      }

      return parsed;
    } catch (error) {
      throw new FlashcardGenerationError(
        "Failed to parse AI response - invalid JSON format",
        error instanceof Error ? error : new Error(String(error)),
        502
      );
    }
  }
}

/**
 * Create a new instance of the flashcard generation service
 * Use this factory function to avoid initialization errors during module import
 */
export function createFlashcardGenerationService(): FlashcardGenerationService {
  return new FlashcardGenerationService();
}

/**
 * Singleton instance of the flashcard generation service (lazy-initialized)
 */
let _flashcardGenerationService: FlashcardGenerationService | null = null;

export const flashcardGenerationService = {
  getInstance(): FlashcardGenerationService {
    if (!_flashcardGenerationService) {
      _flashcardGenerationService = new FlashcardGenerationService();
    }
    return _flashcardGenerationService;
  },

  // Forward the generateFlashcards method for convenience
  async generateFlashcards(text: string, count: number): Promise<AIGeneratedFlashcard[]> {
    return this.getInstance().generateFlashcards(text, count);
  },
};
