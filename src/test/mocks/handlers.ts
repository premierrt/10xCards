import { http, HttpResponse } from 'msw'

// Mock handlers for API endpoints
export const handlers = [
  // Example API endpoint mocks
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' })
  }),

  // Supabase API mocks
  http.post('https://*.supabase.co/rest/v1/*', () => {
    return HttpResponse.json({ data: [] })
  }),

  http.get('https://*.supabase.co/rest/v1/*', () => {
    return HttpResponse.json({ data: [] })
  }),

  // OpenRouter API mocks  
  http.post('https://openrouter.ai/api/v1/*', () => {
    return HttpResponse.json({
      choices: [
        {
          message: {
            content: 'Mock AI response'
          }
        }
      ]
    })
  }),
]