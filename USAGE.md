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
