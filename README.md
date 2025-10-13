# PDF Data Extractor

A TypeScript library to extract structured data from PDFs using JSON schemas and OpenAI API compatible models.

## Features

- 📄 Parse PDF files and extract text content
- 🖼️ **Automatic OCR for scanned PDFs** using AI vision models (GPT-4o, Claude, etc.)
- 🤖 Use OpenAI's structured output to extract data matching your schema
- 🔧 Configurable OpenAI API compatible base URL and model
- 📝 TypeScript support with full type definitions
- ✅ Comprehensive test coverage

## Installation

```bash
npm install pdf-data-extractor
```

## Quick Start

```typescript
import { PdfDataExtractor } from 'pdf-data-extractor';

// Initialize the extractor
const extractor = new PdfDataExtractor({
  openaiApiKey: 'your-api-key',
  model: 'gpt-4o-mini', // optional, defaults to gpt-4o-mini
  baseUrl: 'https://api.openai.com/v1', // optional, for custom endpoints
});

// Define your schema
const schema = {
  invoiceNumber: { type: 'string' },
  date: { type: 'string' },
  customerName: { type: 'string' },
  totalAmount: { type: 'number' },
  items: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        description: { type: 'string' },
        amount: { type: 'number' },
      },
    },
  },
};

// Extract data from PDF
const result = await extractor.extract({
  pdfPath: './invoice.pdf',
  schema,
  temperature: 0.1, // optional
  maxTokens: 2000, // optional
});

console.log(result.data);
// {
//   invoiceNumber: 'INV-2024-001',
//   date: 'January 15, 2024',
//   customerName: 'John Doe',
//   totalAmount: 5940.00,
//   items: [...]
// }
```

You can also use local models or other OpenAI-compatible APIs by specifying the `baseUrl` and `model` in the constructor.

```typescript
import { PdfDataExtractor } from 'pdf-data-extractor';

// Initialize the extractor
const extractor = new PdfDataExtractor({
  openaiApiKey: 'not-required-for-local-models',
  model: 'ai/gpt-oss',
  baseUrl: 'http://localhost:12434/engines/v1',
});
```

## API Reference

### PdfDataExtractor

Main class for extracting structured data from PDFs.

#### Constructor

```typescript
new PdfDataExtractor(config: ExtractorConfig)
```

**Parameters:**

- `config.openaiApiKey` (string, required): Your OpenAI API key
- `config.model` (string, optional): Model to use (default: 'gpt-4o-mini')
- `config.baseUrl` (string, optional): Custom OpenAI API base URL
- `config.visionEnabled` (boolean, optional): Enable automatic vision-based OCR for scanned PDFs (default: true)
- `config.textThreshold` (number, optional): Minimum text length to consider PDF as text-based (default: 100)
- `config.systemPrompt` (string, optional): Custom system prompt for the AI model. Set to empty string for models that don't support system prompts (default: sensible prompt for data extraction)

#### Methods

##### extract<T>(options: ExtractionOptions): Promise<ExtractionResult<T>>

Extract structured data from a PDF file.

**Parameters:**

- `options.schema` (object, required): JSON schema defining the structure to extract
- `options.pdfPath` (string, optional): Path to the PDF file
- `options.pdfBuffer` (Buffer, optional): PDF file as a Buffer
- `options.temperature` (number, optional): OpenAI temperature parameter (0-2)
- `options.maxTokens` (number, optional): Maximum tokens for the response

**Returns:** Promise resolving to:

- `data`: Extracted data matching the schema
- `tokensUsed`: Number of tokens used in the API call
- `model`: Model used for extraction

**Example:**

```typescript
const result = await extractor.extract({
  pdfPath: './document.pdf',
  schema: {
    title: { type: 'string' },
    summary: { type: 'string' },
  },
});
```

## Scanned PDF Support

This library automatically detects and handles scanned PDFs (documents that are images) using AI vision models. When a PDF contains insufficient extractable text, it automatically:

1. Converts PDF pages to images
2. Uses a vision-capable AI model (e.g., GPT-4o) to read the images
3. Extracts structured data just like with text-based PDFs

### How It Works

```typescript
const extractor = new PdfDataExtractor({
  openaiApiKey: 'your-api-key',
  model: 'gpt-4o-mini', // Vision-capable model
  visionEnabled: true, // Default: true
  textThreshold: 100, // Minimum text length to consider as text-based
});

// Works with both text-based and scanned PDFs!
const result = await extractor.extract({
  pdfPath: './scanned-invoice.pdf', // Can be a scan
  schema: {
    invoiceNumber: { type: 'string' },
    total: { type: 'number' },
  },
});
```

### Using Different Models for Text and Vision

You can configure separate models for text-based and scanned PDF extraction:

```typescript
const extractor = new PdfDataExtractor({
  openaiApiKey: 'your-api-key',
  model: 'gpt-4o-mini', // Default for both
});

// Use a cheaper model for text extraction
extractor.setTextModel('gpt-4o-mini');

// Use a more accurate model for vision/scanned PDFs
extractor.setVisionModel('gpt-4o');

// Now text-based PDFs use gpt-4o-mini (cost-effective)
// and scanned PDFs use gpt-4o (better accuracy)
const result = await extractor.extract({
  pdfPath: './document.pdf',
  schema: {
    /* ... */
  },
});
```

See [Usage](USAGE.md) for more examples.

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Building

```bash
npm run build
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit [a Pull Request](https://github.com/ilopezluna/js-pdf-extractor).

## Support

For issues and questions, please open an issue [on GitHub](https://github.com/ilopezluna/js-pdf-extractor/issues).
