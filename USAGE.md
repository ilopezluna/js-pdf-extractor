# Usage Guide

## Installation

```bash
npm install pdf-data-extractor
```

## Basic Example

```typescript
import { PdfDataExtractor } from 'pdf-data-extractor';

const extractor = new PdfDataExtractor({
  openaiApiKey: process.env.OPENAI_API_KEY!,
});

const result = await extractor.extract({
  pdfPath: './invoice.pdf',
  schema: {
    invoiceNumber: { type: 'string' },
    date: { type: 'string' },
    totalAmount: { type: 'number' },
  },
});

console.log(result.data);
```

## Configuration Options

### OpenAI API Configuration

```typescript
const extractor = new PdfDataExtractor({
  openaiApiKey: 'your-api-key',
  model: 'gpt-4o-mini',           // default model
  baseUrl: 'https://api.openai.com/v1',  // custom endpoint
});
```

### Extraction Options

```typescript
await extractor.extract({
  pdfPath: './document.pdf',      // or use pdfBuffer
  schema: { /* your schema */ },
  temperature: 0.1,               // 0-2, lower = more deterministic
  maxTokens: 2000,                // optional token limit
});
```

## Scanned PDF Support

The library automatically handles scanned PDFs (image-based documents) using AI vision models. This happens transparently - you don't need to change your code!

### How It Works

When you extract data from a PDF, the library:

1. **Detects PDF type**: Checks if the PDF has extractable text
2. **Text-based PDFs**: Uses standard text extraction (fast and cheap)
3. **Scanned PDFs**: Automatically converts pages to images and uses vision API

```typescript
const extractor = new PdfDataExtractor({
  openaiApiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',  // Vision-capable model (default)
  visionEnabled: true,    // Enable automatic OCR (default: true)
  textThreshold: 100,     // Min text chars to consider as text-based (default: 100)
});

// Works for both text-based AND scanned PDFs!
const result = await extractor.extract({
  pdfPath: './scanned-invoice.pdf',  // Can be a scanned document
  schema: {
    invoiceNumber: { type: 'string' },
    date: { type: 'string' },
    total: { type: 'number' },
  },
});
```

### Vision-Capable Models

These models support processing scanned PDFs:

- **`gpt-4o`** - Best accuracy, higher cost
- **`gpt-4o-mini`** - Good balance (default, recommended)
- **`gpt-4-turbo`** - Alternative OpenAI option
- **`claude-3-5-sonnet`** - Anthropic's latest
- **`claude-3-opus`** - Anthropic high-accuracy
- **`gemini-1.5-pro`** - Google's multimodal model

### Configuration Options

```typescript
const extractor = new PdfDataExtractor({
  openaiApiKey: process.env.OPENAI_API_KEY!,
  
  // Model must support vision for scanned PDFs
  model: 'gpt-4o-mini',
  
  // Enable/disable automatic vision processing
  visionEnabled: true,  // default: true
  
  // Minimum text characters to consider PDF as text-based
  // PDFs with fewer characters will be processed as images
  textThreshold: 100,   // default: 100
});
```

### Disabling Vision Processing

If you only want to process text-based PDFs:

```typescript
const extractor = new PdfDataExtractor({
  openaiApiKey: process.env.OPENAI_API_KEY!,
  visionEnabled: false,  // Reject scanned PDFs
});

try {
  await extractor.extract({
    pdfPath: './scanned-doc.pdf',
    schema: { /* ... */ },
  });
} catch (error) {
  // Will throw: "PDF contains no extractable text and vision mode is disabled"
  console.error(error.message);
}
```

### Cost Considerations

**Text-based PDFs:**
- Uses standard text tokens
- ~$0.15 per 1M input tokens (GPT-4o-mini)
- Very cost-effective

**Scanned PDFs:**
- Uses vision tokens (image processing)
- ~$0.15 per 1M tokens + image tokens
- Typical single-page invoice: $0.01-0.03
- Multi-page documents: scales with page count

**Example costs (GPT-4o-mini):**
- 1-page scanned invoice: ~$0.01-0.02
- 5-page scanned contract: ~$0.05-0.10
- 20-page scanned report: ~$0.20-0.40

### Troubleshooting Scanned PDFs

**Error: "Model 'X' does not support vision"**
```typescript
// Solution: Use a vision-capable model
const extractor = new PdfDataExtractor({
  openaiApiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',  // ✓ Vision-capable
});
```

**Error: "Failed to convert PDF to images"**
- Check that the PDF file is not corrupted
- Ensure sufficient disk space for image conversion
- Try a different PDF reader/generator

**Poor extraction quality from scanned PDFs:**
- Use higher quality scans (300+ DPI recommended)
- Ensure scanned documents are properly aligned
- Try `gpt-4o` instead of `gpt-4o-mini` for better accuracy
- Increase `maxTokens` if output is truncated

### Checking PDF Type

You can use the utility functions to check PDF type:

```typescript
import { parsePdfFromPath } from 'pdf-data-extractor';

const parsed = await parsePdfFromPath('./document.pdf');

if (parsed.content.type === 'text') {
  console.log('Text-based PDF');
  console.log('Text length:', parsed.content.content.length);
} else {
  console.log('Scanned PDF');
  console.log('Number of pages:', parsed.content.content.length);
}
```

