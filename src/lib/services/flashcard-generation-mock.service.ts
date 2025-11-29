import type { AIGeneratedFlashcard } from "../schemas/flashcard-schemas";
import { aiGeneratedFlashcardsArraySchema } from "../schemas/flashcard-schemas";

/**
 * Custom error class for flashcard generation failures (mock version)
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
 * Mock service for generating flashcards without external AI API calls
 * Useful for development, testing, and demo purposes
 * Implements the same interface as FlashcardGenerationService
 */
export class FlashcardGenerationService {
  /**
   * Generate flashcards from input text using AI (mock implementation)
   * @param text - Input text to generate flashcards from
   * @param count - Number of flashcards to generate
   * @returns Array of generated flashcards
   */
  async generateFlashcards(text: string, count: number): Promise<AIGeneratedFlashcard[]> {
    try {
      // Simulate potential errors for testing
      await this.simulateErrorScenarios();

      // Simulate API delay
      await this.simulateDelay();

      const mockFlashcards = this.generateMockFlashcards(text, count);

      // Validate the mock response using the same schema as real service
      const validatedFlashcards = aiGeneratedFlashcardsArraySchema.parse(mockFlashcards);

      return validatedFlashcards;
    } catch (error) {
      if (error instanceof FlashcardGenerationError) {
        throw error;
      }

      // Handle different types of errors (same as real service)
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
   * Simulate error scenarios for testing error handling
   */
  private async simulateErrorScenarios(): Promise<void> {
    // Randomly simulate different error conditions for testing
    const errorRate = 0.05; // 5% chance of error
    const randomValue = Math.random();

    if (randomValue < errorRate) {
      const errorType = Math.floor(Math.random() * 4);

      switch (errorType) {
        case 0:
          throw new FlashcardGenerationError("Invalid API key for AI service", undefined, 401);
        case 1:
          throw new FlashcardGenerationError("AI service rate limit exceeded. Please try again later.", undefined, 429);
        case 2:
          throw new FlashcardGenerationError("AI service returned invalid response format", undefined, 502);
        case 3:
          const timeoutError = new Error("Request timeout");
          timeoutError.name = "AbortError";
          throw timeoutError;
      }
    }
  }

  /**
   * Simulate network delay for realistic testing
   */
  private async simulateDelay(): Promise<void> {
    const delay = Math.random() * 1000 + 500; // 500-1500ms delay
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Generate contextual mock flashcards based on input text
   */
  private generateMockFlashcards(text: string, count: number): AIGeneratedFlashcard[] {
    const mockTemplates = this.getMockTemplates(text);
    const selectedTemplates = this.selectRandomTemplates(mockTemplates, count);

    return selectedTemplates.map((template, index) => ({
      question: template.question,
      answer: template.answer,
    }));
  }

  /**
   * Get mock templates based on text content analysis
   */
  private getMockTemplates(text: string): { question: string; answer: string }[] {
    const lowerText = text.toLowerCase();

    // Science/Biology content
    if (lowerText.includes("photosynthesis") || lowerText.includes("plant") || lowerText.includes("cell")) {
      return [
        {
          question: "What is photosynthesis?",
          answer:
            "Photosynthesis is the process by which plants convert light energy into chemical energy using chlorophyll.",
        },
        {
          question: "Where does photosynthesis occur in plant cells?",
          answer: "Photosynthesis occurs in the chloroplasts of plant cells.",
        },
        {
          question: "What are the main stages of photosynthesis?",
          answer: "The main stages are light-dependent reactions and the Calvin cycle (light-independent reactions).",
        },
        {
          question: "What are the inputs and outputs of photosynthesis?",
          answer: "Inputs: carbon dioxide, water, and sunlight. Outputs: glucose and oxygen.",
        },
        {
          question: "Why is photosynthesis important for life on Earth?",
          answer:
            "Photosynthesis produces oxygen and forms the base of most food chains by converting solar energy into chemical energy.",
        },
      ];
    }

    // Programming/Technology content
    if (lowerText.includes("javascript") || lowerText.includes("programming") || lowerText.includes("code")) {
      return [
        {
          question: "What is JavaScript?",
          answer:
            "JavaScript is a high-level, interpreted programming language used for web development and other applications.",
        },
        {
          question: "What are the main data types in JavaScript?",
          answer: "The main data types are: number, string, boolean, undefined, null, object, and symbol.",
        },
        {
          question: "What is the difference between let, const, and var?",
          answer:
            "let and const have block scope and are not hoisted, while var has function scope. const cannot be reassigned.",
        },
        {
          question: "What is a closure in JavaScript?",
          answer:
            "A closure is a function that has access to variables in its outer (enclosing) lexical scope even after the outer function has returned.",
        },
        {
          question: "What is the DOM?",
          answer:
            "The DOM (Document Object Model) is a programming interface that represents HTML documents as a tree structure of objects.",
        },
      ];
    }

    // History content
    if (lowerText.includes("world war") || lowerText.includes("history") || lowerText.includes("century")) {
      return [
        {
          question: "When did World War II begin and end?",
          answer: "World War II began on September 1, 1939, and ended on September 2, 1945.",
        },
        {
          question: "What were the main Allied powers in World War II?",
          answer: "The main Allied powers were the United States, United Kingdom, Soviet Union, and China.",
        },
        {
          question: "What was the Holocaust?",
          answer:
            "The Holocaust was the systematic persecution and murder of six million Jews and millions of others by Nazi Germany.",
        },
        {
          question: "What was D-Day?",
          answer:
            "D-Day was the Allied invasion of Nazi-occupied France on June 6, 1944, marking the beginning of the liberation of Western Europe.",
        },
        {
          question: "What led to the end of World War II in the Pacific?",
          answer:
            "The atomic bombings of Hiroshima and Nagasaki in August 1945 led to Japan's surrender and the end of the war.",
        },
      ];
    }

    // Mathematics content
    if (lowerText.includes("equation") || lowerText.includes("math") || lowerText.includes("algebra")) {
      return [
        {
          question: "What is the quadratic formula?",
          answer:
            "The quadratic formula is x = (-b ± √(b²-4ac)) / (2a), used to solve quadratic equations of the form ax² + bx + c = 0.",
        },
        {
          question: "What is the Pythagorean theorem?",
          answer: "The Pythagorean theorem states that in a right triangle, a² + b² = c², where c is the hypotenuse.",
        },
        {
          question: "What is the derivative of x²?",
          answer: "The derivative of x² is 2x.",
        },
        {
          question: "What is the fundamental theorem of calculus?",
          answer:
            "It establishes the relationship between differentiation and integration, showing they are inverse operations.",
        },
        {
          question: "What is a prime number?",
          answer:
            "A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.",
        },
      ];
    }

    // Generic content fallback
    return [
      {
        question: "What is the main topic of this text?",
        answer: "The main topic involves the key concepts and ideas presented in the provided material.",
      },
      {
        question: "What are the important points to remember?",
        answer: "The important points include the fundamental concepts and their practical applications.",
      },
      {
        question: "How do the concepts relate to each other?",
        answer: "The concepts are interconnected through shared principles and common applications.",
      },
      {
        question: "Why is this information significant?",
        answer:
          "This information is significant because it provides essential knowledge for understanding the subject area.",
      },
      {
        question: "What are the practical applications?",
        answer:
          "The practical applications involve real-world scenarios where these concepts can be applied effectively.",
      },
      {
        question: "What should you focus on when studying this material?",
        answer:
          "Focus on understanding the core principles, their relationships, and how they apply in different contexts.",
      },
      {
        question: "How can you remember these concepts better?",
        answer:
          "Use active recall, create connections between ideas, and practice applying the concepts in various scenarios.",
      },
      {
        question: "What are common misconceptions about this topic?",
        answer:
          "Common misconceptions often arise from oversimplifying complex relationships or misunderstanding key terminology.",
      },
    ];
  }

  /**
   * Select random templates up to the requested count
   */
  private selectRandomTemplates(
    templates: { question: string; answer: string }[],
    count: number
  ): { question: string; answer: string }[] {
    // Shuffle the templates array
    const shuffled = [...templates].sort(() => Math.random() - 0.5);

    // Return the requested number of templates
    return shuffled.slice(0, Math.min(count, templates.length));
  }
}

/**
 * Singleton instance of the flashcard generation service (mock implementation)
 */
export const flashcardGenerationService = new FlashcardGenerationService();
