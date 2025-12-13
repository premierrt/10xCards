# OpenRouter Service Documentation

## Overview

The OpenRouter Service provides a TypeScript-based integration layer for communicating with the OpenRouter API. It enables seamless interaction with various AI models through a unified interface while handling authentication, error management, and response formatting.

## Configuration

### Required Environment Variables

Add the following variables to your `.env` file:

```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=sk-or-v1-your-64-character-api-key-here
PUBLIC_APP_URL=http://localhost:4321
```

### Optional Environment Variables

```bash
# Optional OpenRouter Configuration
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3-5-sonnet
```

### Environment Variable Descriptions

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | ✅ | - | Your OpenRouter API key. Format: `sk-or-v1-[64-character-string]` |
| `PUBLIC_APP_URL` | ✅ | `http://localhost:4321` | Your application's public URL used for HTTP-Referer header |
| `OPENROUTER_BASE_URL` | ❌ | `https://openrouter.ai/api/v1` | Custom OpenRouter API base URL |
| `OPENROUTER_DEFAULT_MODEL` | ❌ | `anthropic/claude-3-5-sonnet` | Default AI model to use when not specified |

### Getting an OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign up for an account
3. Navigate to your dashboard
4. Generate a new API key
5. Copy the key (format: `sk-or-v1-...`)

⚠️ **Security Warning**: Never commit your API key to version control. Always use environment variables.

## Service Configuration Options

When initializing the `OpenRouterService`, you can provide additional configuration:

```typescript
const service = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY!, // Required
  baseUrl: 'https://openrouter.ai/api/v1', // Optional
  defaultModel: 'anthropic/claude-3-5-sonnet', // Optional
  timeout: 30000, // Optional: Request timeout in ms
  maxRetries: 3, // Optional: Maximum retry attempts
  rateLimitDelay: 1000 // Optional: Delay between requests in ms
});
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `apiKey` | string | **Required** | OpenRouter API key |
| `baseUrl` | string | `https://openrouter.ai/api/v1` | API base URL |
| `defaultModel` | string | `anthropic/claude-3-5-sonnet` | Default model ID |
| `timeout` | number | `30000` | Request timeout in milliseconds |
| `maxRetries` | number | `3` | Maximum retry attempts for failed requests |
| `rateLimitDelay` | number | `1000` | Minimum delay between requests in milliseconds |

## Available Models

Popular models available through OpenRouter:

### Claude Models (Anthropic)
- `anthropic/claude-3-5-sonnet` - Most capable model (recommended)
- `anthropic/claude-3-opus` - Most intelligent model
- `anthropic/claude-3-haiku` - Fastest model

### GPT Models (OpenAI)
- `openai/gpt-4o` - Latest GPT-4 model
- `openai/gpt-4` - Standard GPT-4
- `openai/gpt-3.5-turbo` - Cost-effective option

### Other Models
- `meta-llama/llama-3.1-8b-instruct` - Open source option
- `google/gemini-pro-1.5` - Google's latest model
- `cohere/command-r-plus` - Cohere's flagship model

To get an up-to-date list of available models, use:
```typescript
const models = await service.listModels();
```

## Error Handling

The service provides comprehensive error handling with specific error types:

### Error Types

- `AuthenticationError` - Invalid or missing API key
- `RateLimitError` - Too many requests or quota exceeded  
- `ValidationError` - Invalid request parameters
- `ModelNotFoundError` - Specified model doesn't exist
- `NetworkError` - Connection issues
- `ServerError` - OpenRouter API server errors

### Example Error Handling

```typescript
try {
  const response = await service.createChatCompletion({
    messages: [{ role: 'user', content: 'Hello!' }]
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Check your API key');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited, retry after:', error.retryAfter);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Security Best Practices

### API Key Security
- Store API keys in environment variables only
- Never hardcode keys in source code
- Use different keys for development and production
- Rotate keys regularly
- Monitor usage for unusual patterns

### Request Validation
- All requests are validated using Zod schemas
- Input sanitization prevents injection attacks
- Content length limits prevent abuse
- Rate limiting prevents excessive usage

### Data Privacy
- No sensitive data is logged in production
- HTTPS is required for all communications
- Request/response data is not cached by default
- Implement proper GDPR compliance measures

## Monitoring and Debugging

### Performance Metrics
The API endpoint includes performance metrics in responses:

```json
{
  "choices": [...],
  "_metadata": {
    "processingTimeMs": 1250,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "apiVersion": "v1"
  }
}
```

### Debug Information
In development mode, additional error details are included:

```json
{
  "error": "Invalid model parameter",
  "code": "VALIDATION_ERROR",
  "type": "ValidationError",
  "details": {
    "parameter": "temperature",
    "value": 3.0,
    "expected": "0-2"
  }
}
```

### Rate Limiting Information
Rate limiting status can be monitored:

```typescript
const currentDelay = service.getCurrentRateLimit();
const retryCount = service.getRetryCount();
```

## Troubleshooting

### Common Issues

#### Invalid API Key
```
AuthenticationError: Invalid API key
```
**Solution**: Verify your API key format and ensure it's properly set in environment variables.

#### Rate Limiting
```
RateLimitError: Too many requests
```
**Solution**: The service automatically handles retries with exponential backoff. Consider increasing `rateLimitDelay`.

#### Model Not Found
```
ModelNotFoundError: Model 'invalid-model' not found
```
**Solution**: Use `listModels()` to get available models or check the OpenRouter documentation.

#### Network Timeouts
```
NetworkError: Request timeout
```
**Solution**: Increase the `timeout` configuration or check your network connection.

### Development vs Production

#### Development Environment
- Detailed error messages with stack traces
- Extended timeout periods for debugging
- Additional logging and performance metrics

#### Production Environment  
- Sanitized error messages
- Optimized timeout and retry settings
- Minimal logging to protect privacy

## Support and Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Model List](https://openrouter.ai/models)
- [OpenRouter Pricing](https://openrouter.ai/pricing)
- [API Status Page](https://status.openrouter.ai/)

## Version History

### v1.0.0
- Initial implementation
- Chat completions support
- Comprehensive error handling
- Rate limiting and retry logic
- JSON Schema response formatting
- Model management methods