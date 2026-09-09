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
  gender?: string;
  nationality?: string;
  place_of_birth?: string;
  passport_number?: string;
  passport_expiry_date?: string;
  passport_issued_by?: string;
  insurance_commencement_date?: string;
  insurance_duration_months?: number;
  type_of_stay?: string;
  study_confirmation_file_id?: string;
  insurance_company_id?: number;
  insurance_plan_id?: number;
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
  gender?: string;
  nationality?: string;
  place_of_birth?: string;
  passport_number?: string;
  passport_expiry_date?: string;
  passport_issued_by?: string;
  insurance_commencement_date?: string;
  insurance_duration_months?: number;
  type_of_stay?: string;
  study_confirmation_file_id?: string;
  insurance_company_id?: number;
  insurance_plan_id?: number;
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

  /**
   * Track application status with dual-factor verification
   */
  async trackApplication(referenceNumber: string, email: string): Promise<TrackApplicationResponse> {
    const response = await apiClient.post<TrackApplicationResponse>('/applications/track', {
      reference_number: referenceNumber,
      email,
    });
    return response.data;
  }

  /**
   * Get broker portal showcase data (partners, plans, banners)
   */
  async getPortalShowcase(): Promise<PortalShowcaseResponse> {
    const response = await apiClient.get<PortalShowcaseResponse>('/portal/showcase');
    return response.data;
  }

  /**
   * Get public portal configuration (branding, ingress, features)
   */
  async getPortalConfig(): Promise<PortalPublicConfig> {
    const response = await apiClient.get<PortalPublicConfig>('/portal/config');
    return response.data;
  }
}

export interface PortalPublicConfig {
  success: boolean;
  site_title: string;
  site_description?: string;
  site_icon_url?: string;
  support_email: string;
  broker_legal_disclosure?: string;
  production_ingress_name?: string;
  primary_domain?: string;
  secondary_domain?: string;
  crisp_website_id?: string;
  crisp_custom_color?: string;
  form_profile_config?: string;
  features_config?: string;
  business_scope_mode?: 'LEAD_ONLY' | 'ASSISTED_APPLICATION' | 'REGULATED_DISTRIBUTION';
  operator_legal_name?: string;
  operator_ico?: string;
  operator_role?: string;
  operator_website_url?: string;
  partner_name?: string;
  partner_ico?: string;
  partner_role?: string;
  partner_cnb_id?: string;
  partner_website_url?: string;
  relationship_status?: string;
  dpa_status?: string;
  lead_only_fallback_url?: string;
}

export interface ApplicationTimelineStep {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  current: boolean;
  timestamp?: string;
}

export interface TrackApplicationResponse {
  success: boolean;
  reference_number: string;
  status: string;
  status_label: string;
  insurance_type: string;
  masked_name: string;
  masked_email: string;
  created_at: string;
  submitted_at?: string;
  updated_at?: string;
  timeline: ApplicationTimelineStep[];
  message: string;
}

export interface InsuranceCompanyShowcase {
  id: number;
  name: string;
  code: string;
  logo_url?: string;
  rating: string;
  website?: string;
  description?: string;
  display_order: number;
}

export interface InsurancePlanShowcase {
  id: number;
  company_id: number;
  company_name: string;
  company_code: string;
  name: string;
  category: string;
  price_amount: number;
  currency: string;
  billing_period: string;
  coverage_summary: string;
  badge?: string;
  target_audience?: string;
  features?: string;
  is_featured: boolean;
  display_order: number;
}

export interface AgencyBannerShowcase {
  id: number;
  title: string;
  subtitle?: string;
  tag: string;
  link_url?: string;
  button_text: string;
  display_order: number;
}

export interface PortalShowcaseResponse {
  success: boolean;
  banners: AgencyBannerShowcase[];
  companies: InsuranceCompanyShowcase[];
  plans: InsurancePlanShowcase[];
}

// Create and export a singleton instance
export const applicationService = new ApplicationService();
export default applicationService;