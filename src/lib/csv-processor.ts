import { CsvRow, AnswerPayload, AdditionalQuestion, ValidationError } from '@/types';

/**
 * Invisible characters to strip from values
 */
const INVISIBLE_CHARS = [
  '\u200B', // Zero-width space
  '\u200C', // Zero-width non-joiner
  '\u200D', // Zero-width joiner
  '\uFEFF', // Byte order mark
];

/**
 * Strip invisible characters from a string
 */
export function stripInvisibleChars(value: string | undefined): string {
  if (!value) return '';
  let result = value;
  for (const char of INVISIBLE_CHARS) {
    result = result.split(char).join('');
  }
  return result;
}

/**
 * Validate CSV headers - check for required NPS column
 */
export function validateHeaders(headers: string[]): string | null {
  const normalizedHeaders = headers.map(h => stripInvisibleChars(h).trim().toUpperCase());
  if (!normalizedHeaders.includes('NPS')) {
    return "Missing required 'NPS' column header";
  }
  return null;
}

/**
 * Validate date format DD.MM.YYYY HH:MM
 * Returns error message or null if valid
 */
export function validateDateFormat(date: string | undefined, rowIndex: number): string | null {
  if (!date || date.trim() === '') {
    return null; // Empty date is allowed - will use current time
  }

  const cleaned = stripInvisibleChars(date).trim();

  // Pattern: DD.MM.YYYY HH:MM
  const pattern = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/;
  const match = cleaned.match(pattern);

  if (!match) {
    return `Row ${rowIndex + 1}: Date '${date}' is invalid (expected format: DD.MM.YYYY HH:MM)`;
  }

  const [, dayStr, monthStr, yearStr, hourStr, minuteStr] = match;
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (day < 1 || day > 31) {
    return `Row ${rowIndex + 1}: Date '${date}' is invalid (expected format: DD.MM.YYYY HH:MM)`;
  }
  if (month < 1 || month > 12) {
    return `Row ${rowIndex + 1}: Date '${date}' is invalid (expected format: DD.MM.YYYY HH:MM)`;
  }
  if (year < 1900 || year > 2100) {
    return `Row ${rowIndex + 1}: Date '${date}' is invalid (expected format: DD.MM.YYYY HH:MM)`;
  }
  if (hour < 0 || hour > 23) {
    return `Row ${rowIndex + 1}: Date '${date}' is invalid (expected format: DD.MM.YYYY HH:MM)`;
  }
  if (minute < 0 || minute > 59) {
    return `Row ${rowIndex + 1}: Date '${date}' is invalid (expected format: DD.MM.YYYY HH:MM)`;
  }

  return null;
}

/**
 * Format date from DD.MM.YYYY HH:MM to YYYY-MM-DD HH:MM:SS
 */
export function formatDate(date: string | undefined): string {
  if (!date || stripInvisibleChars(date).trim() === '') {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  }

  const cleaned = stripInvisibleChars(date).trim();
  const pattern = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})$/;
  const match = cleaned.match(pattern);

  if (match) {
    const [, day, month, year, hour, minute] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
  }

  // Try date-only format: DD.MM.YYYY
  const dateOnlyPattern = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
  const dateOnlyMatch = cleaned.match(dateOnlyPattern);

  if (dateOnlyMatch) {
    const [, day, month, year] = dateOnlyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} 12:00:00`;
  }

  // Fallback to current time
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Parse additional answer value (handles [{Maybe}] format)
 */
export function parseAdditionalAnswer(value: string | undefined): string | string[] {
  if (!value) return '';

  const cleaned = stripInvisibleChars(value).trim();

  if (cleaned.startsWith('[{') && cleaned.endsWith('}]')) {
    // Parse [{Maybe},{Yes}] format
    const inner = cleaned.slice(1, -1); // Remove outer []
    return inner
      .split('},{')
      .map(s => s.replace(/^\{/, '').replace(/\}$/, ''));
  }

  return cleaned;
}

/**
 * Extract properties from CSV row (all columns except reserved ones)
 */
export function extractProperties(row: CsvRow): Record<string, string> {
  const reservedColumns = ['NPS', 'Comment', 'Date', ''];

  // Add [Q1] through [Q20] to reserved
  for (let i = 1; i <= 20; i++) {
    reservedColumns.push(`[Q${i}]`);
  }

  const properties: Record<string, string> = {};

  for (const [key, value] of Object.entries(row)) {
    const cleanKey = stripInvisibleChars(key).trim();
    if (!reservedColumns.includes(cleanKey) && value) {
      properties[cleanKey] = stripInvisibleChars(value);
    }
  }

  return properties;
}

/**
 * Build answer payload from CSV row
 */
export function buildAnswerPayload(row: CsvRow): AnswerPayload {
  return {
    answer_score: stripInvisibleChars(row.NPS) || '',
    response: stripInvisibleChars(row.Comment) || '',
    properties: extractProperties(row),
    inserted_at: formatDate(row.Date),
  };
}

/**
 * Get additional answer columns from CSV row
 */
export function getAdditionalAnswers(
  row: CsvRow,
  questions: AdditionalQuestion[]
): Array<{ questionId: string; answer: string | string[] }> {
  return questions.map(question => {
    const colName = `[Q${question.position}]`;
    const value = row[colName];
    return {
      questionId: question.public_hash_id,
      answer: parseAdditionalAnswer(value),
    };
  });
}

/**
 * Validate a single CSV row
 * Returns array of validation errors
 */
export function validateRow(row: CsvRow, rowIndex: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate NPS
  const npsValue = stripInvisibleChars(row.NPS).trim();

  if (!npsValue) {
    errors.push({
      row: rowIndex + 1,
      field: 'NPS',
      message: `Row ${rowIndex + 1}: NPS score is empty (required field)`,
    });
  } else {
    const npsNum = parseInt(npsValue, 10);
    if (isNaN(npsNum) || npsNum < 0 || npsNum > 10) {
      errors.push({
        row: rowIndex + 1,
        field: 'NPS',
        message: `Row ${rowIndex + 1}: NPS score '${row.NPS}' is invalid (must be a number 0-10)`,
      });
    }
  }

  // Validate Date if present
  const dateError = validateDateFormat(row.Date, rowIndex);
  if (dateError) {
    errors.push({
      row: rowIndex + 1,
      field: 'Date',
      message: dateError,
    });
  }

  return errors;
}

/**
 * Validate entire CSV data
 * Returns array of all validation errors
 */
export function validateCSV(headers: string[], data: CsvRow[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate headers
  const headerError = validateHeaders(headers);
  if (headerError) {
    errors.push({
      row: 0,
      field: 'header',
      message: headerError,
    });
    return errors; // Can't validate rows without NPS column
  }

  // Validate each row
  for (let i = 0; i < data.length; i++) {
    const rowErrors = validateRow(data[i], i);
    errors.push(...rowErrors);
  }

  return errors;
}

/**
 * Check if row is valid (for processing)
 */
export function isRowValid(row: CsvRow): boolean {
  const npsValue = stripInvisibleChars(row.NPS).trim();
  if (!npsValue) return false;

  const npsNum = parseInt(npsValue, 10);
  if (isNaN(npsNum) || npsNum < 0 || npsNum > 10) return false;

  return true;
}
