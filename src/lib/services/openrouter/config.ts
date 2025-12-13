/**
 * OpenRouter Service Configuration
 *
 * This module provides configuration constants and validation utilities
 * for the OpenRouter service integration.
 */

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  BASE_URL: "https://openrouter.ai/api/v1",
  DEFAULT_MODEL: "anthropic/claude-3-5-sonnet",
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RATE_LIMIT_DELAY: 1000, // 1 second
  MAX_MESSAGE_LENGTH: 100000,
  MAX_SYSTEM_MESSAGE_LENGTH: 10000,
  MAX_MESSAGES_COUNT: 50,
  MAX_TOKENS: 4000,
} as const;

/**
 * Popular model configurations
 */
export const POPULAR_MODELS = {
  // Claude models (Anthropic)
  CLAUDE_3_5_SONNET: "anthropic/claude-3-5-sonnet",
  CLAUDE_3_OPUS: "anthropic/claude-3-opus",
  CLAUDE_3_HAIKU: "anthropic/claude-3-haiku",

  // GPT models (OpenAI)
  GPT_4O: "openai/gpt-4o",
  GPT_4: "openai/gpt-4",
  GPT_3_5_TURBO: "openai/gpt-3.5-turbo",

  // Other popular models
  LLAMA_3_1_8B: "meta-llama/llama-3.1-8b-instruct",
  GEMINI_PRO: "google/gemini-pro-1.5",
  COMMAND_R_PLUS: "cohere/command-r-plus",
} as const;

/**
 * Model categories for easier selection
 */
export const MODEL_CATEGORIES = {
  RECOMMENDED: [POPULAR_MODELS.CLAUDE_3_5_SONNET, POPULAR_MODELS.GPT_4O, POPULAR_MODELS.GEMINI_PRO],
  FAST_AND_CHEAP: [POPULAR_MODELS.CLAUDE_3_HAIKU, POPULAR_MODELS.GPT_3_5_TURBO, POPULAR_MODELS.LLAMA_3_1_8B],
  MOST_CAPABLE: [POPULAR_MODELS.CLAUDE_3_OPUS, POPULAR_MODELS.GPT_4, POPULAR_MODELS.CLAUDE_3_5_SONNET],
} as const;

/**
 * Environment variable names
 */
export const ENV_VARIABLES = {
  API_KEY: "OPENROUTER_API_KEY",
  BASE_URL: "OPENROUTER_BASE_URL",
  DEFAULT_MODEL: "OPENROUTER_DEFAULT_MODEL",
  PUBLIC_APP_URL: "PUBLIC_APP_URL",
} as const;

/**
 * API key validation pattern
 */
export const API_KEY_PATTERN = /^sk-or-v1-[a-zA-Z0-9]{64}$/;

/**
 * Configuration validation utilities
 */
