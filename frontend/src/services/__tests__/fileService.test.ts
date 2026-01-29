/**
 * Integration tests for File Service API calls.
 */

import { fileService } from '../fileService';
import { FileType } from '../../types';

describe('File Service', () => {
  it('should have all required methods', () => {
    expect(typeof fileService.uploadFile).toBe('function');
    expect(typeof fileService.getFileInfo).toBe('function');
    expect(typeof fileService.listFiles).toBe('function');
    expect(typeof fileService.deleteFile).toBe('function');
    expect(typeof fileService.getValidationRules).toBe('function');
    expect(typeof fileService.verifyFileIntegrity).toBe('function');
    expect(typeof fileService.getDownloadUrl).toBe('function');
    expect(typeof fileService.downloadFile).toBe('function');
    expect(typeof fileService.validateFile).toBe('function');
    expect(typeof fileService.createPreviewUrl).toBe('function');
    expect(typeof fileService.revokePreviewUrl).toBe('function');
    expect(typeof fileService.getFileTypeIcon).toBe('function');
    expect(typeof fileService.formatFileSize).toBe('function');
  });

  describe('Utility Methods', () => {
    describe('validateFile', () => {
      it('should validate file successfully', () => {
        const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
        
        const result = fileService.validateFile(file);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject oversized files', () => {
        // Create a mock file that appears large
        const file = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }); // 6MB

        const result = fileService.validateFile(file);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('File size must be less than 5MB');
      });

      it('should reject invalid file types', () => {
        const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

        const result = fileService.validateFile(file);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('File type must be one of: JPEG, PNG, PDF');
      });

      it('should reject empty files', () => {
        const file = new File([], 'empty.jpg', { type: 'image/jpeg' });

        const result = fileService.validateFile(file);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('File cannot be empty');
      });
    });

    describe('getFileTypeIcon', () => {
      it('should return correct icons for different file types', () => {
        expect(fileService.getFileTypeIcon('image/jpeg')).toBe('🖼️');
        expect(fileService.getFileTypeIcon('image/png')).toBe('🖼️');
        expect(fileService.getFileTypeIcon('application/pdf')).toBe('📄');
        expect(fileService.getFileTypeIcon('text/plain')).toBe('📎');
      });
    });

    describe('formatFileSize', () => {
      it('should format file sizes correctly', () => {
        expect(fileService.formatFileSize(0)).toBe('0 Bytes');
        expect(fileService.formatFileSize(1024)).toBe('1 KB');
        expect(fileService.formatFileSize(1048576)).toBe('1 MB');
        expect(fileService.formatFileSize(1073741824)).toBe('1 GB');
        expect(fileService.formatFileSize(1536)).toBe('1.5 KB');
      });
    });

    describe('getDownloadUrl', () => {
      it('should generate correct download URL', () => {
        const fileId = 'file123';
        const url = fileService.getDownloadUrl(fileId);

        expect(url).toBe('http://localhost:8000/api/v1/files/file123/download');
      });
    });
  });
});