/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-extraneous-class, no-case-declarations */
/**
 * Base error class for OpenRouter service errors
 */
export class OpenRouterError extends Error {
  public readonly name: string = "OpenRouterError";

  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, OpenRouterError.prototype);

    // Ensure the error stack trace points to the actual error location
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging purposes
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Authentication-related errors (401 responses)
 */
export class AuthenticationError extends OpenRouterError {
  public readonly name: string = "AuthenticationError";

  constructor(message: string, code = "AUTH_ERROR", details?: any) {
    super(message, code, 401, details);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Rate limiting errors (429 responses)
 */
export class RateLimitError extends OpenRouterError {
  public readonly name: string = "RateLimitError";

  constructor(
    message: string,
    code = "RATE_LIMIT_EXCEEDED",
    public readonly retryAfter?: number,
    details?: any
  ) {
    super(message, code, 429, details);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Model not found or unavailable errors (400/404 responses)
 */
export class ModelNotFoundError extends OpenRouterError {
  public readonly name: string = "ModelNotFoundError";

  constructor(message: string, code = "MODEL_NOT_FOUND", details?: any) {
    super(message, code, 404, details);
    Object.setPrototypeOf(this, ModelNotFoundError.prototype);
  }
}

/**
 * Request validation errors (400 responses)
 */
export class ValidationError extends OpenRouterError {
  public readonly name: string = "ValidationError";

  constructor(message: string, code = "VALIDATION_ERROR", details?: any) {
    super(message, code, 400, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Network-related errors (connection issues, timeouts)
 */
export class NetworkError extends OpenRouterError {
  public readonly name: string = "NetworkError";

  constructor(message: string, code = "NETWORK_ERROR", details?: any) {
    super(message, code, undefined, details);
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Server errors from OpenRouter API (5xx responses)
 */
export class ServerError extends OpenRouterError {
  public readonly name: string = "ServerError";

  constructor(message: string, code = "SERVER_ERROR", statusCode = 500, details?: any) {
    super(message, code, statusCode, details);
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Quota exceeded errors (specific type of rate limiting)
 */
export class QuotaExceededError extends RateLimitError {
  public readonly name: string = "QuotaExceededError";

  constructor(message: string, code = "QUOTA_EXCEEDED", details?: any) {
    super(message, code, undefined, details);
    Object.setPrototypeOf(this, QuotaExceededError.prototype);
  }
}

/**
 * Configuration errors (invalid settings, missing credentials)
 */
export class ConfigurationError extends OpenRouterError {
  public readonly name: string = "ConfigurationError";

  constructor(message: string, code = "CONFIGURATION_ERROR", details?: any) {
    super(message, code, undefined, details);
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Error factory for creating appropriate error types based on HTTP status codes
 */
export class ErrorFactory {
  static fromHttpResponse(statusCode: number, message: string, responseData?: any): OpenRouterError {
    const details = responseData?.error || responseData;
    const errorMessage = responseData?.error?.message || message;
    const errorCode = responseData?.error?.code || responseData?.code;

    switch (statusCode) {
      case 400:
        if (errorCode === "model_not_found" || errorMessage.toLowerCase().includes("model")) {
          return new ModelNotFoundError(errorMessage, errorCode, details);
        }
        return new ValidationError(errorMessage, errorCode || "VALIDATION_ERROR", details);

      case 401:
        return new AuthenticationError(errorMessage, errorCode || "AUTH_INVALID", details);

      case 403:
        return new AuthenticationError(errorMessage, errorCode || "AUTH_FORBIDDEN", details);

      case 404:
        return new ModelNotFoundError(errorMessage, errorCode || "NOT_FOUND", details);

      case 429:
        const retryAfter = responseData?.headers?.["retry-after"];
        if (errorMessage.toLowerCase().includes("quota")) {
          return new QuotaExceededError(errorMessage, errorCode || "QUOTA_EXCEEDED", details);
        }
        return new RateLimitError(errorMessage, errorCode || "RATE_LIMIT_EXCEEDED", retryAfter, details);

      case 500:
      case 502:
      case 503:
      case 504:
        return new ServerError(errorMessage, errorCode || "SERVER_ERROR", statusCode, details);

      default:
        return new OpenRouterError(errorMessage, errorCode || "UNKNOWN_ERROR", statusCode, details);
    }
  }

  static fromNetworkError(error: any): NetworkError {
    if (error.code === "ECONNABORTED") {
      return new NetworkError("Request timeout", "TIMEOUT_ERROR", { originalError: error });
    }

    if (error.code === "ENOTFOUND") {
      return new NetworkError("DNS resolution failed", "DNS_ERROR", { originalError: error });
    }

    if (error.code === "ECONNREFUSED") {
      return new NetworkError("Connection refused", "CONNECTION_REFUSED", { originalError: error });
    }

    return new NetworkError(error.message || "Network request failed", error.code || "NETWORK_ERROR", {
      originalError: error,
    });
  }
}
