/**
 * PDF Data Extractor Library
 * 
 * A TypeScript library to extract structured data from PDFs using JSON schemas and OpenAI
 */

export { PdfDataExtractor } from './extractor';
export { parsePdfFromPath, parsePdfFromBuffer, validatePdf } from './pdf-parser';
export { validateSchema, formatSchemaForOpenAI, getValidationErrors } from './schema-validator';
export type {
  ExtractorConfig,
  ExtractionOptions,
  ExtractionResult,
  ParsedPdf,
} from './types';
