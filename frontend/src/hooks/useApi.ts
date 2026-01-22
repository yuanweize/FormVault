/**
 * Custom React hooks for API state management.
 * 
 * These hooks provide a consistent interface for managing API calls,
 * loading states, errors, and data caching across the application.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiException, getErrorMessage, isRetryableError } from '../services/api';

/**
 * Generic API state interface
 */
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * API hook options
 */
export interface UseApiOptions {
  immediate?: boolean; // Execute immediately on mount
  retryOnError?: boolean; // Retry on retryable errors
  retryDelay?: number; // Delay between retries (ms)
  maxRetries?: number; // Maximum number of retries
  cacheKey?: string; // Cache key for data persistence
  cacheDuration?: number; // Cache duration in ms
}

/**
 * Generic hook for API calls with loading, error, and retry management
 */
export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): ApiState<T> & {
  execute: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
  refresh: () => Promise<void>;
} {
  const {
    immediate = false,
    retryOnError = true,
    retryDelay = 1000,
    maxRetries = 3,
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const retryCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Load from cache if available
  useEffect(() => {
    if (cacheKey) {
      const cached = getCachedData<T>(cacheKey, cacheDuration);
      if (cached) {
        setState(prev => ({
          ...prev,
          data: cached.data,
          lastUpdated: cached.lastUpdated,
        }));
      }
    }
  }, [cacheKey, cacheDuration]);

  const execute = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiCall();
      const now = new Date();
      
      setState({
        data: result,
        loading: false,
        error: null,
        lastUpdated: now,
      });

      // Cache the result if cache key is provided
      if (cacheKey) {
        setCachedData(cacheKey, { data: result, lastUpdated: now });
      }

      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      // Retry logic for retryable errors
      if (
        retryOnError &&
        isRetryableError(error) &&
        retryCountRef.current < maxRetries
      ) {
        retryCountRef.current += 1;
        
        console.log(`Retrying API call (${retryCountRef.current}/${maxRetries}) in ${retryDelay}ms`);
        
        timeoutRef.current = setTimeout(() => {
          execute();
        }, retryDelay * retryCountRef.current); // Exponential backoff
      }
    }
  }, [apiCall, retryOnError, retryDelay, maxRetries, cacheKey]);

  const retry = useCallback(async (): Promise<void> => {
    retryCountRef.current = 0;
    await execute();
  }, [execute]);

  const reset = useCallback((): void => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,
    });
    retryCountRef.current = 0;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    // Clear cache before refreshing
    if (cacheKey) {
      clearCachedData(cacheKey);
    }
    await execute();
  }, [execute, cacheKey]);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    retry,
    reset,
    refresh,
  };
}

/**
 * Hook for API calls that require parameters
 */
export function useApiWithParams<T, P>(
  apiCall: (params: P) => Promise<T>,
  options: UseApiOptions = {}
): ApiState<T> & {
  execute: (params: P) => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
} {
  const lastParamsRef = useRef<P>();
  
  const baseHook = useApi<T>(
    () => {
      if (!lastParamsRef.current) {
        throw new Error('No parameters provided for API call');
      }
      return apiCall(lastParamsRef.current);
    },
    { ...options, immediate: false }
  );

  const execute = useCallback(async (params: P): Promise<void> => {
    lastParamsRef.current = params;
    await baseHook.execute();
  }, [baseHook.execute]);

  const retry = useCallback(async (): Promise<void> => {
    if (!lastParamsRef.current) {
      throw new Error('No parameters available for retry');
    }
    await baseHook.retry();
  }, [baseHook.retry]);

  return {
    ...baseHook,
    execute,
    retry,
  };
}

/**
 * Hook for managing multiple API calls
 */
export function useMultipleApi<T extends Record<string, any>>(
  apiCalls: { [K in keyof T]: () => Promise<T[K]> },
  options: UseApiOptions = {}
): {
  [K in keyof T]: ApiState<T[K]>
} & {
  executeAll: () => Promise<void>;
  loading: boolean;
  hasErrors: boolean;
  errors: { [K in keyof T]?: string };
} {
  const [states, setStates] = useState<{ [K in keyof T]: ApiState<T[K]> }>(
    Object.keys(apiCalls).reduce((acc, key) => {
      acc[key as keyof T] = {
        data: null,
        loading: false,
        error: null,
        lastUpdated: null,
      };
      return acc;
    }, {} as { [K in keyof T]: ApiState<T[K]> })
  );

  const executeAll = useCallback(async (): Promise<void> => {
    // Set all to loading
    setStates(prev => 
      Object.keys(prev).reduce((acc, key) => {
        acc[key as keyof T] = { ...prev[key as keyof T], loading: true, error: null };
        return acc;
      }, {} as { [K in keyof T]: ApiState<T[K]> })
    );

    // Execute all API calls in parallel
    const results = await Promise.allSettled(
      Object.entries(apiCalls).map(async ([key, apiCall]) => {
        try {
          const result = await (apiCall as () => Promise<any>)();
          return { key, result, error: null };
        } catch (error) {
          return { key, result: null, error: getErrorMessage(error) };
        }
      })
    );

    // Update states with results
    const now = new Date();
    setStates(prev => {
      const newStates = { ...prev };
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { key, result: data, error } = result.value;
          newStates[key as keyof T] = {
            data,
            loading: false,
            error,
            lastUpdated: error ? null : now,
          };
        }
      });
      
      return newStates;
    });
  }, [apiCalls]);

  const loading = Object.values(states).some(state => state.loading);
  const hasErrors = Object.values(states).some(state => state.error !== null);
  const errors = Object.keys(states).reduce((acc, key) => {
    const error = states[key as keyof T].error;
    if (error) {
      acc[key as keyof T] = error;
    }
    return acc;
  }, {} as { [K in keyof T]?: string });

  return {
    ...states,
    executeAll,
    loading,
    hasErrors,
    errors,
  };
}

// Cache utilities
interface CachedData<T> {
  data: T;
  lastUpdated: Date;
}

function getCachedData<T>(key: string, maxAge: number): CachedData<T> | null {
  try {
    const cached = localStorage.getItem(`api_cache_${key}`);
    if (!cached) return null;

    const parsed: CachedData<T> = JSON.parse(cached);
    const age = Date.now() - new Date(parsed.lastUpdated).getTime();

    if (age > maxAge) {
      localStorage.removeItem(`api_cache_${key}`);
      return null;
    }

    return {
      ...parsed,
      lastUpdated: new Date(parsed.lastUpdated),
    };
  } catch {
    return null;
  }
}

function setCachedData<T>(key: string, data: CachedData<T>): void {
  try {
    localStorage.setItem(`api_cache_${key}`, JSON.stringify(data));
  } catch {
    // Ignore cache errors
  }
}

function clearCachedData(key: string): void {
  try {
    localStorage.removeItem(`api_cache_${key}`);
  } catch {
    // Ignore cache errors
  }
}

export default useApi;