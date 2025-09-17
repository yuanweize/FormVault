/**
 * Tests for useApi hooks and API state management.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useApi, useApiWithParams, useMultipleApi } from '../useApi';
import { ApiException } from '../../services/api';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('useApi Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Basic Functionality', () => {
    it('should initialize with default state', () => {
      const mockApiCall = jest.fn().mockResolvedValue('test data');
      
      const { result } = renderHook(() => useApi(mockApiCall));

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeNull();
    });

    it('should execute API call successfully', async () => {
      const testData = { id: 1, name: 'Test' };
      const mockApiCall = jest.fn().mockResolvedValue(testData);
      
      const { result } = renderHook(() => useApi(mockApiCall));

      act(() => {
        result.current.execute();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(testData);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });

    it('should handle API call errors', async () => {
      const error = new ApiException({
        message: 'Test error',
        code: 'TEST_ERROR',
        timestamp: new Date().toISOString(),
      }, 400);
      
      const mockApiCall = jest.fn().mockRejectedValue(error);
      
      const { result } = renderHook(() => useApi(mockApiCall, { retryOnError: false }));

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Test error');
      expect(result.current.lastUpdated).toBeNull();
    });

    it('should execute immediately when immediate option is true', async () => {
      const testData = 'immediate data';
      const mockApiCall = jest.fn().mockResolvedValue(testData);
      
      renderHook(() => useApi(mockApiCall, { immediate: true }));

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledTimes(1);
      });
    });

    it('should not execute immediately when immediate option is false', () => {
      const mockApiCall = jest.fn().mockResolvedValue('data');
      
      renderHook(() => useApi(mockApiCall, { immediate: false }));

      expect(mockApiCall).not.toHaveBeenCalled();
    });
  });

  describe('Retry Logic', () => {
    it('should retry on retryable errors', async () => {
      const error = new ApiException({
        message: 'Server error',
        code: 'SERVER_ERROR',
        timestamp: new Date().toISOString(),
      }, 500);
      
      const mockApiCall = jest.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
      
      const { result } = renderHook(() => useApi(mockApiCall, { 
        retryOnError: true, 
        retryDelay: 10, // Short delay for testing
        maxRetries: 3 
      }));

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.data).toBe('success');
      }, { timeout: 5000 });

      expect(mockApiCall).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const error = new ApiException({
        message: 'Bad request',
        code: 'BAD_REQUEST',
        timestamp: new Date().toISOString(),
      }, 400);
      
      const mockApiCall = jest.fn().mockRejectedValue(error);
      
      const { result } = renderHook(() => useApi(mockApiCall, { 
        retryOnError: true,
        maxRetries: 3 
      }));

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Bad request');
      });

      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });

    it('should stop retrying after max attempts', async () => {
      const error = new ApiException({
        message: 'Server error',
        code: 'SERVER_ERROR',
        timestamp: new Date().toISOString(),
      }, 500);
      
      const mockApiCall = jest.fn().mockRejectedValue(error);
      
      const { result } = renderHook(() => useApi(mockApiCall, { 
        retryOnError: true,
        retryDelay: 10,
        maxRetries: 2 
      }));

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Server error');
      }, { timeout: 5000 });

      expect(mockApiCall).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Caching', () => {
    it('should cache successful responses', async () => {
      const testData = { id: 1, name: 'Cached Data' };
      const mockApiCall = jest.fn().mockResolvedValue(testData);
      const cacheKey = 'test-cache-key';
      
      const { result } = renderHook(() => useApi(mockApiCall, { cacheKey }));

      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(testData);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `api_cache_${cacheKey}`,
        expect.stringContaining('"data":{"id":1,"name":"Cached Data"}')
      );
    });

    it('should load from cache on mount', () => {
      const cachedData = {
        data: { id: 1, name: 'Cached' },
        lastUpdated: new Date().toISOString(),
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));
      
      const mockApiCall = jest.fn();
      const { result } = renderHook(() => useApi(mockApiCall, { cacheKey: 'test-key' }));

      expect(result.current.data).toEqual(cachedData.data);
      expect(result.current.lastUpdated).toEqual(new Date(cachedData.lastUpdated));
    });

    it('should ignore expired cache', () => {
      const expiredData = {
        data: { id: 1, name: 'Expired' },
        lastUpdated: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredData));
      
      const mockApiCall = jest.fn();
      const { result } = renderHook(() => useApi(mockApiCall, { 
        cacheKey: 'test-key',
        cacheDuration: 5 * 60 * 1000 // 5 minutes
      }));

      expect(result.current.data).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('api_cache_test-key');
    });
  });

  describe('Control Methods', () => {
    it('should retry manually', async () => {
      const mockApiCall = jest.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValue('success');
      
      const { result } = renderHook(() => useApi(mockApiCall, { retryOnError: false }));

      // First execution fails
      act(() => {
        result.current.execute();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      // Manual retry succeeds
      act(() => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.data).toBe('success');
      });

      expect(mockApiCall).toHaveBeenCalledTimes(2);
    });

    it('should reset state', () => {
      const mockApiCall = jest.fn().mockResolvedValue('data');
      
      const { result } = renderHook(() => useApi(mockApiCall));

      // Set some state
      act(() => {
        result.current.execute();
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeNull();
    });

    it('should refresh data and clear cache', async () => {
      const mockApiCall = jest.fn().mockResolvedValue('fresh data');
      const cacheKey = 'test-refresh';
      
      const { result } = renderHook(() => useApi(mockApiCall, { cacheKey }));

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.data).toBe('fresh data');
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(`api_cache_${cacheKey}`);
    });
  });
});

describe('useApiWithParams Hook', () => {
  it('should execute with parameters', async () => {
    const mockApiCall = jest.fn().mockResolvedValue('result');
    const params = { id: '123', name: 'test' };
    
    const { result } = renderHook(() => useApiWithParams(mockApiCall));

    act(() => {
      result.current.execute(params);
    });

    await waitFor(() => {
      expect(result.current.data).toBe('result');
    });

    expect(mockApiCall).toHaveBeenCalledWith(params);
  });

  it('should retry with last parameters', async () => {
    const mockApiCall = jest.fn()
      .mockRejectedValueOnce(new Error('Error'))
      .mockResolvedValue('success');
    
    const params = { id: '123' };
    
    const { result } = renderHook(() => useApiWithParams(mockApiCall));

    // First execution with params
    act(() => {
      result.current.execute(params);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Error');
    });

    // Retry without params
    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.data).toBe('success');
    });

    expect(mockApiCall).toHaveBeenCalledTimes(2);
    expect(mockApiCall).toHaveBeenNthCalledWith(1, params);
    expect(mockApiCall).toHaveBeenNthCalledWith(2, params);
  });

  it('should throw error when retrying without parameters', async () => {
    const mockApiCall = jest.fn();
    
    const { result } = renderHook(() => useApiWithParams(mockApiCall));

    await expect(async () => {
      await act(async () => {
        await result.current.retry();
      });
    }).rejects.toThrow('No parameters available for retry');
  });
});

describe('useMultipleApi Hook', () => {
  it('should execute multiple API calls', async () => {
    const apiCall1 = jest.fn().mockResolvedValue('result1');
    const apiCall2 = jest.fn().mockResolvedValue('result2');
    
    const apiCalls = {
      call1: apiCall1,
      call2: apiCall2,
    };
    
    const { result } = renderHook(() => useMultipleApi(apiCalls));

    await act(async () => {
      await result.current.executeAll();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.call1.data).toBe('result1');
    expect(result.current.call2.data).toBe('result2');
    expect(result.current.hasErrors).toBe(false);
  });

  it('should handle mixed success and error results', async () => {
    const apiCall1 = jest.fn().mockResolvedValue('success');
    const apiCall2 = jest.fn().mockRejectedValue(new Error('API Error'));
    
    const apiCalls = {
      success: apiCall1,
      error: apiCall2,
    };
    
    const { result } = renderHook(() => useMultipleApi(apiCalls));

    act(() => {
      result.current.executeAll();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.success.data).toBe('success');
    expect(result.current.success.error).toBeNull();
    expect(result.current.error.data).toBeNull();
    expect(result.current.error.error).toBe('API Error');
    expect(result.current.hasErrors).toBe(true);
    expect(result.current.errors.error).toBe('API Error');
  });

  it('should track loading state correctly', async () => {
    const slowApiCall = jest.fn(() => new Promise(resolve => setTimeout(() => resolve('slow'), 100)));
    const fastApiCall = jest.fn().mockResolvedValue('fast');
    
    const apiCalls = {
      slow: slowApiCall,
      fast: fastApiCall,
    };
    
    const { result } = renderHook(() => useMultipleApi(apiCalls));

    act(() => {
      result.current.executeAll();
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.slow.data).toBe('slow');
    expect(result.current.fast.data).toBe('fast');
  });
});