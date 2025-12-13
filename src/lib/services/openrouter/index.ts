import { HttpClient } from "./client";
import { ValidationError, ConfigurationError, OpenRouterError } from "./errors";
import type {
  OpenRouterServiceOptions,
  ChatCompletionOptions,
  ChatCompletionResponse,
  ChatMessage,
  FormattedMessage,
  ResponseFormat,
  Model,
  ModelInfo,
} from "./types";

/**
 * OpenRouter Service for AI model integrations
 *
 * This service provides a clean abstraction layer for interacting with various
 * AI models through OpenRouter's unified API interface.
 */
export class OpenRouterService {
  private readonly httpClient: HttpClient;
  private readonly defaultModel: string;

  // Public readonly fields as specified in the plan
  public readonly apiKey: string;
  public readonly baseUrl: string;

  constructor(options: OpenRouterServiceOptions) {
    // Validate required API key
    if (!options.apiKey || typeof options.apiKey !== "string" || options.apiKey.trim() === "") {
      throw new ConfigurationError("API key is required and must be a non-empty string", "INVALID_API_KEY");
    }

    // Validate API key format (basic check for OpenRouter keys)
    const apiKeyPattern = /^sk-or-v1-[a-zA-Z0-9]{64}$/;
    if (!apiKeyPattern.test(options.apiKey.trim())) {
      // eslint-disable-next-line no-console
      console.warn("API key format does not match expected OpenRouter pattern");
    }

    // Set configuration
    this.apiKey = options.apiKey.trim();
    this.baseUrl = options.baseUrl || "https://openrouter.ai/api/v1";
    this.defaultModel = options.defaultModel || "anthropic/claude-3-5-sonnet";

    // Validate base URL format
    try {
      new URL(this.baseUrl);
    } catch {
      throw new ConfigurationError("Invalid base URL format", "INVALID_BASE_URL", { baseUrl: options.baseUrl });
    }

    // Initialize HTTP client
    this.httpClient = new HttpClient(
      this.apiKey,
      this.baseUrl,
      options.timeout || 30000,
      options.maxRetries || 3,
      options.rateLimitDelay || 1000
    );
  }

  /**
   * Create chat completion with AI models
   *
   * Main method for generating responses using various AI models through OpenRouter
   */
  async createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    // Validate required messages
    if (!options.messages || !Array.isArray(options.messages) || options.messages.length === 0) {
      throw new ValidationError("Messages array is required and cannot be empty", "INVALID_MESSAGES");
    }

    // Validate individual messages
    this._validateMessages(options.messages);

    // Validate response format if provided
    if (options.responseFormat) {
      this._validateResponseFormat(options.responseFormat);
    }

    // Validate model parameter ranges
    this._validateModelParameters(options);

    // Format messages with system prompt if provided
    const formattedMessages = this._formatMessages(options.messages, options.systemMessage);

    // Build request body according to OpenRouter API specification
    const requestBody = {
      model: options.model || this.defaultModel,
      messages: formattedMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      response_format: options.responseFormat,
      stream: options.stream ?? false,
    };

