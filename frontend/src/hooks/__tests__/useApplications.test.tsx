/**
 * Tests for application-specific hooks.
 */

import { renderHook } from '@testing-library/react';
import { 
  useCreateApplication, 
  useGetApplication, 
  useApplicationWorkflow,
  useApplicationForm 
} from '../useApplications';

describe('Application Hooks', () => {
  it('should provide useCreateApplication hook', () => {
    const { result } = renderHook(() => useCreateApplication());
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.execute).toBe('function');
  });

  it('should provide useGetApplication hook', () => {
    const { result } = renderHook(() => useGetApplication());
    
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.execute).toBe('function');
  });

  it('should provide useApplicationWorkflow hook', () => {
    const { result } = renderHook(() => useApplicationWorkflow());
    
    expect(typeof result.current.createAndSubmit).toBe('function');
    expect(typeof result.current.createApplication).toBe('object');
    expect(typeof result.current.updateApplication).toBe('object');
    expect(typeof result.current.submitApplication).toBe('object');
    expect(typeof result.current.exportApplication).toBe('object');
  });

  it('should provide useApplicationForm hook', () => {
    const { result } = renderHook(() => useApplicationForm());
    
    expect(result.current.application).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.saveAsDraft).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });
});