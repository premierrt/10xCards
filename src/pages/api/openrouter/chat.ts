import type { APIRoute } from 'astro';
import { z } from 'zod';
import { OpenRouterService, OpenRouterError, ValidationError } from '@/lib/services/openrouter';

// Request validation schema using Zod
const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(100000)
});

const responseFormatSchema = z.object({
  type: z.literal('json_schema'),
  json_schema: z.object({
    name: z.string().min(1),
    strict: z.boolean(),
    schema: z.record(z.any())
  })
});

const requestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(50),
  model: z.string().optional(),
  systemMessage: z.string().max(10000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(4000).optional(),
  topP: z.number().min(0.01).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  responseFormat: responseFormatSchema.optional(),
  stream: z.boolean().optional().default(false)
});

type ChatRequest = z.infer<typeof requestSchema>;

// Disable prerendering for this API route
export const prerender = false;

/**
 * POST /api/openrouter/chat
 * 
 * Creates a chat completion using OpenRouter's AI models
 */
export const POST: APIRoute = async ({ request }) => {
  const startTime = Date.now();
  
  try {
    // Validate Content-Type header
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          error: 'Content-Type must be application/json',
          code: 'INVALID_CONTENT_TYPE'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse and validate request body
    let requestBody: any;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate request schema
    let validatedData: ChatRequest;
    try {
      validatedData = requestSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: 'Invalid request data',
            code: 'VALIDATION_ERROR',
            details: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message,
              code: err.code
            }))
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Re-throw unexpected errors
      throw error;
    }

    // Check for required environment variables
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY environment variable is not configured');
      return new Response(
        JSON.stringify({
          error: 'Service configuration error',
          code: 'SERVICE_UNAVAILABLE'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize OpenRouter service
    const openRouterService = new OpenRouterService({
      apiKey: apiKey,
      baseUrl: import.meta.env.OPENROUTER_BASE_URL,
      defaultModel: import.meta.env.OPENROUTER_DEFAULT_MODEL,
      timeout: 30000,
      maxRetries: 3
    });

    // Make API call to OpenRouter
    const response = await openRouterService.createChatCompletion({
      messages: validatedData.messages,
      model: validatedData.model,
      systemMessage: validatedData.systemMessage,
      temperature: validatedData.temperature,
      maxTokens: validatedData.maxTokens,
      topP: validatedData.topP,
      frequencyPenalty: validatedData.frequencyPenalty,
      presencePenalty: validatedData.presencePenalty,
      responseFormat: validatedData.responseFormat,
      stream: validatedData.stream
    });

    // Add performance metrics to response
    const processingTime = Date.now() - startTime;
    const responseWithMetrics = {
      ...response,
      _metadata: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        apiVersion: 'v1'
      }
    };

    return new Response(JSON.stringify(responseWithMetrics), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Processing-Time': processingTime.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // Log error for debugging (but don't expose sensitive data)
    console.error('OpenRouter API Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : 'Unknown',
      timestamp: new Date().toISOString(),
      processingTime
    });

    // Handle OpenRouter service errors
    if (error instanceof OpenRouterError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
          type: error.name,
          ...(process.env.NODE_ENV === 'development' && { details: error.details })
        }),
        {
          status: error.statusCode || 500,
          headers: {
            'Content-Type': 'application/json',
            'X-Processing-Time': processingTime.toString()
          }
        }
      );
    }

    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        type: 'ServerError',
        ...(process.env.NODE_ENV === 'development' && { 
          details: error instanceof Error ? error.message : 'Unknown error' 
        })
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Processing-Time': processingTime.toString()
        }
      }
    );
  }
};

/**
 * GET /api/openrouter/chat
 * 
 * Returns API information and available endpoints
 */
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      name: 'OpenRouter Chat API',
      version: '1.0.0',
      description: 'Chat completion endpoint using OpenRouter AI models',
      endpoints: {
        'POST /api/openrouter/chat': 'Create chat completion',
        'GET /api/openrouter/models': 'List available models (coming soon)',
        'GET /api/openrouter/models/:id': 'Get model information (coming soon)'
      },
      supportedMethods: ['POST'],
      documentation: 'https://openrouter.ai/docs'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    }
  );
};