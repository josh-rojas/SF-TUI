import { LogEntry, LogLevel } from './logger'; // Assuming LogLevel might be needed for formatting decisions

/**
 * Defines the structure for detailed information accompanying a log entry.
 */
export type LogDetails = Record<string, any>;

/**
 * Utility function to sanitize a string for logging.
 * Removes newlines and carriage returns to prevent log injection or formatting issues.
 * @param str - The string to sanitize.
 * @returns The sanitized string.
 */
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str;
  return str.replace(/[\r\n]+/g, ' ');
}

/**
 * Formats log entries for output.
 * @class
 */
export class LogFormatter {
  /**
   * Formats a log entry into a string.
   * Sanitizes the message and string values within details.
   * @param entry - The log entry to format.
   * @returns The formatted log string.
   */
  public format(entry: LogEntry): string {
    let formattedMessage = sanitizeString(entry.message);
    let formattedDetails = '';
    let formattedStackTrace = '';

    if (entry.details) {
      const sanitizedDetails: LogDetails = {};
      for (const key in entry.details) {
        if (Object.prototype.hasOwnProperty.call(entry.details, key)) {
          const value = entry.details[key];
          sanitizedDetails[key] = typeof value === 'string' ? sanitizeString(value) : value;
        }
      }
      formattedDetails = `\nDetails: ${JSON.stringify(sanitizedDetails, null, 2)}`;
    }

    if (entry.stackTrace) {
      // Stack traces can be long and multi-line; decide if they need full sanitization
      // For now, assume stack traces are generally safe but could be trimmed or have minimal sanitization
      formattedStackTrace = `\nStack Trace: ${entry.stackTrace}`;
    }

    return `[${entry.timestamp}] [${entry.level}] ${formattedMessage}${formattedDetails}${formattedStackTrace}`;
  }
}

