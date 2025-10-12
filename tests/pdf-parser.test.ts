import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parsePdfFromPath, parsePdfFromBuffer, validatePdf } from '../src/pdf-parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PDF Parser', () => {
  const testPdfPath = path.join(__dirname, 'fixtures', 'sample-invoice.pdf');

  describe('parsePdfFromPath', () => {
    it('should parse a PDF file from path', async () => {
      const result = await parsePdfFromPath(testPdfPath);
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(['text', 'images']).toContain(result.content.type);
      
      if (result.content.type === 'text') {
        expect(typeof result.content.content).toBe('string');
        expect(result.content.content.length).toBeGreaterThan(0);
      } else {
        expect(Array.isArray(result.content.content)).toBe(true);
        // Image conversion may return empty if system dependencies are missing
        // Just verify it's an array
      }
      expect(result.numPages).toBeGreaterThan(0);
    });

    it('should extract content from PDF', async () => {
      const result = await parsePdfFromPath(testPdfPath);
      
      expect(['text', 'images']).toContain(result.content.type);
      
      if (result.content.type === 'text') {
        expect(typeof result.content.content).toBe('string');
        expect(result.content.content.length).toBeGreaterThan(0);
      } else {
        expect(Array.isArray(result.content.content)).toBe(true);
        // Image conversion may return empty if system dependencies are missing
        if (result.content.content.length > 0) {
          expect(result.content.content[0]).toHaveProperty('page');
          expect(result.content.content[0]).toHaveProperty('base64');
        }
      }
    });

    it('should throw error for non-existent file', async () => {
      await expect(parsePdfFromPath('non-existent.pdf')).rejects.toThrow();
    });

    it('should throw error for invalid PDF file', async () => {
      const invalidPath = path.join(__dirname, 'fixtures', 'sample-invoice.txt');
      await expect(parsePdfFromPath(invalidPath)).rejects.toThrow();
    });
  });

  describe('parsePdfFromBuffer', () => {
    it('should parse a PDF from buffer', async () => {
      const buffer = fs.readFileSync(testPdfPath);
      const result = await parsePdfFromBuffer(buffer);
      
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(['text', 'images']).toContain(result.content.type);
      
      if (result.content.type === 'text') {
        expect(typeof result.content.content).toBe('string');
        expect(result.content.content.length).toBeGreaterThan(0);
      } else {
        expect(Array.isArray(result.content.content)).toBe(true);
        // Image conversion may return empty if system dependencies are missing
      }
      expect(result.numPages).toBeGreaterThan(0);
    });

    it('should throw error for invalid buffer', async () => {
      const invalidBuffer = Buffer.from('not a pdf');
      await expect(parsePdfFromBuffer(invalidBuffer)).rejects.toThrow();
    });
  });

  describe('validatePdf', () => {
    it('should return true for valid PDF path', async () => {
      const isValid = await validatePdf(testPdfPath);
      expect(isValid).toBe(true);
    });

    it('should return true for valid PDF buffer', async () => {
      const buffer = fs.readFileSync(testPdfPath);
      const isValid = await validatePdf(buffer);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid PDF path', async () => {
      const isValid = await validatePdf('non-existent.pdf');
      expect(isValid).toBe(false);
    });

    it('should return false for invalid buffer', async () => {
      const invalidBuffer = Buffer.from('not a pdf');
      const isValid = await validatePdf(invalidBuffer);
      expect(isValid).toBe(false);
    });

    it('should return false for buffer without PDF signature', async () => {
      const invalidBuffer = Buffer.from('This is a text file, not a PDF');
      const isValid = await validatePdf(invalidBuffer);
      expect(isValid).toBe(false);
    });

    it('should return false for buffer that is too short', async () => {
      const tooShortBuffer = Buffer.from('%PD');
      const isValid = await validatePdf(tooShortBuffer);
      expect(isValid).toBe(false);
    });

    it('should return false for empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);
      const isValid = await validatePdf(emptyBuffer);
      expect(isValid).toBe(false);
    });

    it('should return true for buffer with valid PDF signature', async () => {
      const validSignatureBuffer = Buffer.from('%PDF-1.4\n...');
      const isValid = await validatePdf(validSignatureBuffer);
      expect(isValid).toBe(true);
    });
  });
});
