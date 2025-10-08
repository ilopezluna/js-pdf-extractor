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

  // Validate nested schemas
  try {
    // Check if it's a simple schema format (properties defined directly)
    // or full JSON schema format (with type: 'object' and properties field)
    if (!schema.type && !schema.properties) {
      // Simple format - validate each property
      for (const [key, value] of Object.entries(schema)) {
        validateNestedSchema(value, `root.${key}`);
      }
    } else {
      // Full format - validate the schema structure
      validateNestedSchema(schema);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Schema validation failed: ${error.message}`);
    }
    throw error;
  }

  return true;
}

/**
 * Recursively validate nested schema properties
 * @param schema - The schema to validate
 * @param path - Current path in schema (for error messages)
 */
function validateNestedSchema(schema: any, path: string = 'root'): void {
  if (!schema || typeof schema !== 'object') {
    return;
  }

  // Validate type field if present
  if (schema.type) {
    const validTypes = ['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'];
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    
    for (const type of types) {
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid type "${type}" at ${path}. Valid types are: ${validTypes.join(', ')}`);
      }
    }
  }

  // Validate properties if present
  if (schema.properties) {
    if (typeof schema.properties !== 'object') {
      throw new Error(`Properties must be an object at ${path}`);
    }

    // Recursively validate nested properties
    for (const [key, value] of Object.entries(schema.properties)) {
      validateNestedSchema(value, `${path}.properties.${key}`);
    }
  }

  // Validate items if present (for arrays)
  if (schema.items) {
    if (typeof schema.items !== 'object') {
      throw new Error(`Items must be an object at ${path}`);
    }
    validateNestedSchema(schema.items, `${path}.items`);
  }

  // Validate required field if present
  if (schema.required) {
    if (!Array.isArray(schema.required)) {
      throw new Error(`Required must be an array at ${path}`);
    }
    
    // Check that required fields exist in properties
    if (schema.properties) {
      const propertyNames = Object.keys(schema.properties);
      for (const requiredField of schema.required) {
        if (!propertyNames.includes(requiredField)) {
          throw new Error(`Required field "${requiredField}" not found in properties at ${path}`);
        }
      }
    }
  }
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
