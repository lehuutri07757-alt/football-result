import { ApiFootballResponse } from '../interfaces';
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
export declare function parseApiFootballErrors<T>(response: ApiFootballResponse<T>): ParsedApiError;
export declare function isRateLimitError<T>(response: ApiFootballResponse<T>): boolean;
export declare function hasApiErrors<T>(response: ApiFootballResponse<T>): boolean;
export declare function getErrorSummary(parsed: ParsedApiError): string;
