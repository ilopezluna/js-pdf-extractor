import OpenAI from 'openai';
import { parsePdfFromPath, parsePdfFromBuffer } from './pdf-parser.js';
import { validateSchema } from './schema-validator.js';
import {
  ExtractorConfig,
  ExtractionOptions,
  ExtractionResult,
  PdfPageImage,
} from './types.js';

/**
 * Main class for extracting structured data from PDFs using OpenAI
 */
export class PdfDataExtractor {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly textModel: string;
  private readonly visionModel: string;
  private readonly config: ExtractorConfig;
  private readonly systemPrompt: string;

  /**
   * Create a new PDF data extractor
   * @param config - Configuration including API key, base URL, and model
   */
  constructor(config: ExtractorConfig) {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.config = {
      visionEnabled: true,
      textThreshold: 100,
      ...config,
    };

    // Set system prompt with sensible default
    this.systemPrompt =
      config.systemPrompt !== undefined
        ? config.systemPrompt
        : 'You are a helpful assistant that extracts structured data from text. Extract the requested information accurately from the provided text.';

    // Set default model
    const defaultModel = config.model || 'gpt-4o-mini';
    this.model = defaultModel;

    // Set specific models, falling back to the default model
    this.textModel = config.textModel || defaultModel;
    this.visionModel = config.visionModel || defaultModel;

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
  async extract<T = any>(
    options: ExtractionOptions,
  ): Promise<ExtractionResult<T>> {
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
      ? await parsePdfFromPath(options.pdfPath, {
          textThreshold: this.config.textThreshold,
        })
      : await parsePdfFromBuffer(options.pdfBuffer!, {
          textThreshold: this.config.textThreshold,
        });

    // Call OpenAI API with structured output
    try {
      if (parsedPdf.content.type === 'text') {
        // Extract from text content
        return await this.extractFromText<T>(
          parsedPdf.content.content,
          options.schema,
          options,
        );
      } else {
        // Extract from images using vision API
        return await this.extractFromImages<T>(
          parsedPdf.content.content,
          options.schema,
          options,
        );
      }
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        throw new Error(`Failed to extract data: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Extract structured data from text content
   * @param text - Text content from PDF
   * @param schema - Formatted schema for OpenAI
   * @param options - Extraction options
   * @returns Extraction result
   */
  private async extractFromText<T>(
    text: string,
    schema: any,
    options: ExtractionOptions,
  ): Promise<ExtractionResult<T>> {
    // Build messages array, only including system message if systemPrompt is not empty
    const messages: any[] = [];

    if (this.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: `Extract the following information from this text:\n\n${text}`,
    });

    const completion = await this.client.chat.completions.create({
      model: this.textModel,
      messages,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extracted_data',
          strict: true,
          schema,
        },
      },
      temperature: options.temperature ?? 0,
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
  }

  /**
   * Extract structured data from image content using vision API
   * @param images - Array of page images
   * @param schema - Formatted schema for OpenAI
   * @param options - Extraction options
   * @returns Extraction result
   */
  private async extractFromImages<T>(
    images: PdfPageImage[],
    schema: any,
    options: ExtractionOptions,
  ): Promise<ExtractionResult<T>> {
    // Verify vision is enabled
    if (this.config.visionEnabled === false) {
      throw new Error(
        'PDF contains no extractable text and vision mode is disabled',
      );
    }

    // Build vision API messages
    const content: any[] = [
      {
        type: 'text',
        text: 'Extract the following structured information from these document pages:',
      },
    ];

    // Add all page images
    for (const img of images) {
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${img.base64}`,
        },
      });
    }

    // Build messages array, only including system message if systemPrompt is not empty
    const messages: any[] = [];

    if (this.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content,
    });

    const completion = await this.client.chat.completions.create({
      model: this.visionModel,
      messages,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extracted_data',
          strict: true,
          schema,
        },
      },
      temperature: options.temperature || 0,
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
  }

  /**
   * Get the current model being used (returns the default model)
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Get the model being used for text extraction
   */
  getTextModel(): string {
    return this.textModel;
  }

  /**
   * Get the model being used for vision extraction
   */
  getVisionModel(): string {
    return this.visionModel;
  }
}
