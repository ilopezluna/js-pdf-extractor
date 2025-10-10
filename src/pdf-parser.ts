import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pdf } from 'pdf-parse';
import { fromPath } from 'pdf2pic';
import { ParsedPdf, PdfPageImage } from './types';

/**
 * Convert PDF to images using pdf2pic
 * @param pdfSource - Path to PDF or Buffer
 * @returns Array of page images as base64 strings
 */
async function convertPdfToImages(pdfSource: string | Buffer): Promise<PdfPageImage[]> {
  let tempFilePath: string | null = null;
  
  try {
    let pdfPath: string;

    // If Buffer, write to temp file asynchronously
    if (Buffer.isBuffer(pdfSource)) {
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `temp-pdf-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
      await fs.promises.writeFile(tempFilePath, pdfSource);
      pdfPath = tempFilePath;
    } else {
      pdfPath = pdfSource;
    }

    // Get number of pages first using async read
    const dataBuffer = await fs.promises.readFile(pdfPath);
    const pdfData = await pdf(dataBuffer);
    const numPages = pdfData.pages.length;

    if (numPages === 0) {
      throw new Error('PDF contains no pages');
    }

    // Convert all pages to images
    const converter = fromPath(pdfPath, {
      density: 200,
      saveFilename: 'page',
      savePath: os.tmpdir(),
      format: 'png',
      width: 2000,
      height: 2000,
    });

    const images: PdfPageImage[] = [];
    const conversionErrors: Array<{ page: number; error: string }> = [];
    
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const result = await converter(pageNum, { responseType: 'base64' });
        if (result && result.base64) {
          images.push({
            page: pageNum,
            base64: result.base64,
          });
        } else {
          conversionErrors.push({
            page: pageNum,
            error: 'Conversion returned empty result',
          });
        }
      } catch (error) {
        conversionErrors.push({
          page: pageNum,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Validate conversion results
    if (images.length === 0) {
      const errorDetails = conversionErrors.map(e => `page ${e.page}: ${e.error}`).join('; ');
      // Check if errors suggest missing system dependencies
      const hasDependencyErrors = conversionErrors.some(e => 
        e.error.toLowerCase().includes('graphicsmagick') ||
        e.error.toLowerCase().includes('gm') ||
        e.error.toLowerCase().includes('poppler') ||
        e.error.toLowerCase().includes('command not found') ||
        e.error.includes('Conversion returned empty result')
      );
      
      if (hasDependencyErrors) {
        // Log warning but return empty array - system dependencies may not be installed
        console.warn(
          `Warning: PDF to image conversion failed (likely missing system dependencies like GraphicsMagick or Poppler). ` +
          `Returning empty images array. Install required dependencies for scanned PDF support. Errors: ${errorDetails}`
        );
        return images; // Return empty array
      } else {
        // Throw for other unexpected errors
        throw new Error(`Failed to convert any PDF pages to images. Errors: ${errorDetails}`);
      }
    }

    // Warn about partial conversions
    if (images.length < numPages) {
      const errorDetails = conversionErrors.map(e => `page ${e.page}: ${e.error}`).join('; ');
      console.warn(
        `Partial PDF conversion: ${images.length}/${numPages} pages converted successfully. Failed pages: ${errorDetails}`
      );
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
