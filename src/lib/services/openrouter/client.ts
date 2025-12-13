import axios from "axios";
import type { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { ErrorFactory, OpenRouterError, RateLimitError } from "./errors";

/**
 * Rate limiter for managing API request frequency
 */
class RateLimiter {
  private lastRequestTime = 0;
  private requestCount = 0;
  private resetTime = 0;

  constructor(private delay = 1000) {}

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();

    // Reset counter if enough time has passed
    if (now >= this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + 60000; // Reset every minute
    }

    // Check if we need to delay the request
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.delay) {
      const waitTime = this.delay - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  handleRateLimit(retryAfter?: number): void {
    // Update delay based on rate limit response
    if (retryAfter) {
      this.delay = Math.max(this.delay, retryAfter * 1000);
    } else {
      // Exponential backoff
      this.delay = Math.min(this.delay * 2, 60000);
    }
  }
}

/**
 * HTTP client for OpenRouter API communication
 */
export class HttpClient {
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;
  private retryCount = new Map<string, number>();

  constructor(
    private apiKey: string,
    baseUrl: string,
    timeout: number,
    private maxRetries = 3,
    rateLimitDelay = 1000
  ) {
    this.rateLimiter = new RateLimiter(rateLimitDelay);

    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": this._getRefererUrl(),
        "X-Title": "10xCards",
        "User-Agent": "10xCards/1.0",
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this._handleAxiosError(error)
    );
  }

  /**
   * Make HTTP GET request
   */
  async get<T>(endpoint: string, config?: Record<string, unknown>): Promise<AxiosResponse<T>> {
    return this._makeRequest("GET", endpoint, undefined, config);
  }

  /**
   * Make HTTP POST request
   */
  async post<T>(endpoint: string, data?: unknown, config?: Record<string, unknown>): Promise<AxiosResponse<T>> {
    return this._makeRequest("POST", endpoint, data, config);
  }

  /**
   * Make HTTP PUT request
   */
  async put<T>(endpoint: string, data?: unknown, config?: Record<string, unknown>): Promise<AxiosResponse<T>> {
    return this._makeRequest("PUT", endpoint, data, config);
  }

  /**
   * Make HTTP DELETE request
   */
  async delete<T>(endpoint: string, config?: Record<string, unknown>): Promise<AxiosResponse<T>> {
    return this._makeRequest("DELETE", endpoint, undefined, config);
  }

  /**
   * Internal method for making requests with retry logic
   */
  private async _makeRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data?: unknown,
    config?: Record<string, unknown>
  ): Promise<AxiosResponse<T>> {
    const requestId = `${method}:${endpoint}:${Date.now()}`;
    let currentRetry = 0;

    while (currentRetry <= this.maxRetries) {
      try {
        // Apply rate limiting
        await this.rateLimiter.waitIfNeeded();

        // Make the actual request
        const response = await this.client.request<T>({
          method,
          url: endpoint,
          data,
          ...config,
        });

        // Clear retry count on success
        this.retryCount.delete(requestId);
        return response;
      } catch (error) {
        const isLastAttempt = currentRetry === this.maxRetries;

        // Handle rate limiting with retry
        if (error instanceof RateLimitError && !isLastAttempt) {
          const retryAfter = error.retryAfter;
          this.rateLimiter.handleRateLimit(retryAfter);

          // Wait before retry with exponential backoff
          const backoffDelay = Math.min(1000 * Math.pow(2, currentRetry), 30000);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));

          currentRetry++;
          this.retryCount.set(requestId, currentRetry);
          continue;
        }

        // Handle server errors with retry
        if (error instanceof OpenRouterError && error.statusCode && error.statusCode >= 500 && !isLastAttempt) {
          const backoffDelay = Math.min(1000 * Math.pow(2, currentRetry), 30000);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));

          currentRetry++;
          this.retryCount.set(requestId, currentRetry);
          continue;
        }

        // Re-throw error if no retry needed or max retries reached
        this.retryCount.delete(requestId);
        throw error;
      }
    }

    throw new OpenRouterError("Max retries exceeded", "MAX_RETRIES_EXCEEDED");
  }

  /**
   * Handle axios errors and convert to custom error types
   */
  private _handleAxiosError(error: AxiosError): never {
    // Network errors (no response received)
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        throw ErrorFactory.fromNetworkError(error);
      }
      throw ErrorFactory.fromNetworkError(error);
    }

    // HTTP errors (response received)
    const { status, data, headers } = error.response;
    const responseData =
      typeof data === "object" && data !== null ? (data as Record<string, unknown>) : { message: String(data) };

    // Add headers to response data for rate limit handling
    if (headers["retry-after"]) {
      (responseData as Record<string, unknown>).headers = { "retry-after": parseInt(headers["retry-after"]) };
    }

    throw ErrorFactory.fromHttpResponse(status, error.message, responseData);
  }

  /**
   * Get the referer URL for API requests
   */
  private _getRefererUrl(): string {
    // In server environment, use configured URL
    if (typeof window === "undefined") {
      return process.env.PUBLIC_APP_URL || "http://localhost:4321";
    }

    // In browser environment, use current origin
    return window.location.origin;
  }

  /**
   * Update API key for the client
   */
  updateApiKey(newApiKey: string): void {
    this.apiKey = newApiKey;
    this.client.defaults.headers["Authorization"] = `Bearer ${newApiKey}`;
  }

  /**
   * Get current retry count for debugging
   */
  getRetryCount(requestId?: string): number | Map<string, number> {
    if (requestId) {
      return this.retryCount.get(requestId) || 0;
    }
    return new Map(this.retryCount);
  }

  /**
   * Get current rate limit delay
   */
  getCurrentRateLimit(): number {
    return this.rateLimiter["delay"];
  }
}
