/**
 * Integration tests for Application Service API calls.
 */

import { applicationService, CreateApplicationRequest } from '../applicationService';
import { PersonalInfo, InsuranceType } from '../../types';

describe('Application Service', () => {
  it('should have all required methods', () => {
    expect(typeof applicationService.createApplication).toBe('function');
    expect(typeof applicationService.getApplication).toBe('function');
    expect(typeof applicationService.updateApplication).toBe('function');
    expect(typeof applicationService.submitApplication).toBe('function');
    expect(typeof applicationService.deleteApplication).toBe('function');
    expect(typeof applicationService.listApplications).toBe('function');
    expect(typeof applicationService.exportApplication).toBe('function');
    expect(typeof applicationService.getExportHistory).toBe('function');
  });

  it('should be properly configured', () => {
    expect(applicationService).toBeDefined();
  });
});