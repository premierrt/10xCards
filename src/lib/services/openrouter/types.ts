// Message types for chat interactions
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Response format for structured outputs using JSON Schema
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
}

// Model parameters for fine-tuning responses
export interface ModelParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// Options for creating chat completions
export interface ChatCompletionOptions extends ModelParameters {
  model?: string;
  messages: ChatMessage[];
  systemMessage?: string;
  responseFormat?: ResponseFormat;
  stream?: boolean;
}

// Configuration options for OpenRouter service initialization
export interface OpenRouterServiceOptions {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
  rateLimitDelay?: number;
}

// Individual choice in API response
export interface Choice {
  index: number;
  message: ChatMessage;
  finishReason?: string;
}

// Token usage statistics
export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Complete chat completion response from API
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
}

// Model information structure
export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  contextLength: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instructType?: string;
  };
}

// Available model structure
export interface Model {
  id: string;
  name: string;
  created: number;
  description?: string;
  contextLength: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instructType?: string;
  };
  pricing: {
    prompt: number;
    completion: number;
  };
  topProvider: {
    maxCompletionTokens?: number;
  };
}

// HTTP request options for internal use
export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

// Formatted message structure for API requests
export interface FormattedMessage extends ChatMessage {
  // Additional fields that might be needed for API formatting
  additionalFields?: Record<string, unknown>;
}

// Example response format for flashcard generation
export const FLASHCARD_RESPONSE_FORMAT: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "flashcard_generation",
    strict: true,
    schema: {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
              difficulty: {
                type: "string",
                enum: ["easy", "medium", "hard"],
              },
              tags: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["question", "answer"],
            additionalProperties: false,
          },
        },
        metadata: {
          type: "object",
          properties: {
            totalCards: { type: "number" },
            topic: { type: "string" },
            difficultyDistribution: {
              type: "object",
              properties: {
                easy: { type: "number" },
                medium: { type: "number" },
                hard: { type: "number" },
              },
            },
          },
          additionalProperties: false,
        },
      },
      required: ["flashcards"],
      additionalProperties: false,
    },
  },
};
