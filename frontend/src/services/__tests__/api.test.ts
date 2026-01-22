/**
 * Integration tests for API client configuration and error handling.
 */

import { ApiException, getErrorMessage, isRetryableError } from '../api';

describe('API Client', () => {
  describe('Basic Configuration', () => {
    it('should be properly configured', () => {
      // Test that the API client module can be imported without errors
      expect(typeof getErrorMessage).toBe('function');
      expect(typeof isRetryableError).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should create ApiException correctly', () => {
      const apiError = {
        message: 'Test error',
        code: 'TEST_ERROR',
        timestamp: '2023-01-01T00:00:00Z',
      };

      const exception = new ApiException(apiError, 400);
      
      expect(exception.message).toBe('Test error');
      expect(exception.code).toBe('TEST_ERROR');
      expect(exception.status).toBe(400);
      expect(exception.timestamp).toBe('2023-01-01T00:00:00Z');
    });
  });

  describe('Utility Functions', () => {
    describe('isRetryableError', () => {
      it('should identify retryable errors', () => {
        const serverError = new ApiException({
          message: 'Server Error',
          code: 'SERVER_ERROR',
          timestamp: new Date().toISOString(),
        }, 500);

        const networkError = new ApiException({
          message: 'Network Error',
          code: 'NETWORK_ERROR',
          timestamp: new Date().toISOString(),
        }, 0);

        const timeoutError = new ApiException({
          message: 'Timeout',
          code: 'TIMEOUT_ERROR',
          timestamp: new Date().toISOString(),
        }, 408);

        expect(isRetryableError(serverError)).toBe(true);
        expect(isRetryableError(networkError)).toBe(true);
        expect(isRetryableError(timeoutError)).toBe(true);
      });

      it('should identify non-retryable errors', () => {
        const clientError = new ApiException({
          message: 'Bad Request',
          code: 'BAD_REQUEST',
          timestamp: new Date().toISOString(),
        }, 400);

        const authError = new ApiException({
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
          timestamp: new Date().toISOString(),
        }, 401);

        expect(isRetryableError(clientError)).toBe(false);
        expect(isRetryableError(authError)).toBe(false);
        expect(isRetryableError(new Error('Regular error'))).toBe(false);
      });
    });

    describe('getErrorMessage', () => {
      it('should extract message from ApiException', () => {
        const apiError = new ApiException({
          message: 'API Error Message',
          code: 'API_ERROR',
          timestamp: new Date().toISOString(),
        });

        expect(getErrorMessage(apiError)).toBe('API Error Message');
      });

      it('should extract message from regular Error', () => {
        const error = new Error('Regular error message');
        expect(getErrorMessage(error)).toBe('Regular error message');
      });

      it('should handle unknown error types', () => {
        expect(getErrorMessage('string error')).toBe('An unexpected error occurred');
        expect(getErrorMessage(null)).toBe('An unexpected error occurred');
        expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
      });
    });
  });
});