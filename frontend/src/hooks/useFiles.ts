/**
 * Custom React hooks for file-specific API operations.
 * 
 * These hooks provide a convenient interface for managing
 * file uploads, downloads, and file-related operations.
 */

import { useState, useCallback, useRef } from 'react';
import { useApi, useApiWithParams } from './useApi';
import { 
  fileService, 
  FileUploadResponse, 
  FileListResponse,
  FileValidationRules,
  UploadProgressCallback 
} from '../services/fileService';
import { FileType, UploadedFile } from '../types';

/**
 * Upload state interface
 */
export interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  completed: boolean;
  file: UploadedFile | null;
}

/**
 * Hook for file upload with progress tracking
 */
export function useFileUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    completed: false,
    file: null,
  });

  const abortControllerRef = useRef<AbortController>();

  const upload = useCallback(async (
    file: File,
    fileType: FileType,
    applicationId?: string
  ): Promise<UploadedFile | null> => {
    // Reset state
    setUploadState({
      uploading: true,
      progress: 0,
      error: null,
      completed: false,
      file: null,
    });

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Progress callback
      const onProgress: UploadProgressCallback = (progress) => {
        setUploadState(prev => ({ ...prev, progress }));
      };

      // Upload file
      const response = await fileService.uploadFile(file, fileType, applicationId, onProgress);
      
      // Convert response to UploadedFile format
      const uploadedFile: UploadedFile = {
        id: response.file_id,
        originalName: response.original_filename,
        size: response.file_size,
        mimeType: response.mime_type,
        uploadedAt: new Date(response.created_at),
      };

      setUploadState({
        uploading: false,
        progress: 100,
        error: null,
        completed: true,
        file: uploadedFile,
      });

      return uploadedFile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadState({
        uploading: false,
        progress: 0,
        error: errorMessage,
        completed: false,
        file: null,
      });

      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setUploadState({
      uploading: false,
      progress: 0,
      error: 'Upload cancelled',
      completed: false,
      file: null,
    });
  }, []);

  const reset = useCallback(() => {
    setUploadState({
      uploading: false,
      progress: 0,
      error: null,
      completed: false,
      file: null,
    });
  }, []);

  return {
    ...uploadState,
    upload,
    cancel,
    reset,
  };
}

/**
 * Hook for getting file information
 */
export function useGetFile(fileId?: string) {
  return useApi<UploadedFile>(
    () => {
      if (!fileId) {
        throw new Error('File ID is required');
      }
      return fileService.getFileInfo(fileId);
    },
    {
      immediate: !!fileId,
      cacheKey: fileId ? `file_${fileId}` : undefined,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Hook for listing files
 */
export function useListFiles(params?: {
  application_id?: string;
  file_type?: FileType;
  limit?: number;
  offset?: number;
}) {
  return useApi<FileListResponse>(
    () => fileService.listFiles(params),
    {
      immediate: true,
      cacheKey: params ? `files_${JSON.stringify(params)}` : 'files',
      cacheDuration: 1 * 60 * 1000, // 1 minute
    }
  );
}

/**
 * Hook for deleting files
 */
export function useDeleteFile() {
  return useApiWithParams<{ file_id: string; message: string }, string>(
    (fileId) => fileService.deleteFile(fileId),
    {
      retryOnError: true,
      maxRetries: 2,
    }
  );
}

/**
 * Hook for getting file validation rules
 */
export function useFileValidationRules() {
  return useApi<FileValidationRules>(
    () => fileService.getValidationRules(),
    {
      immediate: true,
      cacheKey: 'file_validation_rules',
      cacheDuration: 10 * 60 * 1000, // 10 minutes
    }
  );
}

/**
 * Hook for file validation
 */
export function useFileValidation() {
  const validationRules = useFileValidationRules();

  const validateFile = useCallback((file: File) => {
    return fileService.validateFile(file, validationRules.data || undefined);
  }, [validationRules.data]);

  return {
    validateFile,
    rules: validationRules.data,
    loading: validationRules.loading,
    error: validationRules.error,
  };
}

/**
 * Hook for managing multiple file uploads
 */
export function useMultipleFileUpload() {
  const [uploads, setUploads] = useState<Map<string, UploadState>>(new Map());

  const addUpload = useCallback((key: string, file: File, fileType: FileType, applicationId?: string) => {
    const uploadState: UploadState = {
      uploading: true,
      progress: 0,
      error: null,
      completed: false,
      file: null,
    };

    setUploads(prev => new Map(prev).set(key, uploadState));

    // Start upload
    const onProgress: UploadProgressCallback = (progress) => {
      setUploads(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(key);
        if (current) {
          newMap.set(key, { ...current, progress });
        }
        return newMap;
      });
    };

    fileService.uploadFile(file, fileType, applicationId, onProgress)
      .then((response) => {
        const uploadedFile: UploadedFile = {
          id: response.file_id,
          originalName: response.original_filename,
          size: response.file_size,
          mimeType: response.mime_type,
          uploadedAt: new Date(response.created_at),
        };

        setUploads(prev => {
          const newMap = new Map(prev);
          newMap.set(key, {
            uploading: false,
            progress: 100,
            error: null,
            completed: true,
            file: uploadedFile,
          });
          return newMap;
        });
      })
      .catch((error) => {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        setUploads(prev => {
          const newMap = new Map(prev);
          newMap.set(key, {
            uploading: false,
            progress: 0,
            error: errorMessage,
            completed: false,
            file: null,
          });
          return newMap;
        });
      });
  }, []);

  const removeUpload = useCallback((key: string) => {
    setUploads(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const clearAll = useCallback(() => {
    setUploads(new Map());
  }, []);

  const getUpload = useCallback((key: string) => {
    return uploads.get(key);
  }, [uploads]);

  const getAllUploads = useCallback(() => {
    return Array.from(uploads.entries()).map(([key, state]) => ({ key, ...state }));
  }, [uploads]);

  const isAnyUploading = useCallback(() => {
    return Array.from(uploads.values()).some(state => state.uploading);
  }, [uploads]);

  const getCompletedFiles = useCallback(() => {
    return Array.from(uploads.values())
      .filter(state => state.completed && state.file)
      .map(state => state.file!);
  }, [uploads]);

  return {
    uploads: Array.from(uploads.entries()),
    addUpload,
    removeUpload,
    clearAll,
    getUpload,
    getAllUploads,
    isAnyUploading: isAnyUploading(),
    completedFiles: getCompletedFiles(),
  };
}

/**
 * Hook for file preview management
 */
export function useFilePreview() {
  const [previews, setPreviews] = useState<Map<string, string>>(new Map());

  const createPreview = useCallback((file: File, key: string) => {
    const url = fileService.createPreviewUrl(file);
    if (url) {
      setPreviews(prev => new Map(prev).set(key, url));
    }
    return url;
  }, []);

  const removePreview = useCallback((key: string) => {
    const url = previews.get(key);
    if (url) {
      fileService.revokePreviewUrl(url);
      setPreviews(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
    }
  }, [previews]);

  const clearAllPreviews = useCallback(() => {
    previews.forEach(url => fileService.revokePreviewUrl(url));
    setPreviews(new Map());
  }, [previews]);

  const getPreview = useCallback((key: string) => {
    return previews.get(key);
  }, [previews]);

  return {
    createPreview,
    removePreview,
    clearAllPreviews,
    getPreview,
    previews: Array.from(previews.entries()),
  };
}

export default {
  useFileUpload,
  useGetFile,
  useListFiles,
  useDeleteFile,
  useFileValidationRules,
  useFileValidation,
  useMultipleFileUpload,
  useFilePreview,
};