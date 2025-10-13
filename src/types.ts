/**
 * Configuration for the PDF data extractor
 */
export interface ExtractorConfig {
  /** OpenAI API key */
  openaiApiKey: string;
  /** Optional custom base URL for OpenAI API */
  baseUrl?: string;
  /** Optional model to use for both text and vision extraction (default: gpt-4o-mini) */
  model?: string;
  /** Optional model to use specifically for text-based PDF extraction */
  textModel?: string;
  /** Optional model to use specifically for vision-based PDF extraction (OCR) */
  visionModel?: string;
  /** Enable automatic vision-based OCR for scanned PDFs (default: true) */
  visionEnabled?: boolean;
  /** Minimum text length to consider PDF as text-based (default: 100) */
  textThreshold?: number;
  /** Optional custom system prompt for the AI model (default: sensible prompt for data extraction) */
  systemPrompt?: string;
  /** Optional default temperature for all extractions (default: 0) */
  defaultTemperature?: number;
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
 * Image representation of a PDF page
 */
export interface PdfPageImage {
  /** Page number (1-indexed) */
  page: number;
  /** Base64-encoded PNG image */
  base64: string;
}

/**
 * Content extracted from a PDF
 */
export type ParsedPdfContent =
  | { type: 'text'; content: string }
  | { type: 'images'; content: PdfPageImage[] };

/**
 * Result of PDF parsing
 */
export interface ParsedPdf {
  /** Extracted content from the PDF (either text or images) */
  content: ParsedPdfContent;
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
