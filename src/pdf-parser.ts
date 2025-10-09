import * as fs from 'fs';
import { pdf } from 'pdf-parse';
import { ParsedPdf } from './types';

/**
 * Parse a PDF file and extract its text content
 * @param pdfPath - Path to the PDF file
 * @returns Parsed PDF data including text and metadata
 */
export async function parsePdfFromPath(pdfPath: string): Promise<ParsedPdf> {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    return await parsePdfFromBuffer(dataBuffer);
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
 * @returns Parsed PDF data including text and metadata
 */
export async function parsePdfFromBuffer(buffer: Buffer): Promise<ParsedPdf> {
  try {
    const data = await pdf(buffer);
    
    return {
      text: data.text,
      numPages: data.pages.length,
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
 * @param pdfPath - Path to the PDF file or Buffer
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
