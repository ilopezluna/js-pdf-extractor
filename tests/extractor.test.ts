import * as path from 'path';
import { fileURLToPath } from 'url';
import { PdfDataExtractor } from '../src/extractor.js';
import { ExtractionOptions } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Skip OpenAI-dependent tests in this basic test suite
// These would require valid API keys or complex ESM mocking

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
  });
});
