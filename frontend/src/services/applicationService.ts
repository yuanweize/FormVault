/**
 * Application service for managing insurance applications.
 * 
 * This service handles all API calls related to creating, updating,
 * retrieving, and submitting insurance applications.
 */

import { apiClient } from './api';
import { PersonalInfo, Application, ApplicationStatus, FileType } from '../types';

// Request/Response interfaces for applications
export interface CreateApplicationRequest {
  personal_info: PersonalInfo;
  insurance_type: string;
  preferred_language?: string;
  student_id_file_id?: string;
  passport_file_id?: string;
}

export interface CreateApplicationResponse {
  id: string;
  reference_number: string;
  personal_info: PersonalInfo;
  insurance_type: string;
  preferred_language: string;
  status: ApplicationStatus;
  files: FileInfo[];
  created_at: string;
  updated_at: string;
  message: string;
}

export interface UpdateApplicationRequest {
  personal_info?: Partial<PersonalInfo>;
  insurance_type?: string;
  preferred_language?: string;
  student_id_file_id?: string;
  passport_file_id?: string;
}

export interface SubmitApplicationRequest {
  confirm_submission: boolean;
}

export interface SubmitApplicationResponse {
  application_id: string;
  reference_number: string;
  status: ApplicationStatus;
  submitted_at: string;
  message: string;
}

export interface FileInfo {
  id: string;
  file_type: FileType;
  original_filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface ApplicationListResponse {
  applications: Application[];
  message: string;
}

export interface ExportApplicationRequest {
  recipient_email: string;
  insurance_company?: string;
  additional_notes?: string;
}

export interface ExportApplicationResponse {
  export_id: string;
  application_id: string;
  recipient_email: string;
  insurance_company?: string;
  status: string;
  sent_at?: string;
  created_at: string;
  message: string;
}

/**
 * Application service class
 */
export class ApplicationService {
  /**
   * Create a new insurance application
   */
  async createApplication(data: CreateApplicationRequest): Promise<CreateApplicationResponse> {
    const response = await apiClient.post<CreateApplicationResponse>('/applications', data);
    return response.data;
  }

  /**
   * Get a specific application by ID
   */
  async getApplication(applicationId: string): Promise<CreateApplicationResponse> {
    const response = await apiClient.get<CreateApplicationResponse>(`/applications/${applicationId}`);
    return response.data;
  }

  /**
   * Update an existing application
   */
  async updateApplication(
    applicationId: string, 
    data: UpdateApplicationRequest
  ): Promise<CreateApplicationResponse> {
    const response = await apiClient.put<CreateApplicationResponse>(
      `/applications/${applicationId}`, 
      data
    );
    return response.data;
  }

  /**
   * Submit an application for processing
   */
  async submitApplication(
    applicationId: string, 
    data: SubmitApplicationRequest
  ): Promise<SubmitApplicationResponse> {
    const response = await apiClient.post<SubmitApplicationResponse>(
      `/applications/${applicationId}/submit`, 
      data
    );
    return response.data;
  }

  /**
   * Delete an application
   */
  async deleteApplication(applicationId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/applications/${applicationId}`);
    return response.data;
  }

  /**
   * List applications with optional filtering
   */
  async listApplications(params?: {
    page?: number;
    size?: number;
    status?: ApplicationStatus;
    insurance_type?: string;
  }): Promise<ApplicationListResponse> {
    const response = await apiClient.get<ApplicationListResponse>('/applications', { params });
    return response.data;
  }

  /**
   * Export application via email
   */
  async exportApplication(
    applicationId: string, 
    data: ExportApplicationRequest
  ): Promise<ExportApplicationResponse> {
    const response = await apiClient.post<ExportApplicationResponse>(
      `/applications/${applicationId}/export`, 
      data
    );
    return response.data;
  }

  /**
   * Get export history for an application
   */
  async getExportHistory(applicationId: string): Promise<{
    application_id: string;
    exports: Array<{
      export_id: string;
      status: string;
      sent_at?: string;
      error_message?: string;
      retry_count: number;
      created_at: string;
    }>;
    total_exports: number;
    successful_exports: number;
    failed_exports: number;
    pending_exports: number;
    message: string;
  }> {
    const response = await apiClient.get(`/applications/${applicationId}/export-history`);
    return response.data;
  }
}

// Create and export a singleton instance
export const applicationService = new ApplicationService();
export default applicationService;