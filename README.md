# PDF Data Extractor

A TypeScript library to extract structured data from PDF files using JSON schemas and OpenAI's API.

## Features

- 📄 Parse PDF files and extract text content
- 🤖 Use OpenAI's structured output to extract data matching your schema
- 🔧 Configurable OpenAI base URL and model
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

##### getModel(): string

Get the current model being used.

##### setModel(model: string): void

Set a new model to use for extraction.

### Utility Functions

#### parsePdfFromPath(pdfPath: string): Promise<ParsedPdf>

Parse a PDF file from a file path.

#### parsePdfFromBuffer(buffer: Buffer): Promise<ParsedPdf>

Parse a PDF from a Buffer.

#### validatePdf(input: string | Buffer): Promise<boolean>

Validate that a PDF can be parsed.

#### validateSchema(schema: Record<string, any>): boolean

Validate that a JSON schema is properly formatted.

#### formatSchemaForOpenAI(schema: Record<string, any>): Record<string, any>

Convert a JSON schema to OpenAI function calling format.

## Advanced Usage

### Using with Custom OpenAI-Compatible APIs

```typescript
const extractor = new PdfDataExtractor({
  openaiApiKey: 'your-api-key',
  baseUrl: 'https://your-custom-api.com/v1',
  model: 'your-custom-model',
});
```

### Extracting from Buffer

```typescript
import * as fs from 'fs';

const pdfBuffer = fs.readFileSync('./document.pdf');

const result = await extractor.extract({
  pdfBuffer,
  schema: { /* your schema */ },
});
```

### Complex Schema Example

```typescript
const schema = {
  type: 'object',
  properties: {
    invoice: {
      type: 'object',
      properties: {
        number: { type: 'string' },
        date: { type: 'string' },
        dueDate: { type: 'string' },
      },
      required: ['number', 'date'],
    },
    customer: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        address: { type: 'string' },
      },
      required: ['name'],
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          quantity: { type: 'number' },
          unitPrice: { type: 'number' },
          total: { type: 'number' },
        },
        required: ['description', 'total'],
      },
    },
    totals: {
      type: 'object',
      properties: {
        subtotal: { type: 'number' },
        tax: { type: 'number' },
        total: { type: 'number' },
      },
      required: ['total'],
    },
  },
  required: ['invoice', 'customer', 'items', 'totals'],
};

const result = await extractor.extract({
  pdfPath: './invoice.pdf',
  schema,
});
```

## Error Handling

```typescript
try {
  const result = await extractor.extract({
    pdfPath: './document.pdf',
    schema: { /* your schema */ },
  });
  console.log(result.data);
} catch (error) {
  if (error instanceof Error) {
    console.error('Extraction failed:', error.message);
  }
}
```

## Common Errors

- **"OpenAI API key is required"**: Provide a valid API key in the constructor
- **"Either pdfPath or pdfBuffer must be provided"**: Provide either a file path or buffer
- **"Invalid JSON schema provided"**: Ensure your schema is a non-empty object
- **"Failed to parse PDF"**: The PDF file may be corrupted or in an unsupported format
- **"No text content found in PDF"**: The PDF may be image-based or empty

## TypeScript Support

This library is written in TypeScript and provides full type definitions.

```typescript
import { 
  PdfDataExtractor,
  ExtractorConfig,
  ExtractionOptions,
  ExtractionResult,
  ParsedPdf 
} from 'pdf-data-extractor';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  total: number;
}

const result = await extractor.extract<InvoiceData>({
  pdfPath: './invoice.pdf',
  schema: { /* ... */ },
});

// result.data is typed as InvoiceData
console.log(result.data.invoiceNumber);
```

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

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
