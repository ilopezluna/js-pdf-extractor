/**
 * Configuration for the PDF data extractor
 */
export interface ExtractorConfig {
  /** OpenAI API key */
  openaiApiKey: string;
  /** Optional custom base URL for OpenAI API */
  baseUrl?: string;
  /** Optional model to use (default: gpt-4o-mini) */
  model?: string;
}

/**
 * Options for extracting data from a PDF
 */
export interface ExtractionOptions {
  /** JSON schema defining the structure of data to extract */
  schema: Record<string, any>;
  /** Path to the PDF file (either pdfPath or pdfBuffer must be provided) */
  pdfPath?: string;
  /** PDF file as a Buffer (either pdfPath or pdfBuffer must be provided) */
  pdfBuffer?: Buffer;
  /** Optional OpenAI temperature parameter (0-2) */
  temperature?: number;
  /** Optional maximum tokens for the response */
  maxTokens?: number;
}

/**
 * Result of PDF parsing
 */
export interface ParsedPdf {
  /** Extracted text content from the PDF */
  text: string;
  /** Number of pages in the PDF */
  numPages: number;
  /** Metadata from the PDF */
  info?: Record<string, any>;
}

/**
 * Result of data extraction
 */
export interface ExtractionResult<T = any> {
  /** Extracted data matching the schema */
  data: T;
  /** Number of tokens used in the API call */
  tokensUsed?: number;
  /** Model used for extraction */
  model: string;
}
