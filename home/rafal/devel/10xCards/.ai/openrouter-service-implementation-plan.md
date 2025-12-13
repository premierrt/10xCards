# OpenRouter Service Implementation Plan

## 1. Service Description

The OpenRouter Service is a TypeScript-based integration layer that facilitates communication between the application and the OpenRouter API for LLM chat completions. This service handles API requests, response formatting, error handling, and provides a clean abstraction for interacting with various AI models through OpenRouter's unified interface.

### Key Features:
- Support for multiple AI models through a single API endpoint
- Structured response formatting using JSON Schema
- Comprehensive error handling and retry logic
- Type-safe interfaces for requests and responses
- Configurable model parameters and system prompts

## 2. Constructor Description

```typescript
constructor(options: OpenRouterServiceOptions)
```

The constructor initializes the OpenRouter service with the following configuration:

### Parameters:
- `apiKey: string` - The OpenRouter API key for authentication
- `baseUrl?: string` - Optional custom base URL (defaults to 'https://openrouter.ai/api/v1')
- `defaultModel?: string` - Default model to use if not specified in requests
- `timeout?: number` - Request timeout in milliseconds (default: 30000)
- `maxRetries?: number` - Maximum retry attempts for failed requests (default: 3)
- `rateLimitDelay?: number` - Delay between requests in milliseconds

### Initialization Tasks:
1. Validate API key format
2. Initialize HTTP client with headers and timeout
3. Set up retry mechanism
4. Configure default model and parameters

## 3. Public Methods and Fields

### 3.1 `createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse>`

Main method for creating chat completions with AI models.

#### Parameters:
```typescript
interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  responseFormat?: ResponseFormat;
  stream?: boolean;
}
```

#### Response:
```typescript
interface ChatCompletionResponse {
  id: string;
  choices: Choice[];
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### 3.2 `listModels(): Promise<Model[]>`

Retrieves the list of available models from OpenRouter.

### 3.3 `getModelInfo(modelId: string): Promise<ModelInfo>`

Gets detailed information about a specific model.

### 3.4 Public Fields:
- `readonly apiKey: string` - The configured API key (write-only for security)
- `readonly baseUrl: string` - The base URL for API requests

## 4. Private Methods and Fields

### 4.1 `_makeRequest<T>(endpoint: string, options: RequestOptions): Promise<T>`

Internal method for making HTTP requests with retry logic and error handling.

### 4.2 `_formatMessages(messages: ChatMessage[], systemMessage?: string): FormattedMessage[]`

Formats user messages and system prompts according to OpenRouter API requirements.

### 4.3 `_validateResponseFormat(format?: ResponseFormat): void`

Validates JSON Schema response format structure.

### 4.4 `_handleApiError(error: ApiError): void`

Processes API errors and throws appropriate custom exceptions.

### 4.5 Private Fields:
- `_httpClient: HttpClient` - Internal HTTP client instance
- `_retryCount: Map<string, number>` - Tracks retry attempts per request
- `_rateLimiter: RateLimiter` - Manages API rate limiting

## 5. Error Handling

### 5.1 Error Types

```typescript
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

