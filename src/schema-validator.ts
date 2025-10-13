import Ajv from 'ajv';

// Create Ajv instance for JSON Schema validation
const ajv = new Ajv({
  strict: false, // Allow additional properties not in schema
  allErrors: true, // Collect all errors, not just first one
});

/**
 * Validate that a JSON schema is properly formatted
 * @param schema - The JSON schema to validate
 * @returns True if the schema is valid
 * @throws Error with detailed validation errors if schema is invalid
 */
export function validateSchema(schema: Record<string, any>): boolean {
  // Basic type checking
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new Error('Schema must be a non-null object');
  }

  // Check for empty schema
  if (Object.keys(schema).length === 0) {
    throw new Error('Schema cannot be empty');
  }

  // Use AJV to validate the schema by compiling it
  // If the schema is invalid, ajv.compile() will throw an error
  try {
    ajv.compile(schema);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Schema validation failed: ${error.message}`);
    }
    throw error;
  }

  return true;
}
