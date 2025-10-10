/**
 * Example usage of the PDF Data Extractor library
 */

import { PdfDataExtractor } from './src';

async function main() {
  // Initialize the extractor with your OpenAI API key
  const extractor = new PdfDataExtractor({
    openaiApiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
    //model: 'gpt-4o-mini', // Optional: specify the model
    // baseUrl: 'https://api.openai.com/v1', // Optional: custom endpoint
  });

  // Define the schema for data extraction
  // This tells the AI what information to extract from the PDF
  const invoiceSchema = {
    invoiceNumber: { type: 'string', description: 'The invoice number' },
    date: { type: 'string', description: 'Invoice date' },
    customerName: { type: 'string', description: 'Customer name' },
    customerEmail: { type: 'string', description: 'Customer email' },
    totalAmount: { type: 'number', description: 'Total amount due' },
    items: {
      type: 'array',
      description: 'List of invoice items',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          amount: { type: 'number' },
        },
      },
    },
  };

  try {
    // Extract data from a PDF file
    const result = await extractor.extract({
      pdfPath: './tests/fixtures/sample-invoice.pdf',
      schema: invoiceSchema,
      temperature: 0.1, // Lower temperature for more consistent results
    });

    console.log('Extraction successful!');
    console.log('Extracted data:', JSON.stringify(result.data, null, 2));
    console.log(`Tokens used: ${result.tokensUsed}`);
    console.log(`Model used: ${result.model}`);

    // Example with typed result
    interface InvoiceData {
      invoiceNumber: string;
      date: string;
      customerName: string;
      totalAmount: number;
    }

    const typedResult = await extractor.extract<InvoiceData>({
      pdfPath: './tests/fixtures/sample-invoice.pdf',
      schema: {
        invoiceNumber: { type: 'string' },
        date: { type: 'string' },
        customerName: { type: 'string' },
        totalAmount: { type: 'number' },
      },
    });

    // Now TypeScript knows the structure
    console.log(`Invoice: ${typedResult.data.invoiceNumber}`);
    console.log(`Customer: ${typedResult.data.customerName}`);
    console.log(`Total: $${typedResult.data.totalAmount}`);

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error extracting data:', error.message);
    }
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}
