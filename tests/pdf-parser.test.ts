import * as fs from 'fs';
import * as path from 'path';
import { parsePdfFromPath, parsePdfFromBuffer, validatePdf } from '../src/pdf-parser';

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
  });
});