### Mixed PDFs (Partial Text)

Some PDFs have some pages with text and some that are scanned. The library uses a threshold to decide:

```typescript
const extractor = new PdfDataExtractor({
  openaiApiKey: process.env.OPENAI_API_KEY!,
  // If PDF has < 100 chars of text, treat as scanned
  textThreshold: 100,
});
```

Adjust `textThreshold` based on your use case:
- **Lower threshold (50)**: More aggressive vision mode
- **Higher threshold (200)**: Only use vision for truly empty PDFs

## Schema Examples

### Simple Schema

```typescript
const schema = {
  name: { type: 'string' },
  age: { type: 'number' },
  email: { type: 'string' },
};
```

### Nested Schema

```typescript
const schema = {
  customer: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string' },
    },
  },
  amount: { type: 'number' },
};
```

### Array Schema

```typescript
const schema = {
  items: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        description: { type: 'string' },
        price: { type: 'number' },
      },
    },
  },
};
```

### Full JSON Schema Format

```typescript
const schema = {
  type: 'object',
  properties: {
    invoiceNumber: { type: 'string' },
    date: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          amount: { type: 'number' },
        },
        required: ['description', 'amount'],
      },
    },
  },
  required: ['invoiceNumber', 'date', 'items'],
};
```

## Working with Buffers

```typescript
import * as fs from 'fs';

const pdfBuffer = fs.readFileSync('./document.pdf');

const result = await extractor.extract({
  pdfBuffer,
  schema: { /* ... */ },
});
```

## Error Handling

```typescript
try {
  const result = await extractor.extract({
    pdfPath: './document.pdf',
    schema: { /* ... */ },
  });
  
  // Process result
  console.log(result.data);
  console.log(`Used ${result.tokensUsed} tokens`);
  
} catch (error) {
  if (error instanceof Error) {
    // Handle specific errors
    if (error.message.includes('Failed to parse PDF')) {
      console.error('Invalid PDF file');
    } else if (error.message.includes('No text content')) {
      console.error('PDF is empty or image-based');
    } else if (error.message.includes('Invalid JSON schema')) {
      console.error('Check your schema format');
    } else {
      console.error('Extraction error:', error.message);
    }
  }
}
```

## TypeScript Usage

```typescript
import { PdfDataExtractor, ExtractionResult } from 'pdf-data-extractor';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customer: {
    name: string;
    email: string;
  };
  total: number;
}

const extractor = new PdfDataExtractor({
  openaiApiKey: process.env.OPENAI_API_KEY!,
});

const result: ExtractionResult<InvoiceData> = await extractor.extract<InvoiceData>({
  pdfPath: './invoice.pdf',
  schema: {
    invoiceNumber: { type: 'string' },
    date: { type: 'string' },
    customer: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
      },
    },
    total: { type: 'number' },
  },
});

// TypeScript knows the type of result.data
console.log(result.data.customer.name);
```

## Using with Different Models

```typescript
// Use GPT-4
const extractor = new PdfDataExtractor({
  openaiApiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4',
});

// Or change model dynamically
extractor.setModel('gpt-4o');
console.log(extractor.getModel()); // 'gpt-4o'
```

## Using with Custom OpenAI-Compatible APIs

```typescript
const extractor = new PdfDataExtractor({
  openaiApiKey: 'your-api-key',
  baseUrl: 'https://your-custom-endpoint.com/v1',
  model: 'your-model-name',
});
```

## Tips for Best Results

1. **Be specific in your schema**: Use descriptions when possible
2. **Use lower temperature**: 0.0-0.2 for more consistent results
3. **Test your schema**: Start with simple schemas and iterate
4. **Handle errors**: PDFs can vary widely in format
5. **Consider token limits**: Large PDFs may need maxTokens adjustment
6. **Use typed interfaces**: TypeScript helps catch issues early

## Common Use Cases

### Invoice Processing

```typescript
const invoiceSchema = {
  invoiceNumber: { type: 'string' },
  invoiceDate: { type: 'string' },
  dueDate: { type: 'string' },
  vendor: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      address: { type: 'string' },
    },
  },
  lineItems: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        description: { type: 'string' },
        quantity: { type: 'number' },
        unitPrice: { type: 'number' },
        total: { type: 'number' },
      },
    },
  },
  subtotal: { type: 'number' },
  tax: { type: 'number' },
  total: { type: 'number' },
};
```

### Resume Parsing

```typescript
const resumeSchema = {
  name: { type: 'string' },
  email: { type: 'string' },
  phone: { type: 'string' },
  summary: { type: 'string' },
  experience: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        company: { type: 'string' },
        position: { type: 'string' },
        duration: { type: 'string' },
        description: { type: 'string' },
      },
    },
  },
  education: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        institution: { type: 'string' },
        degree: { type: 'string' },
        year: { type: 'string' },
      },
    },
  },
  skills: {
    type: 'array',
    items: { type: 'string' },
  },
};
```

### Contract Analysis

```typescript
const contractSchema = {
  parties: {
    type: 'array',
    items: { type: 'string' },
  },
  effectiveDate: { type: 'string' },
  expirationDate: { type: 'string' },
  terms: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        section: { type: 'string' },
        description: { type: 'string' },
      },
    },
  },
  signatories: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        role: { type: 'string' },
      },
    },
  },
};
