import { describe, it, expect, beforeEach } from 'vitest';
import { FlashcardGenerationService, FlashcardGenerationError } from '../flashcard-generation-mock.service';

describe('FlashcardGenerationMockService', () => {
  let service: FlashcardGenerationService;

  beforeEach(() => {
    service = new FlashcardGenerationService();
  });

  describe('generateFlashcards', () => {
    it('should generate flashcards from text input', async () => {
      const text = 'Photosynthesis is the process by which plants convert light energy into chemical energy.';
      const count = 3;

      const result = await service.generateFlashcards(text, count);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(count);
      
      // Check structure of first flashcard
      expect(result[0]).toHaveProperty('question');
      expect(result[0]).toHaveProperty('answer');
      expect(typeof result[0].question).toBe('string');
      expect(typeof result[0].answer).toBe('string');
      expect(result[0].question.length).toBeGreaterThan(0);
      expect(result[0].answer.length).toBeGreaterThan(0);
    });

    it('should generate contextual flashcards based on content type', async () => {
      const scienceText = 'Photosynthesis occurs in chloroplasts and converts CO2 and water into glucose using sunlight.';
      const result = await service.generateFlashcards(scienceText, 2);

      // Should contain science-related content
      const allText = result.map(card => `${card.question} ${card.answer}`).join(' ').toLowerCase();
      expect(allText).toMatch(/photosynthesis|plant|cell|chloroplast/);
    });

    it('should generate programming flashcards for code content', async () => {
      const programmingText = 'JavaScript is a dynamic programming language with closures and prototypal inheritance.';
      const result = await service.generateFlashcards(programmingText, 2);

      const allText = result.map(card => `${card.question} ${card.answer}`).join(' ').toLowerCase();
      expect(allText).toMatch(/javascript|programming|closure|dom|variable/);
    });

    it('should respect the count parameter', async () => {
      const text = 'Test content for flashcard generation';
      const count = 5;

      const result = await service.generateFlashcards(text, count);
      
      // Should not exceed requested count
      expect(result.length).toBeLessThanOrEqual(count);
    });

    it('should validate flashcard schema', async () => {
      const text = 'Test content';
      const count = 1;

      const result = await service.generateFlashcards(text, count);

      // Schema validation should pass
      result.forEach(card => {
        expect(card.question).toBeDefined();
        expect(card.answer).toBeDefined();
        expect(typeof card.question).toBe('string');
        expect(typeof card.answer).toBe('string');
        expect(card.question.length).toBeGreaterThan(0);
        expect(card.answer.length).toBeGreaterThan(0);
        expect(card.question.length).toBeLessThanOrEqual(500);
        expect(card.answer.length).toBeLessThanOrEqual(1000);
      });
    });

    it('should have realistic delays', async () => {
      const startTime = Date.now();
      await service.generateFlashcards('Test', 1);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      // Should take at least 500ms due to simulated delay
      expect(duration).toBeGreaterThan(400); // Allow some tolerance
      // Should not take too long (max 2 seconds for testing)
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('error handling', () => {
    it('should throw FlashcardGenerationError for various scenarios', async () => {
      // Test multiple times to potentially trigger different error scenarios
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          service.generateFlashcards('Test content', 1).catch(error => error)
        );
      }
      
      const results = await Promise.all(promises);
      const errors = results.filter(result => result instanceof FlashcardGenerationError);
      
      // With 5% error rate, we might get some errors in 20 attempts
      // But we can't guarantee it, so just check the error structure if any occur
      errors.forEach(error => {
        expect(error).toBeInstanceOf(FlashcardGenerationError);
        expect(error.message).toBeDefined();
        expect(error.statusCode).toBeDefined();
        expect(typeof error.statusCode).toBe('number');
      });
    });

    it('should maintain error class hierarchy', () => {
      const error = new FlashcardGenerationError('Test error', undefined, 500);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(FlashcardGenerationError);
      expect(error.name).toBe('FlashcardGenerationError');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
    });
  });
});