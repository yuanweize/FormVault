/**
 * File service for managing file uploads and downloads.
 * 
 * This service handles all API calls related to uploading, downloading,
 * and managing files (student ID and passport photos).
 */

import { createFileUploadClient, apiClient } from './api';
import { FileType, UploadedFile } from '../types';

// Request/Response interfaces for files
export interface FileUploadResponse {
  file_id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  file_type: FileType;
  created_at: string;
  message: string;
}

export interface FileListResponse {
  files: UploadedFile[];
  message: string;
}

export interface FileValidationRules {
  max_size: number;
  allowed_types: string[];
}

export interface FileDeleteResponse {
  file_id: string;
  message: string;
}

export interface FileIntegrityResponse {
  file_id: string;
  integrity_valid: boolean;
  message: string;
}

/**
 * Upload progress callback type
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * File service class
 */
export class FileService {
  private uploadClient = createFileUploadClient();

  /**
   * Upload a file with progress tracking
   */
  async uploadFile(
    file: File,
    fileType: FileType,
    applicationId?: string,
    onProgress?: UploadProgressCallback
  ): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);
    
    if (applicationId) {
      formData.append('application_id', applicationId);
    }

    const response = await this.uploadClient.post<FileUploadResponse>(
      '/files/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      }
    );

    return response.data;
  }

  /**
   * Get information about a specific file
   */
  async getFileInfo(fileId: string): Promise<UploadedFile> {
    const response = await apiClient.get<UploadedFile>(`/files/${fileId}`);
    return response.data;
  }

  /**
   * List files with optional filtering
   */
  async listFiles(params?: {
    application_id?: string;
    file_type?: FileType;
    limit?: number;
    offset?: number;
  }): Promise<FileListResponse> {
    const response = await apiClient.get<FileListResponse>('/files', { params });
    return response.data;
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<FileDeleteResponse> {
    const response = await apiClient.delete<FileDeleteResponse>(`/files/${fileId}`);
    return response.data;
  }

  /**
   * Get file validation rules
   */
  async getValidationRules(): Promise<FileValidationRules> {
    const response = await apiClient.get<FileValidationRules>('/files/validation/rules');
    return response.data;
  }

  /**
   * Verify file integrity
   */
  async verifyFileIntegrity(fileId: string): Promise<FileIntegrityResponse> {
    const response = await apiClient.post<FileIntegrityResponse>(`/files/${fileId}/verify`);
    return response.data;
  }

  /**
   * Get download URL for a file
   */
  getDownloadUrl(fileId: string): string {
    return `${this.uploadClient.defaults.baseURL}/files/${fileId}/download`;
  }

  /**
   * Download a file (triggers browser download)
   */
  async downloadFile(fileId: string, filename?: string): Promise<void> {
    const url = this.getDownloadUrl(fileId);
    
    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    link.target = '_blank';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, rules?: FileValidationRules): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Default validation rules if not provided
    const defaultRules: FileValidationRules = {
      max_size: 5 * 1024 * 1024, // 5MB
      allowed_types: ['image/jpeg', 'image/png', 'application/pdf'],
    };
    
    const validationRules = rules || defaultRules;
    
    // Check file size
    if (file.size > validationRules.max_size) {
      const maxSizeMB = Math.round(validationRules.max_size / (1024 * 1024));
      errors.push(`File size must be less than ${maxSizeMB}MB`);
    }
    
    // Check file type
    if (!validationRules.allowed_types.includes(file.type)) {
      const allowedExtensions = validationRules.allowed_types
        .map(type => {
          switch (type) {
            case 'image/jpeg': return 'JPEG';
            case 'image/png': return 'PNG';
            case 'application/pdf': return 'PDF';
            default: return type;
          }
        })
        .join(', ');
      errors.push(`File type must be one of: ${allowedExtensions}`);
    }
    
    // Check if file is empty
    if (file.size === 0) {
      errors.push('File cannot be empty');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a preview URL for image files
   */
  createPreviewUrl(file: File): string | null {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  }

  /**
   * Revoke a preview URL to free memory
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Get file type icon based on MIME type
   */
  getFileTypeIcon(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
      case 'image/png':
        return '🖼️';
      case 'application/pdf':
        return '📄';
      default:
        return '📎';
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Create and export a singleton instance
export const fileService = new FileService();
export default fileService;