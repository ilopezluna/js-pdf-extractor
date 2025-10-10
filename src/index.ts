/**
 * PDF Data Extractor Library
 * 
 * A TypeScript library to extract structured data from PDFs using JSON schemas and OpenAI
 */

export { PdfDataExtractor } from './extractor.js';
export { parsePdfFromPath, parsePdfFromBuffer, validatePdf } from './pdf-parser.js';
export { validateSchema, formatSchemaForOpenAI, getValidationErrors } from './schema-validator.js';
export type {
  ExtractorConfig,
  ExtractionOptions,
  ExtractionResult,
  ParsedPdf,
} from './types.js';
