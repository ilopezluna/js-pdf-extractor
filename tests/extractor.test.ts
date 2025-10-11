import * as path from 'path';
import { fileURLToPath } from 'url';
import { PdfDataExtractor } from '../src/extractor.js';
import { ExtractionOptions } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * PdfDataExtractor Unit Tests
 * 
 * Note: Full extraction tests with OpenAI API calls are intentionally omitted
 * from the unit test suite. These require:
 * 1. Valid API keys (not suitable for unit tests)
 * 2. Complex ESM mocking setup (jest.unstable_mockModule has limitations)
 * 
 * For comprehensive extraction testing, consider:
 * - Integration tests with real API keys (run separately)
 * - Manual testing with actual OpenAI credentials
 * - End-to-end tests in a staging environment
 * 
 * Current coverage focuses on:
 * - Constructor validation
 * - Input validation (schema, PDF paths)
 * - Model management
 */

describe('PdfDataExtractor', () => {
  const testPdfPath = path.join(__dirname, 'fixtures', 'sample-invoice.pdf');

  describe('constructor', () => {
    it('should create extractor with API key', () => {
      const extractor = new PdfDataExtractor({
        openaiApiKey: 'test-api-key',
      });

      expect(extractor).toBeDefined();
      expect(extractor.getModel()).toBe('gpt-4o-mini');
    });

    it('should create extractor with custom model', () => {
      const extractor = new PdfDataExtractor({
        openaiApiKey: 'test-api-key',
        model: 'gpt-4',
      });

      expect(extractor.getModel()).toBe('gpt-4');
    });

    it('should throw error without API key', () => {
      expect(() => {
        new PdfDataExtractor({
          openaiApiKey: '',
        });
      }).toThrow('OpenAI API key is required');
    });
  });

  describe('extract - validation', () => {
    let extractor: PdfDataExtractor;

    beforeEach(() => {
      extractor = new PdfDataExtractor({
        openaiApiKey: 'test-api-key',
      });
    });

    it('should throw error when neither pdfPath nor pdfBuffer provided', async () => {
      const schema = {
        invoiceNumber: { type: 'string' },
      };

      await expect(
        extractor.extract({
          schema,
        } as ExtractionOptions)
      ).rejects.toThrow('Either pdfPath or pdfBuffer must be provided');
    });

    it('should throw error for invalid schema', async () => {
      await expect(
        extractor.extract({
          pdfPath: testPdfPath,
          schema: {} as any,
        })
      ).rejects.toThrow('Invalid JSON schema');
    });

    it('should throw error for non-existent PDF', async () => {
      const schema = {
        invoiceNumber: { type: 'string' },
      };

      await expect(
        extractor.extract({
          pdfPath: 'non-existent.pdf',
          schema,
        })
      ).rejects.toThrow();
    });
  });

  describe('model management', () => {
    it('should get current model', () => {
      const extractor = new PdfDataExtractor({
        openaiApiKey: 'test-api-key',
        model: 'gpt-4',
      });

      expect(extractor.getModel()).toBe('gpt-4');
    });

    it('should set new model', () => {
      const extractor = new PdfDataExtractor({
        openaiApiKey: 'test-api-key',
      });

      extractor.setModel('gpt-4-turbo');
      expect(extractor.getModel()).toBe('gpt-4-turbo');
    });

    it('should use same model for text and vision by default', () => {
      const extractor = new PdfDataExtractor({
        openaiApiKey: 'test-api-key',
        model: 'gpt-4',
      });

      expect(extractor.getModel()).toBe('gpt-4');
      expect(extractor.getTextModel()).toBe('gpt-4');
      expect(extractor.getVisionModel()).toBe('gpt-4');
    });

    it('should allow different models for text and vision', () => {
      const extractor = new PdfDataExtractor({
        openaiApiKey: 'test-api-key',
        textModel: 'gpt-4-turbo',
        visionModel: 'gpt-4o',
      });

      expect(extractor.getTextModel()).toBe('gpt-4-turbo');
      expect(extractor.getVisionModel()).toBe('gpt-4o');
    });

    it('should use default model when specific models are not provided', () => {
      const extractor = new PdfDataExtractor({
        openaiApiKey: 'test-api-key',
      });

      expect(extractor.getTextModel()).toBe('gpt-4o-mini');
      expect(extractor.getVisionModel()).toBe('gpt-4o-mini');
    });

    it('should use general model as fallback for specific models', () => {
      const extractor = new PdfDataExtractor({
        openaiApiKey: 'test-api-key',
        model: 'gpt-4',
        visionModel: 'gpt-4o',
      });

      expect(extractor.getTextModel()).toBe('gpt-4'); // Falls back to model
      expect(extractor.getVisionModel()).toBe('gpt-4o'); // Uses specific visionModel
    });

    it('should set text model independently', () => {
      const extractor = new PdfDataExtractor({
        openaiApiKey: 'test-api-key',
      });

      extractor.setTextModel('gpt-4-turbo');
      expect(extractor.getTextModel()).toBe('gpt-4-turbo');
      expect(extractor.getVisionModel()).toBe('gpt-4o-mini'); // Unchanged
    });

    it('should set vision model independently', () => {
      const extractor = new PdfDataExtractor({
        openaiApiKey: 'test-api-key',
      });

      extractor.setVisionModel('gpt-4o');
      expect(extractor.getVisionModel()).toBe('gpt-4o');
      expect(extractor.getTextModel()).toBe('gpt-4o-mini'); // Unchanged
    });

    it('should update both models when using setModel', () => {
      const extractor = new PdfDataExtractor({
        openaiApiKey: 'test-api-key',
        textModel: 'gpt-3.5-turbo',
        visionModel: 'gpt-4o',
      });

      extractor.setModel('gpt-4-turbo');
      expect(extractor.getModel()).toBe('gpt-4-turbo');
      expect(extractor.getTextModel()).toBe('gpt-4-turbo');
      expect(extractor.getVisionModel()).toBe('gpt-4-turbo');
    });
  });
});
