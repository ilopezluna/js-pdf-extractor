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
    // Wrap simple schemas in proper JSON schema format for validation
    const schemaToValidate = schema.type || schema.properties 
      ? schema 
      : {
          type: 'object',
          properties: schema,
        };
    
    ajv.compile(schemaToValidate);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Schema validation failed: ${error.message}`);
    }
    throw error;
  }

  return true;
}

/**
 * Convert a JSON schema to OpenAI function calling format
 * @param schema - The JSON schema
 * @returns Formatted schema for OpenAI
 */
export function formatSchemaForOpenAI(schema: Record<string, any>): Record<string, any> {
  // If the schema already has the correct structure, return it
  if (schema.type === 'object' && schema.properties) {
    return schema;
  }

  // Otherwise, wrap it in the expected format
  return {
    type: 'object',
    properties: schema,
    required: Object.keys(schema),
    additionalProperties: false,
  };
}

/**
 * Get detailed error information from last validation
 * @returns Array of validation error messages
 */
export function getValidationErrors(): string[] {
  const errors = ajv.errors || [];
  return errors.map((err) => `${err.instancePath || 'root'}: ${err.message}`);
}
