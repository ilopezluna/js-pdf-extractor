import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pdf } from 'pdf-parse';
import { pdf as pdfToImgConverter } from 'pdf-to-img';
import { ParsedPdf, PdfPageImage } from './types.js';

/**
 * Convert PDF to images using pdf-to-img
 * @param pdfSource - Path to PDF or Buffer
 * @returns Array of page images as base64 strings
 */
async function convertPdfToImages(pdfSource: string | Buffer): Promise<PdfPageImage[]> {
  let tempFilePath: string | null = null;
  
  try {
    
    let pdfInput: string | Buffer;

    // If Buffer, write to temp file since pdf-to-img works better with file paths
    if (Buffer.isBuffer(pdfSource)) {
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `temp-pdf-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
      await fs.promises.writeFile(tempFilePath, pdfSource);
      pdfInput = tempFilePath;
    } else {
      pdfInput = pdfSource;
    }

    // Convert PDF to images with scale factor for quality
    const document = await pdfToImgConverter(pdfInput, { scale: 3 });
    
    const images: PdfPageImage[] = [];
    let pageNum = 1;
    
    // Iterate through all pages
    for await (const imageBuffer of document) {
      images.push({
        page: pageNum,
        base64: imageBuffer.toString('base64'),
      });
      pageNum++;
    }

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
    // Always cleanup temp file if it was created
    if (tempFilePath) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (cleanupError) {
        // Log cleanup failure but don't throw - cleanup errors shouldn't break the flow
        console.error(
          `Warning: Failed to cleanup temporary file ${tempFilePath}:`,
          cleanupError instanceof Error ? cleanupError.message : 'Unknown error'
        );
      }
    }
  }
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
  try {
    const data = await pdf(buffer);
    const threshold = options?.textThreshold ?? 100;
    
    // Check if PDF has extractable text
    if (hasExtractableText(data.text, threshold)) {
      return {
        content: {
          type: 'text',
          content: data.text,
        },
        numPages: data.pages.length,
        info: data.info,
      };
    }
    
    // If no text, convert to images
    const images = await convertPdfToImages(buffer);
    
    return {
      content: {
        type: 'images',
        content: images,
      },
      numPages: data.pages.length, // Use original page count even if conversion fails
      info: data.info,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
    throw error;
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
      await parsePdfFromPath(input);
    } else {
      await parsePdfFromBuffer(input);
    }
    return true;
  } catch {
    return false;
  }
}
