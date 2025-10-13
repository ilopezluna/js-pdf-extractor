import * as fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { ParsedPdf, PdfPageImage } from './types.js';

/**
 * Convert PDF to images using pdf-parse v2's built-in getScreenshot
 * @param pdfSource - Path to PDF or Buffer
 * @returns Array of page images as base64 strings
 */
async function convertPdfToImages(pdfSource: string | Buffer): Promise<PdfPageImage[]> {
  const parser = new PDFParse(
    typeof pdfSource === 'string' 
      ? { url: pdfSource }
      : { data: pdfSource }
  );

  try {
    // Use pdf-parse v2's built-in screenshot functionality
    const result = await parser.getScreenshot({ 
      scale: 3,
      imageDataUrl: true,
      imageBuffer: false 
    });

    const images: PdfPageImage[] = result.pages.map((page) => ({
      page: page.pageNumber,
      base64: page.dataUrl?.split(',')[1] || '', // Extract base64 from data URL
    }));

    if (images.length === 0) {
      throw new Error('PDF conversion produced no images');
    }

    return images;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to convert PDF to images: ${error.message}`);
    }
    throw error;
  } finally {
    await parser.destroy();
  }
}

/**
 * Validate that a buffer contains a valid PDF signature (magic number)
 * @param buffer - Buffer to validate
 * @returns True if buffer starts with PDF signature (%PDF)
 */
function isValidPdfSignature(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) {
    return false;
  }

  // Check PDF signature (magic number)
  const pdfSignature = Buffer.from('%PDF');
  return buffer.slice(0, 4).equals(pdfSignature);
}

/**
 * Detect if PDF has sufficient text content
 * @param text - Extracted text from PDF
 * @param threshold - Minimum text length (default: 100)
 * @returns True if text is sufficient
 */
function hasExtractableText(text: string, threshold: number = 100): boolean {
  if (!text) return false;
  const trimmedText = text.trim();
  return trimmedText.length >= threshold;
}

/**
 * Parse a PDF file and extract its text content
 * @param pdfPath - Path to the PDF file
 * @param options - Parsing options
 * @returns Parsed PDF data including text or images
 */
export async function parsePdfFromPath(
  pdfPath: string,
  options?: { textThreshold?: number }
): Promise<ParsedPdf> {
  try {
    const dataBuffer = await fs.promises.readFile(pdfPath);
    return await parsePdfFromBuffer(dataBuffer, options);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read PDF from path: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Parse a PDF from a buffer and extract its text content
 * @param buffer - PDF file as a Buffer
 * @param options - Parsing options
 * @returns Parsed PDF data including text or images
 */
export async function parsePdfFromBuffer(
  buffer: Buffer,
  options?: { textThreshold?: number }
): Promise<ParsedPdf> {
  // Validate PDF signature before attempting to parse
  if (!isValidPdfSignature(buffer)) {
    throw new Error('Invalid PDF: file does not contain PDF signature');
  }

  const parser = new PDFParse({ data: buffer });
  
  try {
    const threshold = options?.textThreshold ?? 100;
    
    // Extract text and info using pdf-parse v2
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();
    
    // Check if PDF has extractable text
    if (hasExtractableText(textResult.text, threshold)) {
      return {
        content: {
          type: 'text',
          content: textResult.text,
        },
        numPages: infoResult.total,
        info: infoResult.info,
      };
    }
    
    // If no text, convert to images
    await parser.destroy(); // Clean up text parser before creating image parser
    const images = await convertPdfToImages(buffer);
    
    return {
      content: {
        type: 'images',
        content: images,
      },
      numPages: infoResult.total,
      info: infoResult.info,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
    throw error;
  } finally {
    await parser.destroy();
  }
}

/**
 * Validate that a PDF can be parsed
 * @param input - Path to the PDF file or Buffer
 * @returns True if the PDF is valid
 */
export async function validatePdf(input: string | Buffer): Promise<boolean> {
  try {
    if (typeof input === 'string') {
      // For file paths, read and validate the buffer
      const dataBuffer = await fs.promises.readFile(input);
      return isValidPdfSignature(dataBuffer);
    } else {
      // For buffers, check the signature directly
      return isValidPdfSignature(input);
    }
  } catch {
    return false;
  }
}
