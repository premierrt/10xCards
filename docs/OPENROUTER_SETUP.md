# OpenRouter Service Setup Guide

This guide will help you configure the OpenRouter service for the 10xCards application.

## Prerequisites

- Node.js 18+ installed
- OpenRouter account and API key
- 10xCards project cloned and set up

## Step 1: Get Your OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for a free account or log in
3. Navigate to your dashboard
4. Click "API Keys" in the sidebar
5. Click "Create API Key"
6. Copy the generated key (format: `sk-or-v1-...`)

## Step 2: Configure Environment Variables

Create or update your `.env` file in the project root:

```bash
# Required: Your OpenRouter API key
OPENROUTER_API_KEY=sk-or-v1-your-64-character-api-key-here

# Required: Your application URL (used for API referrer)
PUBLIC_APP_URL=http://localhost:4321

# Optional: Custom OpenRouter API base URL (use default if unsure)
# OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Optional: Default AI model (use default if unsure)  
# OPENROUTER_DEFAULT_MODEL=anthropic/claude-3-5-sonnet
```

### Environment Variables Reference

| Variable | Required | Default Value | Description |
|----------|----------|---------------|-------------|
| `OPENROUTER_API_KEY` | ✅ Required | - | Your OpenRouter API key |
| `PUBLIC_APP_URL` | ✅ Required | `http://localhost:4321` | Your app's public URL |
| `OPENROUTER_BASE_URL` | ❌ Optional | `https://openrouter.ai/api/v1` | API base URL |
| `OPENROUTER_DEFAULT_MODEL` | ❌ Optional | `anthropic/claude-3-5-sonnet` | Default AI model |

## Step 3: Verify Installation

1. Start your development server:
```bash
npm run dev
```

2. Test the API endpoint by making a POST request to `http://localhost:4321/api/openrouter/chat`:

```javascript
// Example test request
fetch('http://localhost:4321/api/openrouter/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [
      {
        role: 'user',
        content: 'Hello, can you help me create a flashcard about TypeScript?'
      }
    ],
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
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

3. You should receive a successful response with AI-generated content.

## Step 4: Production Deployment

### Vercel Deployment

1. Add environment variables in your Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add each required variable

### Netlify Deployment

1. Add environment variables in your Netlify dashboard:
   - Go to Site settings → Environment variables
   - Add each required variable

### Docker Deployment

Add to your `docker-compose.yml` or Dockerfile:

```yaml
environment:
  - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
  - PUBLIC_APP_URL=${PUBLIC_APP_URL}
```

## Security Best Practices

### ✅ Do's

- Store API keys in environment variables only
- Use different API keys for development and production
- Set up monitoring for unusual API usage
- Rotate API keys regularly (quarterly)
- Use HTTPS in production for PUBLIC_APP_URL

### ❌ Don'ts

- Never commit API keys to version control
- Don't hardcode keys in source code
- Don't share API keys in chat/email
- Don't use development keys in production

## Troubleshooting

### Common Issues

#### "Invalid API key" Error
```
AuthenticationError: Invalid API key
```
**Solutions:**
1. Verify your API key format matches `sk-or-v1-[64-characters]`
2. Check for extra spaces or characters
3. Ensure the environment variable is properly set
4. Restart your development server after changing .env

#### "Service configuration error"  
```
SERVICE_UNAVAILABLE: Service configuration error
```
**Solutions:**
1. Check that `OPENROUTER_API_KEY` is set in your environment
2. Verify the key is valid and not expired
3. Check your OpenRouter account status

#### Rate Limiting Issues
```
RateLimitError: Too many requests
```
**Solutions:**
1. The service automatically handles retries
2. Consider upgrading your OpenRouter plan
3. Implement request queuing in your application

#### Connection Timeouts
```
NetworkError: Request timeout  
```
**Solutions:**
1. Check your internet connection
2. Verify OpenRouter service status
3. Consider increasing timeout in service configuration

### Getting Help

1. **OpenRouter Support**: [OpenRouter Discord](https://discord.gg/openrouter)
2. **API Documentation**: [OpenRouter Docs](https://openrouter.ai/docs)
3. **Service Status**: [OpenRouter Status](https://status.openrouter.ai/)

## Model Selection Guide

### Recommended Models by Use Case

#### 📚 Flashcard Generation (Recommended)
- **claude-3-5-sonnet** - Best balance of quality and speed
- **gpt-4o** - Excellent structured output
- **gemini-pro-1.5** - Good cost-performance ratio

#### ⚡ Fast Responses  
- **claude-3-haiku** - Fastest Claude model
- **gpt-3.5-turbo** - Quick and cost-effective
- **llama-3.1-8b-instruct** - Open source, very fast

#### 🎯 Highest Quality
- **claude-3-opus** - Most intelligent (slower, expensive)
- **gpt-4** - Highly capable
- **command-r-plus** - Excellent reasoning

### Cost Considerations

| Model | Cost Level | Best For |
|-------|------------|----------|
| claude-3-haiku | $ | High-volume, simple tasks |
| gpt-3.5-turbo | $ | General purpose, cost-sensitive |
| claude-3-5-sonnet | $$ | Recommended balance |
| gpt-4o | $$$ | Complex reasoning |
| claude-3-opus | $$$$ | Maximum quality |

## Next Steps

After setup is complete:

1. **Test Integration**: Create a simple flashcard generation test
2. **Monitor Usage**: Set up logging to track API usage
3. **Optimize Performance**: Adjust model selection based on your needs
4. **Scale Gradually**: Monitor costs as you increase usage

## API Usage Examples

### Basic Chat Completion
```typescript
import { OpenRouterService } from '@/lib/services/openrouter';

const service = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY!
});

const response = await service.createChatCompletion({
  messages: [{ role: 'user', content: 'Explain quantum computing' }]
});
```

### Structured Flashcard Generation
```typescript
const response = await service.createChatCompletion({
  messages: [{
    role: 'user',
    content: 'Create flashcards about React hooks'
  }],
  systemMessage: 'You are an expert educator creating study materials.',
  responseFormat: {
    type: 'json_schema',
    json_schema: {
      name: 'flashcards',
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
          }
        }
      }
    }
  }
});
```

That's it! Your OpenRouter service should now be fully configured and ready to use. 🎉