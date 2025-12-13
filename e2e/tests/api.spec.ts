import { test, expect } from '@playwright/test'

test.describe('API Tests', () => {
  test('should respond to health check', async ({ request }) => {
    const response = await request.get('/api/health')
    
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    expect(data).toHaveProperty('status')
  })

  test('should handle 404 for non-existent endpoints', async ({ request }) => {
    const response = await request.get('/api/non-existent')
    
    expect(response.status()).toBe(404)
  })

  test('should validate API response structure', async ({ request }) => {
    const response = await request.get('/api/health')
    
    expect(response.ok()).toBeTruthy()
    
    const data = await response.json()
    
    // Validate response structure
    expect(typeof data).toBe('object')
    expect(data).toHaveProperty('status')
  })
})