export class AuthenticationError extends OpenRouterError {}
export class RateLimitError extends OpenRouterError {}
export class ModelNotFoundError extends OpenRouterError {}
export class ValidationError extends OpenRouterError {}
export class NetworkError extends OpenRouterError {}
```

### 5.2 Error Scenarios

1. **Authentication Errors** (401)
   - Invalid API key
   - Expired API key
   - Missing authentication headers

2. **Rate Limit Errors** (429)
   - Too many requests
   - Quota exceeded
   - Implement exponential backoff

3. **Validation Errors** (400)
   - Invalid model parameters
   - Malformed request body
   - Invalid response format schema

4. **Network Errors**
   - Connection timeout
   - DNS resolution failures
   - Network unreachable

5. **Server Errors** (5xx)
   - OpenRouter API downtime
   - Internal server errors
   - Gateway timeouts

### 5.3 Error Handling Strategy

```typescript
try {
  // API call
} catch (error) {
  if (error.response) {
    // Handle HTTP errors
    switch (error.response.status) {
      case 401:
        throw new AuthenticationError('Invalid API key', 'AUTH_INVALID_KEY');
      case 429:
        // Implement retry with backoff
        await this._handleRateLimit(error);
        break;
      case 400:
        throw new ValidationError(error.response.data.message, 'VALIDATION_ERROR');
      default:
        throw new OpenRouterError(
          error.response.data.message || 'Unknown error',
          'API_ERROR',
          error.response.status
        );
    }
  } else if (error.request) {
    // Handle network errors
    throw new NetworkError('Network request failed', 'NETWORK_ERROR');
  } else {
    // Handle other errors
    throw new OpenRouterError(error.message, 'UNKNOWN_ERROR');
  }
}
```

## 6. Security Considerations

### 6.1 API Key Management
- Never expose API keys in client-side code
- Store API keys in environment variables
- Use server-side endpoints to proxy requests
- Implement key rotation mechanism

### 6.2 Input Validation
- Sanitize all user inputs before sending to API
- Validate message content length
- Check for injection attempts in system prompts
- Validate JSON Schema structures

### 6.3 Rate Limiting
- Implement client-side rate limiting
- Track API usage per user/session
- Set up alerts for unusual usage patterns
- Cache responses where appropriate

### 6.4 Data Privacy
- Don't log sensitive conversation content
- Implement data retention policies
- Ensure GDPR compliance
- Use HTTPS for all communications

## 7. Step-by-Step Implementation Plan

### Step 1: Project Setup

1. Create the service directory structure:
```bash
src/lib/services/openrouter/
├── index.ts
├── types.ts
├── errors.ts
├── client.ts
└── __tests__/
    └── openrouter.test.ts
```

2. Install required dependencies:
```bash
npm install axios zod
npm install -D @types/axios
```

### Step 2: Define Types and Interfaces

Create `types.ts`:
```typescript
// Message types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Response format for structured outputs
export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, any>;
  };
}

// Model parameters
export interface ModelParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// Example response format:
const exampleResponseFormat: ResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'flashcard_generation',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        flashcards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' },
              difficulty: { 
                type: 'string',
                enum: ['easy', 'medium', 'hard']
              }
            },
            required: ['question', 'answer']
          }
        },
        metadata: {
          type: 'object',
          properties: {
            totalCards: { type: 'number' },
            topic: { type: 'string' }
          }
        }
      },
      required: ['flashcards']
    }
  }
};
```

### Step 3: Implement Error Classes

Create `errors.ts`:
```typescript
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'OpenRouterError';
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }
}

// Specific error types...
```

### Step 4: Implement the HTTP Client

Create `client.ts`:
```typescript
import axios, { AxiosInstance } from 'axios';

export class HttpClient {
  private client: AxiosInstance;

  constructor(apiKey: string, baseUrl: string, timeout: number) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.PUBLIC_APP_URL || 'http://localhost:4321',
        'X-Title': '10xCards'
      }
    });
  }

  // Implementation...
}
```

### Step 5: Implement the Main Service

Create `index.ts`:
```typescript
import { HttpClient } from './client';
import { ChatCompletionOptions, ChatCompletionResponse } from './types';
import { OpenRouterError, ValidationError } from './errors';

export class OpenRouterService {
  private httpClient: HttpClient;
  private defaultModel: string;

  constructor(options: OpenRouterServiceOptions) {
    // Validate API key
    if (!options.apiKey || options.apiKey.trim() === '') {
      throw new ValidationError('API key is required', 'INVALID_API_KEY');
    }

    // Initialize HTTP client
    this.httpClient = new HttpClient(
      options.apiKey,
      options.baseUrl || 'https://openrouter.ai/api/v1',
      options.timeout || 30000
    );

    this.defaultModel = options.defaultModel || 'anthropic/claude-3-5-sonnet';
  }

  async createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    // Validate inputs
    if (!options.messages || options.messages.length === 0) {
      throw new ValidationError('Messages array cannot be empty', 'INVALID_MESSAGES');
    }

    // Format messages with system prompt if provided
    const formattedMessages = this._formatMessages(options.messages, options.systemMessage);

    // Build request body
    const requestBody = {
      model: options.model || this.defaultModel,
      messages: formattedMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
      response_format: options.responseFormat,
      stream: options.stream ?? false
    };

    // Validate response format if provided
    if (options.responseFormat) {
      this._validateResponseFormat(options.responseFormat);
    }

