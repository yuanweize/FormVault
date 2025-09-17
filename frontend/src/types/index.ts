// Common types for the FormVault application

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: Address;
  dateOfBirth: string;
  insuranceType: InsuranceType;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type InsuranceType = 'health' | 'auto' | 'life' | 'travel';

export interface UploadedFile {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export type FileType = 'student_id' | 'passport';

export interface Application {
  id: string;
  referenceNumber: string;
  personalInfo: PersonalInfo;
  files: {
    studentId?: UploadedFile;
    passport?: UploadedFile;
  };
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationStatus = 'draft' | 'submitted' | 'exported' | 'processed';

export interface ApiError {
  message: string;
  code: string;
  timestamp: string;
}