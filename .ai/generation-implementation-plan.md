# API Endpoint Implementation Plan: POST /api/flashcards/generate

## 1. Endpoint Overview

This endpoint generates flashcard proposals from input text using AI models via OpenRouter.ai. It takes user-provided text content and a desired count, then returns an array of generated flashcards with questions and answers. The generated flashcards are saved to the database and returned to the client for review and potential inclusion in flashcard sets.

## 2. Request Details

- **HTTP Method:** POST
- **URL Structure:** `/api/flashcards/generate`
- **Parameters:**
  - **Required:**
    - `text` (string): Input text content to generate flashcards from (1-10,000 characters)
    - `count` (number): Number of flashcards to generate (1-50)
  - **Optional:** None
- **Request Body:**
  ```json
  {
    "text": "Input text content here...",
    "count": 20
  }
  ```
- **Content-Type:** `application/json`
- **Authentication:** Required (JWT token or session-based)

## 3. Used Types

**Existing Types (from types.ts):**

- `GenerateFlashcardsRequest`: Request DTO interface
- `GenerateFlashcardsResponse`: Response type alias
- `GeneratedFlashcard`: Individual flashcard response interface
- `ApiErrorResponse`: Standard error response structure

**New Types Needed:**

- Zod validation schema for request validation
- AI service response interfaces
- Internal service DTOs for AI communication

## 4. Response Details

**Success Response (200 OK):**

```json
[
  {
    "flashcard_id": 1,
    "question": "What is the main concept discussed?",
    "answer": "The main concept is..."
  },
  {
    "flashcard_id": 2,
    "question": "How does X relate to Y?",
    "answer": "X relates to Y by..."
  }
]
```

**Error Responses:**

- **400 Bad Request:** Invalid input parameters or malformed request
- **401 Unauthorized:** Missing or invalid authentication
- **429 Too Many Requests:** Rate limit exceeded
- **500 Internal Server Error:** AI service failure or database errors

## 5. Data Flow

1. **Request Reception:** Astro API route receives POST request
2. **Authentication Check:** Verify user authentication via Supabase context
3. **Input Validation:** Validate request body using Zod schema
4. **Rate Limiting Check:** Verify user hasn't exceeded generation limits
5. **AI Service Call:** Send text to OpenRouter.ai with optimized prompt
6. **Response Processing:** Parse and validate AI-generated flashcards
7. **Database Storage:** Save flashcards to `flashcards` table with status "generated"
8. **Response Formation:** Return array of generated flashcards with IDs

**External Dependencies:**

- OpenRouter.ai API for AI model access
- Supabase database for flashcard storage
- Authentication service for user verification

## 6. Security Considerations

**Authentication & Authorization:**

- Require valid user authentication (JWT or session)
- Extract user_id from authenticated context
- No additional role-based permissions needed

**Input Validation & Sanitization:**

- Sanitize text input to prevent injection attacks
- Limit text length to prevent excessive AI costs
- Validate count parameter bounds
- Use Zod for comprehensive input validation

**Rate Limiting:**

- Implement per-user rate limiting (e.g., 100 generations per day)
- Consider IP-based rate limiting for additional protection
- Store rate limit counters in database or Redis

**API Security:**

- Secure OpenRouter.ai API key in environment variables
- Use HTTPS for all communications
- Implement request timeout to prevent hanging requests

## 7. Error Handling

**Validation Errors (400):**

- Empty or missing text parameter
- Invalid count parameter (negative, zero, or too large)
- Malformed JSON request body

**Authentication Errors (401):**

- Missing authentication token
- Invalid or expired token
- User not found in database

**Rate Limiting Errors (429):**

- Daily generation limit exceeded
- Too many requests in short timeframe

**Service Errors (500):**

- OpenRouter.ai API unavailable or timeout
- Database connection failures
- AI model returns invalid response format
- Unexpected errors in processing pipeline

**Error Response Format:**

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Text parameter must be between 1 and 10,000 characters",
  "statusCode": 400
}
```

## 8. Performance Considerations

**Optimization Strategies:**

- Cache common AI prompts and responses
- Use database connection pooling
- Implement timeout for AI service calls (30 seconds)
- Consider streaming responses for large generation counts

**Potential Bottlenecks:**

- AI service response time (typically 5-15 seconds)
- Database write operations for multiple flashcards
- Network latency to OpenRouter.ai

**Monitoring:**

- Track AI service response times
- Monitor database query performance
- Log generation success/failure rates
- Track user generation patterns

## 9. Implementation Steps

1. **Create Zod Validation Schema**
   - Define request validation schema in `src/lib/schemas/flashcard-schemas.ts`
   - Include text length limits and count bounds validation

2. **Implement FlashcardGenerationService**
   - Create `src/lib/services/flashcard-generation.service.ts`
   - Handle OpenRouter.ai API communication
   - Implement prompt engineering for optimal flashcard generation
   - Add error handling and retry logic

3. **Create API Route Handler**
   - Implement `src/pages/api/flashcards/generate.ts`
   - Add authentication check using Supabase context
   - Implement request validation using Zod
   - Add rate limiting logic

4. **Database Operations**
   - Create database helper functions for flashcard insertion
   - Implement batch insert for multiple flashcards
   - Handle database transaction rollback on errors

5. **Add Rate Limiting**
   - Create rate limiting middleware or service
   - Track user generation counts in database
   - Implement daily/hourly limits

6. **Error Handling Implementation**
   - Create custom error classes for different error types
   - Implement comprehensive error logging
   - Add user-friendly error messages

7. **Environment Configuration**
   - Add OpenRouter.ai API key to environment variables
   - Configure AI model selection and parameters
   - Set generation limits and timeouts

8. **Testing**
   - Unit tests for validation schemas
   - Integration tests for AI service communication
   - End-to-end tests for complete API workflow
   - Load testing for rate limiting verification

9. **Documentation**
   - Update API documentation with endpoint details
   - Add usage examples and error scenarios
   - Document rate limiting policies for users

10. **Monitoring and Logging**
    - Implement structured logging for all operations
    - Add performance metrics tracking
    - Set up error alerting for service failures