export const ConfigValidator = {
  /**
   * Validate API key format
   */
  validateApiKey(apiKey: string): boolean {
    return typeof apiKey === "string" && apiKey.trim() !== "" && API_KEY_PATTERN.test(apiKey.trim());
  },

  /**
   * Validate base URL format
   */
  validateBaseUrl(baseUrl: string): boolean {
    try {
      const url = new URL(baseUrl);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  },

  /**
   * Validate model ID format
   */
  validateModelId(modelId: string): boolean {
    return typeof modelId === "string" && modelId.trim() !== "" && /^[a-zA-Z0-9\-_/.]+$/.test(modelId);
  },

  /**
   * Get configuration from environment variables
   */
  getConfigFromEnv(): {
    apiKey?: string;
    baseUrl?: string;
    defaultModel?: string;
    publicAppUrl?: string;
  } {
    // Access environment variables based on runtime environment
    const env =
      typeof globalThis !== "undefined" && "process" in globalThis && globalThis.process?.env
        ? globalThis.process.env
        : typeof window === "undefined" && typeof process !== "undefined"
          ? process.env
          : {};

    return {
      apiKey: env[ENV_VARIABLES.API_KEY],
      baseUrl: env[ENV_VARIABLES.BASE_URL],
      defaultModel: env[ENV_VARIABLES.DEFAULT_MODEL],
      publicAppUrl: env[ENV_VARIABLES.PUBLIC_APP_URL],
    };
  },

  /**
   * Validate complete configuration
   */
  validateConfig(config: { apiKey: string; baseUrl?: string; defaultModel?: string }): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate API key
    if (!this.validateApiKey(config.apiKey)) {
      if (!config.apiKey || config.apiKey.trim() === "") {
        errors.push("API key is required");
      } else {
        errors.push("API key format is invalid. Expected format: sk-or-v1-[64-character-string]");
      }
    }

    // Validate base URL if provided
    if (config.baseUrl && !this.validateBaseUrl(config.baseUrl)) {
      errors.push("Base URL format is invalid");
    }

    // Validate model ID if provided
    if (config.defaultModel && !this.validateModelId(config.defaultModel)) {
      errors.push("Default model ID format is invalid");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

/**
 * Configuration builder utility
 */
export class ConfigBuilder {
  private config: Partial<{
    apiKey: string;
    baseUrl: string;
    defaultModel: string;
    timeout: number;
    maxRetries: number;
    rateLimitDelay: number;
  }> = {};

  /**
   * Set API key
   */
  apiKey(key: string): this {
    this.config.apiKey = key;
    return this;
  }

  /**
   * Set base URL
   */
  baseUrl(url: string): this {
    this.config.baseUrl = url;
    return this;
  }

  /**
   * Set default model
   */
  defaultModel(model: string): this {
    this.config.defaultModel = model;
    return this;
  }

  /**
   * Set timeout
   */
  timeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  /**
   * Set max retries
   */
  maxRetries(count: number): this {
    this.config.maxRetries = count;
    return this;
  }

  /**
   * Set rate limit delay
   */
  rateLimitDelay(ms: number): this {
    this.config.rateLimitDelay = ms;
    return this;
  }

  /**
   * Load configuration from environment variables
   */
  fromEnvironment(): this {
    const envConfig = ConfigValidator.getConfigFromEnv();

    if (envConfig.apiKey) {
      this.config.apiKey = envConfig.apiKey;
    }

    if (envConfig.baseUrl) {
      this.config.baseUrl = envConfig.baseUrl;
    }

    if (envConfig.defaultModel) {
      this.config.defaultModel = envConfig.defaultModel;
    }

    return this;
  }

  /**
   * Build final configuration with defaults
   */
  build(): {
    apiKey: string;
    baseUrl: string;
    defaultModel: string;
    timeout: number;
    maxRetries: number;
    rateLimitDelay: number;
  } {
    if (!this.config.apiKey) {
      throw new Error("API key is required");
    }

    return {
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl || DEFAULT_CONFIG.BASE_URL,
      defaultModel: this.config.defaultModel || DEFAULT_CONFIG.DEFAULT_MODEL,
      timeout: this.config.timeout || DEFAULT_CONFIG.TIMEOUT,
      maxRetries: this.config.maxRetries || DEFAULT_CONFIG.MAX_RETRIES,
      rateLimitDelay: this.config.rateLimitDelay || DEFAULT_CONFIG.RATE_LIMIT_DELAY,
    };
  }
}

/**
 * Predefined configurations for common scenarios
 */
export const PRESET_CONFIGS = {
  /**
   * Development configuration with extended timeouts and retries
   */
  DEVELOPMENT: {
    timeout: 60000,
    maxRetries: 5,
    rateLimitDelay: 2000,
  },

  /**
   * Production configuration optimized for performance
   */
  PRODUCTION: {
    timeout: 30000,
    maxRetries: 3,
    rateLimitDelay: 1000,
  },

  /**
   * High-volume configuration with aggressive rate limiting
   */
  HIGH_VOLUME: {
    timeout: 15000,
    maxRetries: 2,
    rateLimitDelay: 500,
  },

  /**
   * Conservative configuration for sensitive applications
   */
  CONSERVATIVE: {
    timeout: 45000,
    maxRetries: 5,
    rateLimitDelay: 3000,
  },
} as const;
