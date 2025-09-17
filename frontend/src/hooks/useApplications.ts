/**
 * Custom React hooks for application-specific API operations.
 * 
 * These hooks provide a convenient interface for managing
 * insurance application data and operations.
 */

import { useCallback } from 'react';
import { useApi, useApiWithParams } from './useApi';
import { 
  applicationService, 
  CreateApplicationRequest, 
  CreateApplicationResponse,
  UpdateApplicationRequest,
  SubmitApplicationRequest,
  ExportApplicationRequest 
} from '../services/applicationService';
import { Application, ApplicationStatus } from '../types';

/**
 * Hook for creating a new application
 */
export function useCreateApplication() {
  return useApiWithParams<CreateApplicationResponse, CreateApplicationRequest>(
    (data) => applicationService.createApplication(data),
    {
      retryOnError: true,
      maxRetries: 2,
    }
  );
}

/**
 * Hook for getting a specific application
 */
export function useGetApplication(applicationId?: string) {
  return useApi<CreateApplicationResponse>(
    () => {
      if (!applicationId) {
        throw new Error('Application ID is required');
      }
      return applicationService.getApplication(applicationId);
    },
    {
      immediate: !!applicationId,
      cacheKey: applicationId ? `application_${applicationId}` : undefined,
      cacheDuration: 2 * 60 * 1000, // 2 minutes
    }
  );
}

/**
 * Hook for updating an application
 */
export function useUpdateApplication() {
  return useApiWithParams<CreateApplicationResponse, { id: string; data: UpdateApplicationRequest }>(
    ({ id, data }) => applicationService.updateApplication(id, data),
    {
      retryOnError: true,
      maxRetries: 2,
    }
  );
}

/**
 * Hook for submitting an application
 */
export function useSubmitApplication() {
  return useApiWithParams<any, { id: string; data: SubmitApplicationRequest }>(
    ({ id, data }) => applicationService.submitApplication(id, data),
    {
      retryOnError: false, // Don't retry submissions to avoid duplicates
    }
  );
}

/**
 * Hook for deleting an application
 */
export function useDeleteApplication() {
  return useApiWithParams<{ message: string }, string>(
    (applicationId) => applicationService.deleteApplication(applicationId),
    {
      retryOnError: true,
      maxRetries: 2,
    }
  );
}

/**
 * Hook for listing applications
 */
export function useListApplications(params?: {
  page?: number;
  size?: number;
  status?: ApplicationStatus;
  insurance_type?: string;
}) {
  return useApi(
    () => applicationService.listApplications(params),
    {
      immediate: true,
      cacheKey: params ? `applications_${JSON.stringify(params)}` : 'applications',
      cacheDuration: 1 * 60 * 1000, // 1 minute
    }
  );
}

/**
 * Hook for exporting an application
 */
export function useExportApplication() {
  return useApiWithParams<any, { id: string; data: ExportApplicationRequest }>(
    ({ id, data }) => applicationService.exportApplication(id, data),
    {
      retryOnError: false, // Don't retry exports to avoid duplicate emails
    }
  );
}

/**
 * Hook for getting export history
 */
export function useExportHistory(applicationId?: string) {
  return useApi(
    () => {
      if (!applicationId) {
        throw new Error('Application ID is required');
      }
      return applicationService.getExportHistory(applicationId);
    },
    {
      immediate: !!applicationId,
      cacheKey: applicationId ? `export_history_${applicationId}` : undefined,
      cacheDuration: 30 * 1000, // 30 seconds
    }
  );
}

/**
 * Composite hook for managing a complete application workflow
 */
export function useApplicationWorkflow() {
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();
  const submitApplication = useSubmitApplication();
  const exportApplication = useExportApplication();

  const createAndSubmit = useCallback(async (
    applicationData: CreateApplicationRequest,
    exportData?: ExportApplicationRequest
  ) => {
    try {
      // Create application
      await createApplication.execute(applicationData);
      
      if (!createApplication.data) {
        throw new Error('Failed to create application');
      }

      const applicationId = createApplication.data.id;

      // Submit application
      await submitApplication.execute({
        id: applicationId,
        data: { confirm_submission: true }
      });

      // Export if requested
      if (exportData) {
        await exportApplication.execute({
          id: applicationId,
          data: exportData
        });
      }

      return {
        application: createApplication.data,
        submitted: true,
        exported: !!exportData,
      };
    } catch (error) {
      throw error;
    }
  }, [createApplication, submitApplication, exportApplication]);

  return {
    createApplication,
    updateApplication,
    submitApplication,
    exportApplication,
    createAndSubmit,
    loading: createApplication.loading || updateApplication.loading || 
             submitApplication.loading || exportApplication.loading,
    error: createApplication.error || updateApplication.error || 
           submitApplication.error || exportApplication.error,
  };
}

/**
 * Hook for managing application state in a form context
 */
export function useApplicationForm(initialData?: Partial<CreateApplicationRequest>) {
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();

  const saveAsDraft = useCallback(async (data: CreateApplicationRequest) => {
    if (createApplication.data?.id) {
      // Update existing draft
      await updateApplication.execute({
        id: createApplication.data.id,
        data
      });
      return updateApplication.data;
    } else {
      // Create new draft
      await createApplication.execute(data);
      return createApplication.data;
    }
  }, [createApplication, updateApplication]);

  const reset = useCallback(() => {
    createApplication.reset();
    updateApplication.reset();
  }, [createApplication, updateApplication]);

  return {
    application: createApplication.data || updateApplication.data,
    saveAsDraft,
    reset,
    loading: createApplication.loading || updateApplication.loading,
    error: createApplication.error || updateApplication.error,
    hasUnsavedChanges: false, // This would be managed by form state
  };
}

export default {
  useCreateApplication,
  useGetApplication,
  useUpdateApplication,
  useSubmitApplication,
  useDeleteApplication,
  useListApplications,
  useExportApplication,
  useExportHistory,
  useApplicationWorkflow,
  useApplicationForm,
};