    // Remove undefined values to clean up the request
    const cleanedRequestBody = Object.entries(requestBody).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    try {
      const response = await this.httpClient.post<ChatCompletionResponse>("/chat/completions", cleanedRequestBody);

      // Validate response structure
      this._validateResponse(response.data);

      return response.data;
    } catch (error) {
      // Error handling is delegated to HttpClient and ErrorFactory
      if (error instanceof OpenRouterError) {
        throw error;
      }
      throw new OpenRouterError(error instanceof Error ? error.message : "Unknown error", "UNKNOWN_ERROR");
    }
  }

  /**
   * List available models from OpenRouter
   */
  async listModels(): Promise<Model[]> {
    try {
      const response = await this.httpClient.get<{ data: Model[] }>("/models");

      if (!response.data || !Array.isArray(response.data.data)) {
        throw new OpenRouterError("Invalid models response format", "INVALID_RESPONSE_FORMAT");
      }

      return response.data.data;
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }
      throw new OpenRouterError(error instanceof Error ? error.message : "Unknown error", "UNKNOWN_ERROR");
    }
  }

  /**
   * Get detailed information about a specific model
   */
  async getModelInfo(modelId: string): Promise<ModelInfo> {
    if (!modelId || typeof modelId !== "string" || modelId.trim() === "") {
      throw new ValidationError("Model ID is required and must be a non-empty string", "INVALID_MODEL_ID");
    }

    try {
      const response = await this.httpClient.get<ModelInfo>(`/models/${encodeURIComponent(modelId)}`);
      return response.data;
    } catch (error) {
      if (error instanceof OpenRouterError) {
        throw error;
      }
      throw new OpenRouterError(error instanceof Error ? error.message : "Unknown error", "UNKNOWN_ERROR");
    }
  }

  /**
   * Format messages with system prompt according to OpenRouter requirements
   */
  private _formatMessages(messages: ChatMessage[], systemMessage?: string): FormattedMessage[] {
    const formattedMessages: FormattedMessage[] = [];

    // Add system message if provided
    if (systemMessage && systemMessage.trim() !== "") {
      // Validate system message length (reasonable limit)
      if (systemMessage.length > 10000) {
        throw new ValidationError("System message is too long (max 10,000 characters)", "SYSTEM_MESSAGE_TOO_LONG");
      }

      formattedMessages.push({
        role: "system",
        content: systemMessage.trim(),
      });
    }

    // Add user messages
    formattedMessages.push(
      ...messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))
    );

    return formattedMessages;
  }

  /**
   * Validate JSON Schema response format structure
   */
  private _validateResponseFormat(format: ResponseFormat): void {
    if (!format || typeof format !== "object") {
      throw new ValidationError("Response format must be an object", "INVALID_FORMAT_STRUCTURE");
    }

    if (format.type !== "json_schema") {
      throw new ValidationError("Only json_schema response format type is supported", "INVALID_FORMAT_TYPE");
    }

    if (!format.json_schema || typeof format.json_schema !== "object") {
      throw new ValidationError("json_schema property is required and must be an object", "INVALID_JSON_SCHEMA");
    }

    const { json_schema } = format;

    if (!json_schema.name || typeof json_schema.name !== "string" || json_schema.name.trim() === "") {
      throw new ValidationError("json_schema.name is required and must be a non-empty string", "INVALID_SCHEMA_NAME");
    }

    if (typeof json_schema.strict !== "boolean") {
      throw new ValidationError("json_schema.strict must be a boolean", "INVALID_SCHEMA_STRICT");
    }

    if (!json_schema.schema || typeof json_schema.schema !== "object") {
      throw new ValidationError("json_schema.schema is required and must be an object", "INVALID_SCHEMA_DEFINITION");
    }

    // Basic JSON Schema validation
    if (json_schema.schema.type && typeof json_schema.schema.type !== "string") {
      throw new ValidationError("Schema type must be a string", "INVALID_SCHEMA_TYPE");
    }
  }

  /**
   * Validate individual messages in the array
   */
  private _validateMessages(messages: ChatMessage[]): void {
    messages.forEach((message, index) => {
      if (!message || typeof message !== "object") {
        throw new ValidationError(`Message at index ${index} must be an object`, "INVALID_MESSAGE_STRUCTURE");
      }

      if (!message.role || !["user", "assistant", "system"].includes(message.role)) {
        throw new ValidationError(
          `Message at index ${index} must have a valid role (user, assistant, or system)`,
          "INVALID_MESSAGE_ROLE"
        );
      }

      if (!message.content || typeof message.content !== "string" || message.content.trim() === "") {
        throw new ValidationError(`Message at index ${index} must have non-empty content`, "INVALID_MESSAGE_CONTENT");
      }

      // Validate content length (reasonable limit to prevent abuse)
      if (message.content.length > 100000) {
        throw new ValidationError(`Message at index ${index} is too long (max 100,000 characters)`, "MESSAGE_TOO_LONG");
      }
    });
  }

  /**
   * Validate model parameters are within acceptable ranges
   */
  private _validateModelParameters(options: ChatCompletionOptions): void {
    if (options.temperature !== undefined) {
      if (typeof options.temperature !== "number" || options.temperature < 0 || options.temperature > 2) {
        throw new ValidationError("Temperature must be a number between 0 and 2", "INVALID_TEMPERATURE");
      }
    }

    if (options.maxTokens !== undefined) {
      if (!Number.isInteger(options.maxTokens) || options.maxTokens <= 0) {
        throw new ValidationError("Max tokens must be a positive integer", "INVALID_MAX_TOKENS");
      }
    }

    if (options.topP !== undefined) {
      if (typeof options.topP !== "number" || options.topP <= 0 || options.topP > 1) {
        throw new ValidationError("Top P must be a number between 0 and 1 (exclusive of 0)", "INVALID_TOP_P");
      }
    }

    if (options.frequencyPenalty !== undefined) {
      if (
        typeof options.frequencyPenalty !== "number" ||
        options.frequencyPenalty < -2 ||
        options.frequencyPenalty > 2
      ) {
        throw new ValidationError("Frequency penalty must be a number between -2 and 2", "INVALID_FREQUENCY_PENALTY");
      }
    }

    if (options.presencePenalty !== undefined) {
      if (typeof options.presencePenalty !== "number" || options.presencePenalty < -2 || options.presencePenalty > 2) {
        throw new ValidationError("Presence penalty must be a number between -2 and 2", "INVALID_PRESENCE_PENALTY");
      }
    }
  }

  /**
   * Validate the structure of API response
   */
  private _validateResponse(response: ChatCompletionResponse): void {
    if (!response || typeof response !== "object") {
      throw new OpenRouterError("Invalid response format from API", "INVALID_API_RESPONSE");
    }

    if (!response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
      throw new OpenRouterError("API response must contain at least one choice", "NO_CHOICES_IN_RESPONSE");
    }

    // Validate first choice structure
    const firstChoice = response.choices[0];
    if (!firstChoice.message || !firstChoice.message.content) {
      throw new OpenRouterError("Invalid choice structure in API response", "INVALID_CHOICE_STRUCTURE");
    }
  }
}

// Export all types and classes for external use
export * from "./types";
export * from "./errors";
export { HttpClient } from "./client";
