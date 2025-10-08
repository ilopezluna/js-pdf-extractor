import * as path from 'path';
import { PdfDataExtractor } from '../src/extractor';
import { ExtractionOptions } from '../src/types';

// Mock the OpenAI module
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    invoiceNumber: 'INV-2024-001',
                    date: 'January 15, 2024',
                    customerName: 'John Doe',
                    totalAmount: 5940.00,
                  }),
                },
              },
            ],
            usage: {
              total_tokens: 250,
            },
            model: 'gpt-4o-mini',
          }),
        },
      },
    })),
  };
});

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

  describe('extract', () => {
    let extractor: PdfDataExtractor;

    beforeEach(() => {
      extractor = new PdfDataExtractor({
        openaiApiKey: 'test-api-key',
      });
    });

    it('should extract data from PDF file path', async () => {
      const schema = {
        invoiceNumber: { type: 'string' },
        date: { type: 'string' },
        customerName: { type: 'string' },
        totalAmount: { type: 'number' },
      };

      const result = await extractor.extract({
        pdfPath: testPdfPath,
        schema,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.invoiceNumber).toBe('INV-2024-001');
      expect(result.data.customerName).toBe('John Doe');
      expect(result.data.totalAmount).toBe(5940.00);
      expect(result.tokensUsed).toBe(250);
      expect(result.model).toBe('gpt-4o-mini');
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
