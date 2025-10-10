import OpenAI from 'openai';
import { parsePdfFromPath, parsePdfFromBuffer } from './pdf-parser';
import { validateSchema, formatSchemaForOpenAI } from './schema-validator';
import { ExtractorConfig, ExtractionOptions, ExtractionResult, PdfPageImage } from './types';

/**
 * Main class for extracting structured data from PDFs using OpenAI
 */
export class PdfDataExtractor {
  private client: OpenAI;
  private model: string;
  private config: ExtractorConfig;

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
   * Check if the current model supports vision capabilities
   * @returns True if model supports vision
   */
  private isVisionCapableModel(): boolean {
    const visionModels = [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4-vision-preview',
      'claude-3-5-sonnet',
      'claude-3-opus',
      'gemini-1.5-pro',
    ];
    const modelLower = this.model.toLowerCase();
    return visionModels.some(vm => modelLower.includes(vm.toLowerCase()));
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
    options: ExtractionOptions
  ): Promise<ExtractionResult<T>> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts structured data from text. Extract the requested information accurately from the provided text.',
        },
        {
          role: 'user',
          content: `Extract the following information from this text:\n\n${text}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extracted_data',
          strict: true,
          schema,
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
    options: ExtractionOptions
  ): Promise<ExtractionResult<T>> {
    // Verify vision is enabled
    if (this.config.visionEnabled === false) {
      throw new Error('PDF contains no extractable text and vision mode is disabled');
    }

    // Verify model supports vision
    if (!this.isVisionCapableModel()) {
      throw new Error(
        `Model '${this.model}' does not support vision. Please use a vision-capable model like gpt-4o or gpt-4o-mini for scanned PDFs.`
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

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts structured data from documents. Extract the requested information accurately from the provided document images.',
        },
        {
          role: 'user',
          content,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extracted_data',
          strict: true,
          schema,
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
      ? await parsePdfFromPath(options.pdfPath, { textThreshold: this.config.textThreshold })
      : await parsePdfFromBuffer(options.pdfBuffer!, { textThreshold: this.config.textThreshold });

    // Format schema for OpenAI
    const formattedSchema = formatSchemaForOpenAI(options.schema);

    // Call OpenAI API with structured output
    try {
      if (parsedPdf.content.type === 'text') {
        // Extract from text content
        return await this.extractFromText<T>(parsedPdf.content.content, formattedSchema, options);
      } else {
        // Extract from images using vision API
        return await this.extractFromImages<T>(parsedPdf.content.content, formattedSchema, options);
      }
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
