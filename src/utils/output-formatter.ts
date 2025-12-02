import { encode } from '@toon-format/toon';

/**
 * Output format options for API responses
 * - json: Full JSON output (default, backward compatible)
 * - toon: TOON format (50-70% token savings)
 * - compact: Essential fields only in TOON format (up to 76% token savings)
 */
export type OutputFormat = 'json' | 'toon' | 'compact';

/**
 * Get a nested property value from an object using dot notation
 * @param obj - The object to extract from
 * @param path - Dot-notation path (e.g., 'author.display_name')
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Set a nested property value in an object using dot notation
 * @param obj - The object to modify
 * @param path - Dot-notation path (e.g., 'author.display_name')
 * @param value - The value to set
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

/**
 * Extract specified fields from an object
 * @param obj - Source object
 * @param fields - Array of field paths to extract (supports dot notation)
 */
function extractFieldsFromObject(obj: unknown, fields: string[]): Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null) {
    return {};
  }

  const result: Record<string, unknown> = {};

  for (const field of fields) {
    const value = getNestedValue(obj, field);
    if (value !== undefined) {
      setNestedValue(result, field, value);
    }
  }

  return result;
}

/**
 * Extract specified fields from data (handles arrays and single objects)
 * @param data - Source data (object or array)
 * @param fields - Array of field paths to extract
 */
export function extractFields(data: unknown, fields: string[]): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => extractFieldsFromObject(item, fields));
  }

  // Handle paginated responses with 'values' array
  if (typeof data === 'object' && data !== null && 'values' in data) {
    const paginatedData = data as Record<string, unknown>;
    return {
      ...paginatedData,
      values: Array.isArray(paginatedData.values)
        ? paginatedData.values.map((item) => extractFieldsFromObject(item, fields))
        : paginatedData.values,
    };
  }

  return extractFieldsFromObject(data, fields);
}

/**
 * Format output data according to the specified format
 * @param data - The data to format
 * @param format - Output format ('json', 'toon', or 'compact')
 * @param compactFields - Fields to include when using 'compact' format
 */
export function formatOutput(
  data: unknown,
  format: OutputFormat,
  compactFields?: string[]
): string {
  switch (format) {
    case 'toon':
      return encode(data);

    case 'compact':
      if (compactFields && compactFields.length > 0) {
        const compacted = extractFields(data, compactFields);
        return encode(compacted);
      }
      // Fall back to toon if no compact fields specified
      return encode(data);

    case 'json':
    default:
      return JSON.stringify(data, null, 2);
  }
}

/**
 * Get the default output format from environment or config
 */
export function getDefaultFormat(): OutputFormat {
  const envFormat = process.env.BITBUCKET_OUTPUT_FORMAT?.toLowerCase();
  if (envFormat === 'toon' || envFormat === 'compact' || envFormat === 'json') {
    return envFormat;
  }
  return 'json';
}