    try {
      const response = await this.httpClient.post<ChatCompletionResponse>(
        '/chat/completions',
        requestBody
      );
      return response.data;
    } catch (error) {
      this._handleApiError(error);
    }
  }

  private _formatMessages(messages: ChatMessage[], systemMessage?: string): ChatMessage[] {
    const formattedMessages: ChatMessage[] = [];
    
    // Add system message if provided
    if (systemMessage) {
      formattedMessages.push({
        role: 'system',
        content: systemMessage
      });
    }

    // Add user messages
    formattedMessages.push(...messages);

    return formattedMessages;
  }

  private _validateResponseFormat(format: ResponseFormat): void {
    if (format.type !== 'json_schema') {
      throw new ValidationError('Invalid response format type', 'INVALID_FORMAT_TYPE');
    }

    if (!format.json_schema.name || typeof format.json_schema.name !== 'string') {
      throw new ValidationError('Response format must have a name', 'INVALID_FORMAT_NAME');
    }

    if (!format.json_schema.schema || typeof format.json_schema.schema !== 'object') {
      throw new ValidationError('Response format must have a valid schema', 'INVALID_FORMAT_SCHEMA');
    }
  }

  // Additional methods...
}
```

### Step 6: Create API Endpoint

Create `src/pages/api/openrouter/chat.ts`:
```typescript
import type { APIRoute } from 'astro';
import { OpenRouterService } from '@/lib/services/openrouter';
import { z } from 'zod';

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })),
  model: z.string().optional(),
  systemMessage: z.string().optional(),
  responseFormat: z.object({
    type: z.literal('json_schema'),
    json_schema: z.object({
      name: z.string(),
      strict: z.boolean(),
      schema: z.record(z.any())
    })
  }).optional()
});

export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate request body
    const body = await request.json();
    const validatedData = requestSchema.parse(body);

    // Initialize service
    const openRouterService = new OpenRouterService({
      apiKey: import.meta.env.OPENROUTER_API_KEY
    });

    // Make API call
    const response = await openRouterService.createChatCompletion(validatedData);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    // Handle errors
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid request data', details: error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (error instanceof OpenRouterError) {
      return new Response(JSON.stringify({ error: error.message, code: error.code }), {
        status: error.statusCode || 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### Step 7: Environment Configuration

Add to `.env`:
```bash
OPENROUTER_API_KEY=your_api_key_here
PUBLIC_APP_URL=http://localhost:4321
```

Update `.env.example`:
```bash
# OpenRouter Configuration
OPENROUTER_API_KEY=
PUBLIC_APP_URL=http://localhost:4321
```

### Step 8: Testing Implementation

Create `__tests__/openrouter.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { OpenRouterService } from '../index';

describe('OpenRouterService', () => {
  it('should create chat completion with proper formatting', async () => {
    const service = new OpenRouterService({
      apiKey: 'test-key'
    });

    // Mock HTTP client
    vi.spyOn(service['httpClient'], 'post').mockResolvedValue({
      data: {
        id: 'test-id',
        choices: [{
          message: { role: 'assistant', content: 'Test response' }
        }],
        model: 'test-model',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
      }
    });

    const response = await service.createChatCompletion({
      messages: [{ role: 'user', content: 'Hello' }],
      systemMessage: 'You are a helpful assistant',
      responseFormat: {
        type: 'json_schema',
        json_schema: {
          name: 'test_schema',
          strict: true,
          schema: { type: 'object' }
        }
      }
    });

    expect(response.choices[0].message.content).toBe('Test response');
  });
});
```

### Step 9: Integration Example

Example usage in a React component:
```typescript
// src/components/ChatInterface.tsx
import { useState } from 'react';

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (content: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/openrouter/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content }],
          systemMessage: 'You are a helpful flashcard generator.',
          responseFormat: {
            type: 'json_schema',
            json_schema: {
              name: 'flashcard_response',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  flashcards: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        question: { type: 'string' },
                        answer: { type: 'string' }
                      },
                      required: ['question', 'answer']
                    }
                  }
                },
                required: ['flashcards']
              }
            }
          }
        })
      });

      const data = await response.json();
      // Handle response...
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Component implementation...
}
```

### Step 10: Deployment Considerations

1. **Environment Variables**: Ensure OPENROUTER_API_KEY is set in production
2. **Rate Limiting**: Implement user-based rate limiting in production
3. **Monitoring**: Set up logging and error tracking
4. **Caching**: Consider caching common responses
5. **Security**: Implement CORS policies and request validation

This completes the comprehensive implementation plan for the OpenRouter service integration.