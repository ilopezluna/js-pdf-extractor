import OpenAI from 'openai';
import { parsePdfFromPath, parsePdfFromBuffer } from './pdf-parser';
import { validateSchema, formatSchemaForOpenAI } from './schema-validator';
import { ExtractorConfig, ExtractionOptions, ExtractionResult } from './types';

/**
 * Main class for extracting structured data from PDFs using OpenAI
 */
export class PdfDataExtractor {
  private client: OpenAI;
  private model: string;

  /**
   * Create a new PDF data extractor
   * @param config - Configuration including API key, base URL, and model
   */
  constructor(config: ExtractorConfig) {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.model = config.model || 'gpt-4o-mini';

    const clientConfig: any = {
      apiKey: config.openaiApiKey,
    };

    if (config.baseUrl) {
      clientConfig.baseURL = config.baseUrl;
    }

    this.client = new OpenAI(clientConfig);
  }

  /**
   * Extract structured data from a PDF file
   * @param options - Extraction options including schema and PDF source
   * @returns Extracted data matching the schema
   */
  async extract<T = any>(options: ExtractionOptions): Promise<ExtractionResult<T>> {
    // Validate inputs
    if (!options.pdfPath && !options.pdfBuffer) {
      throw new Error('Either pdfPath or pdfBuffer must be provided');
    }

    try {
      validateSchema(options.schema);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Invalid JSON schema: ${error.message}`);
      }
      throw new Error('Invalid JSON schema provided');
    }

    // Parse the PDF
    const parsedPdf = options.pdfPath
      ? await parsePdfFromPath(options.pdfPath)
      : await parsePdfFromBuffer(options.pdfBuffer!);

    if (!parsedPdf.text || parsedPdf.text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }

    // Format schema for OpenAI
    const formattedSchema = formatSchemaForOpenAI(options.schema);

    // Call OpenAI API with structured output
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that extracts structured data from text. Extract the requested information accurately from the provided text.',
          },
          {
            role: 'user',
            content: `Extract the following information from this text:\n\n${parsedPdf.text}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'extracted_data',
            strict: true,
            schema: formattedSchema,
          },
        },
        temperature: options.temperature ?? 0.1,
        max_tokens: options.maxTokens,
      });

      const messageContent = completion.choices[0]?.message?.content;
      if (!messageContent) {
        throw new Error('No response from OpenAI API');
      }

      const extractedData = JSON.parse(messageContent);

      return {
        data: extractedData as T,
        tokensUsed: completion.usage?.total_tokens,
        model: completion.model,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to extract data: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get the current model being used
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Set a new model to use for extraction
   * @param model - The model identifier
   */
  setModel(model: string): void {
    this.model = model;
  }
}
