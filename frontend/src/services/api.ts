/**
 * Base API configuration and utilities for FormVault Insurance Portal.
 * 
 * This module provides the core Axios configuration with interceptors
 * for error handling, retry logic, and request/response processing.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiError } from '../types';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = 'v1';
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

/**
 * Custom error class for API-related errors
 */
export class ApiException extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly timestamp: string;

  constructor(error: ApiError, status: number = 500) {
    super(error.message);
    this.name = 'ApiException';
    this.status = status;
    this.code = error.code;
    this.timestamp = error.timestamp;
  }
}

/**
 * Retry configuration interface
 */
interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

/**
 * Default retry condition - retry on network errors and 5xx status codes
 */
const defaultRetryCondition = (error: AxiosError): boolean => {
  return (
    !error.response || // Network error
    error.code === 'ECONNABORTED' || // Timeout
    (error.response.status >= 500 && error.response.status < 600) // Server errors
  );
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const calculateRetryDelay = (attempt: number, baseDelay: number): number => {
  return baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
};

/**
 * Create and configure the main Axios instance
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor for adding common headers and logging
  client.interceptors.request.use(
    (config) => {
      // Add timestamp to requests for debugging
      config.metadata = { startTime: Date.now() };
      
      // Log request in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      }
      
      return config;
    },
    (error) => {
      console.error('❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and logging
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Calculate request duration
      const duration = Date.now() - (response.config.metadata?.startTime || 0);
      
      // Log response in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ API Response: ${response.status} ${response.config.url} (${duration}ms)`);
      }
      
      return response;
    },
    (error: AxiosError) => {
      // Calculate request duration if available
      const duration = error.config?.metadata?.startTime 
        ? Date.now() - error.config.metadata.startTime 
        : 0;

      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ API Error: ${error.response?.status || 'Network'} ${error.config?.url} (${duration}ms)`, error);
      }

      // Transform API errors to our custom format
      if (error.response?.data?.error) {
        const apiError = error.response.data.error as ApiError;
        throw new ApiException(apiError, error.response.status);
      }

      // Handle network errors
      if (!error.response) {
        throw new ApiException(
          {
            message: 'Network error - please check your connection',
            code: 'NETWORK_ERROR',
            timestamp: new Date().toISOString(),
          },
          0
        );
      }

      // Handle timeout errors
      if (error.code === 'ECONNABORTED') {
        throw new ApiException(
          {
            message: 'Request timeout - please try again',
            code: 'TIMEOUT_ERROR',
            timestamp: new Date().toISOString(),
          },
          408
        );
      }

      // Handle other HTTP errors
      throw new ApiException(
        {
          message: error.response.statusText || 'An unexpected error occurred',
          code: 'HTTP_ERROR',
          timestamp: new Date().toISOString(),
        },
        error.response.status
      );
    }
  );

  return client;
};

/**
 * Add retry functionality to an Axios instance
 */
const addRetryInterceptor = (
  client: AxiosInstance, 
  config: RetryConfig = {
    retries: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
    retryCondition: defaultRetryCondition,
  }
): void => {
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const { retries, retryDelay, retryCondition } = config;
      const shouldRetry = retryCondition ? retryCondition(error) : defaultRetryCondition(error);
      
      // Get current retry count
      const currentRetry = (error.config as any)?.__retryCount || 0;
      
      if (shouldRetry && currentRetry < retries) {
        // Increment retry count
        (error.config as any).__retryCount = currentRetry + 1;
        
        // Calculate delay with exponential backoff
        const delay = calculateRetryDelay(currentRetry + 1, retryDelay);
        
        console.log(`🔄 Retrying request (${currentRetry + 1}/${retries}) after ${delay}ms: ${error.config?.url}`);
        
        // Wait before retrying
        await sleep(delay);
        
        // Retry the request
        return client.request(error.config!);
      }
      
      // No more retries, throw the error
      throw error;
    }
  );
};

// Create the main API client
export const apiClient = createApiClient();

// Add retry functionality
addRetryInterceptor(apiClient);

/**
 * Create a specialized client for file uploads with different timeout and retry settings
 */
export const createFileUploadClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
    timeout: 120000, // 2 minutes for file uploads
    headers: {
      'Accept': 'application/json',
    },
  });

  // Add basic interceptors (without retry for uploads to avoid duplicate uploads)
  client.interceptors.request.use(
    (config) => {
      config.metadata = { startTime: Date.now() };
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📤 File Upload: ${config.method?.toUpperCase()} ${config.url}`);
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      const duration = Date.now() - (response.config.metadata?.startTime || 0);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ File Upload Complete: ${response.status} (${duration}ms)`);
      }
      
      return response;
    },
    (error: AxiosError) => {
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ File Upload Error:`, error);
      }

      // Transform errors similar to main client
      if (error.response?.data?.error) {
        const apiError = error.response.data.error as ApiError;
        throw new ApiException(apiError, error.response.status);
      }

      if (!error.response) {
        throw new ApiException(
          {
            message: 'File upload failed - please check your connection',
            code: 'UPLOAD_NETWORK_ERROR',
            timestamp: new Date().toISOString(),
          },
          0
        );
      }

      throw new ApiException(
        {
          message: error.response.statusText || 'File upload failed',
          code: 'UPLOAD_ERROR',
          timestamp: new Date().toISOString(),
        },
        error.response.status
      );
    }
  );

  return client;
};

/**
 * Utility function to check if an error is retryable
 */
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof ApiException) {
    return error.status >= 500 || error.status === 0 || error.code === 'TIMEOUT_ERROR';
  }
  return false;
};

/**
 * Utility function to extract error message from various error types
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiException) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export default apiClient;