import {
  validateSchema,
  formatSchemaForOpenAI,
  getValidationErrors,
} from '../src/schema-validator.js';

describe('Schema Validator', () => {
  describe('validateSchema', () => {
    it('should return true for valid simple schema', () => {
      const schema = {
        name: { type: 'string' },
        age: { type: 'number' },
      };
      expect(validateSchema(schema)).toBe(true);
    });

    it('should return true for valid full JSON schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      };
      expect(validateSchema(schema)).toBe(true);
    });

    it('should throw error for null schema', () => {
      expect(() => validateSchema(null as any)).toThrow(
        'Schema must be a non-null object',
      );
    });

    it('should throw error for undefined schema', () => {
      expect(() => validateSchema(undefined as any)).toThrow(
        'Schema must be a non-null object',
      );
    });

    it('should throw error for empty object', () => {
      expect(() => validateSchema({})).toThrow('Schema cannot be empty');
    });

    it('should throw error for array schema', () => {
      expect(() => validateSchema([] as any)).toThrow(
        'Schema must be a non-null object',
      );
    });

    it('should throw error for non-object schema', () => {
      expect(() => validateSchema('not an object' as any)).toThrow(
        'Schema must be a non-null object',
      );
      expect(() => validateSchema(123 as any)).toThrow(
        'Schema must be a non-null object',
      );
    });

    it('should validate nested object schemas', () => {
      const schema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
            },
            required: ['name'],
          },
        },
      };
      expect(validateSchema(schema)).toBe(true);
    });

    it('should validate array schemas', () => {
      const schema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
              },
            },
          },
        },
      };
      expect(validateSchema(schema)).toBe(true);
    });

    it('should throw error for invalid type', () => {
      const schema = {
        name: { type: 'invalidType' },
      };
      expect(() => validateSchema(schema)).toThrow('Schema validation failed');
    });

    it('should throw error for invalid properties structure', () => {
      const schema = {
        type: 'object',
        properties: 'not an object',
      };
      expect(() => validateSchema(schema as any)).toThrow();
    });

    it('should throw error for invalid items structure', () => {
      const schema = {
        type: 'array',
        items: 'not an object',
      };
      expect(() => validateSchema(schema as any)).toThrow();
    });

    it('should accept required field not in properties (valid JSON Schema)', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['age'], // 'age' is not in properties - this is valid JSON Schema
      };
      // This is valid JSON Schema, even though it's not useful
      expect(validateSchema(schema)).toBe(true);
    });

    it('should throw error for invalid required structure', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: 'not an array',
      };
      expect(() => validateSchema(schema as any)).toThrow(
        'Schema validation failed',
      );
    });

    it('should validate complex nested schemas', () => {
      const schema = {
        type: 'object',
        properties: {
          invoice: {
            type: 'object',
            properties: {
              number: { type: 'string' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    amount: { type: 'number' },
                  },
                  required: ['description'],
                },
              },
            },
            required: ['number'],
          },
        },
      };
      expect(validateSchema(schema)).toBe(true);
    });

    it('should validate schemas with multiple types', () => {
      const schema = {
        type: 'object',
        properties: {
          value: {
            type: ['string', 'number'],
          },
        },
      };
      expect(validateSchema(schema)).toBe(true);
    });

    it('should validate schemas with all valid types', () => {
      const schema = {
        type: 'object',
        properties: {
          stringField: { type: 'string' },
          numberField: { type: 'number' },
          integerField: { type: 'integer' },
          booleanField: { type: 'boolean' },
          nullField: { type: 'null' },
          objectField: { type: 'object' },
          arrayField: { type: 'array' },
        },
      };
      expect(validateSchema(schema)).toBe(true);
    });
  });

  describe('formatSchemaForOpenAI', () => {
    it('should wrap simple schema in OpenAI format', () => {
      const schema = {
        name: { type: 'string' },
        amount: { type: 'number' },
      };

      const formatted = formatSchemaForOpenAI(schema);

      expect(formatted).toHaveProperty('type', 'object');
      expect(formatted).toHaveProperty('properties');
      expect(formatted.properties).toEqual(schema);
      expect(formatted).toHaveProperty('required');
      expect(formatted.required).toEqual(['name', 'amount']);
      expect(formatted).toHaveProperty('additionalProperties', false);
    });

    it('should return schema as-is if already in correct format', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          amount: { type: 'number' },
        },
        required: ['name'],
      };

      const formatted = formatSchemaForOpenAI(schema);

      expect(formatted).toEqual(schema);
    });

    it('should handle complex nested schema', () => {
      const schema = {
        invoice: {
          type: 'object',
          properties: {
            number: { type: 'string' },
            date: { type: 'string' },
          },
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              price: { type: 'number' },
            },
          },
        },
      };

      const formatted = formatSchemaForOpenAI(schema);

      expect(formatted.type).toBe('object');
      expect(formatted.properties).toEqual(schema);
      expect(formatted.required).toEqual(['invoice', 'items']);
    });
  });

  describe('getValidationErrors', () => {
    it('should return empty array when no errors', () => {
      const errors = getValidationErrors();
      expect(Array.isArray(errors)).toBe(true);
    });
  });
});
