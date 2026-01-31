import { ApiFootballResponse } from '../interfaces';

/**
 * API Football Error Types
 * API-Football returns HTTP 200 with errors in the response body
 */
export interface ApiFootballError {
  rateLimit?: string;
  token?: string;
  requests?: string;
  time?: string;
  access?: string;
  [key: string]: string | undefined;
}

export interface ParsedApiError {
  hasError: boolean;
  errorType: 'rate_limit' | 'auth' | 'access' | 'validation' | 'unknown' | null;
  errorCode: string | null;
  errorMessage: string | null;
  errors: ApiFootballError;
}

/**
 * Check if errors object is empty
 */
function isEmptyErrors(errors: unknown): boolean {
  if (!errors) return true;
  if (Array.isArray(errors)) return errors.length === 0;
  if (typeof errors === 'object') return Object.keys(errors).length === 0;
  return true;
}

/**
 * Parse API Football response to detect errors
 * API-Football returns errors in the response body even with HTTP 200
 */
export function parseApiFootballErrors<T>(response: ApiFootballResponse<T>): ParsedApiError {
  const result: ParsedApiError = {
    hasError: false,
    errorType: null,
    errorCode: null,
    errorMessage: null,
    errors: {},
  };

  // Check if errors exist and is not empty
  if (isEmptyErrors(response.errors)) {
    return result;
  }

  // Handle errors as object (most common case)
  if (typeof response.errors === 'object' && !Array.isArray(response.errors)) {
    const errors = response.errors as ApiFootballError;
    result.errors = errors;
    result.hasError = true;

    // Determine error type and message
    if (errors.rateLimit) {
      result.errorType = 'rate_limit';
      result.errorCode = 'RATE_LIMIT_EXCEEDED';
      result.errorMessage = errors.rateLimit;
    } else if (errors.token) {
      result.errorType = 'auth';
      result.errorCode = 'INVALID_TOKEN';
      result.errorMessage = errors.token;
    } else if (errors.requests) {
      result.errorType = 'rate_limit';
      result.errorCode = 'REQUEST_LIMIT';
      result.errorMessage = errors.requests;
    } else if (errors.access) {
      result.errorType = 'access';
      result.errorCode = 'ACCESS_DENIED';
      result.errorMessage = errors.access;
    } else if (errors.time) {
      result.errorType = 'validation';
      result.errorCode = 'TIME_ERROR';
      result.errorMessage = errors.time;
    } else {
      // Get first error key
      const firstKey = Object.keys(errors)[0];
      if (firstKey) {
        result.errorType = 'unknown';
        result.errorCode = firstKey.toUpperCase();
        result.errorMessage = errors[firstKey] || 'Unknown error';
      }
    }
  }

  // Handle errors as array (rare case)
  if (Array.isArray(response.errors) && response.errors.length > 0) {
    result.hasError = true;
    result.errorType = 'unknown';
    result.errorCode = 'API_ERROR';
    result.errorMessage = response.errors.join(', ');
  }

  return result;
}

/**
 * Check if response indicates a rate limit error
 */
export function isRateLimitError<T>(response: ApiFootballResponse<T>): boolean {
  const parsed = parseApiFootballErrors(response);
  return parsed.errorType === 'rate_limit';
}

/**
 * Check if response has any API-Football errors
 */
export function hasApiErrors<T>(response: ApiFootballResponse<T>): boolean {
  return parseApiFootballErrors(response).hasError;
}

/**
 * Get human-readable error summary
 */
export function getErrorSummary(parsed: ParsedApiError): string {
  if (!parsed.hasError) return '';
  
  switch (parsed.errorType) {
    case 'rate_limit':
      return `Rate Limit: ${parsed.errorMessage}`;
    case 'auth':
      return `Authentication Error: ${parsed.errorMessage}`;
    case 'access':
      return `Access Denied: ${parsed.errorMessage}`;
    case 'validation':
      return `Validation Error: ${parsed.errorMessage}`;
    default:
      return parsed.errorMessage || 'Unknown API error';
  }
}
