"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseApiFootballErrors = parseApiFootballErrors;
exports.isRateLimitError = isRateLimitError;
exports.hasApiErrors = hasApiErrors;
exports.getErrorSummary = getErrorSummary;
function isEmptyErrors(errors) {
    if (!errors)
        return true;
    if (Array.isArray(errors))
        return errors.length === 0;
    if (typeof errors === 'object')
        return Object.keys(errors).length === 0;
    return true;
}
function parseApiFootballErrors(response) {
    const result = {
        hasError: false,
        errorType: null,
        errorCode: null,
        errorMessage: null,
        errors: {},
    };
    if (isEmptyErrors(response.errors)) {
        return result;
    }
    if (typeof response.errors === 'object' && !Array.isArray(response.errors)) {
        const errors = response.errors;
        result.errors = errors;
        result.hasError = true;
        if (errors.rateLimit) {
            result.errorType = 'rate_limit';
            result.errorCode = 'RATE_LIMIT_EXCEEDED';
            result.errorMessage = errors.rateLimit;
        }
        else if (errors.token) {
            result.errorType = 'auth';
            result.errorCode = 'INVALID_TOKEN';
            result.errorMessage = errors.token;
        }
        else if (errors.requests) {
            result.errorType = 'rate_limit';
            result.errorCode = 'REQUEST_LIMIT';
            result.errorMessage = errors.requests;
        }
        else if (errors.access) {
            result.errorType = 'access';
            result.errorCode = 'ACCESS_DENIED';
            result.errorMessage = errors.access;
        }
        else if (errors.time) {
            result.errorType = 'validation';
            result.errorCode = 'TIME_ERROR';
            result.errorMessage = errors.time;
        }
        else {
            const firstKey = Object.keys(errors)[0];
            if (firstKey) {
                result.errorType = 'unknown';
                result.errorCode = firstKey.toUpperCase();
                result.errorMessage = errors[firstKey] || 'Unknown error';
            }
        }
    }
    if (Array.isArray(response.errors) && response.errors.length > 0) {
        result.hasError = true;
        result.errorType = 'unknown';
        result.errorCode = 'API_ERROR';
        result.errorMessage = response.errors.join(', ');
    }
    return result;
}
function isRateLimitError(response) {
    const parsed = parseApiFootballErrors(response);
    return parsed.errorType === 'rate_limit';
}
function hasApiErrors(response) {
    return parseApiFootballErrors(response).hasError;
}
function getErrorSummary(parsed) {
    if (!parsed.hasError)
        return '';
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
//# sourceMappingURL=api-football-response.interceptor.js.map