/**
 * End-to-end integration tests for the application submission workflow.
 * 
 * These tests verify the complete user journey from start to finish,
 * including form validation, file uploads, and submission confirmation.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { ApplicationWorkflowProvider } from '../contexts/ApplicationWorkflowContext';
import ApplicationWorkflowPage from '../pages/ApplicationWorkflowPage';
import i18n from '../i18n/config';

// Mock implementations
jest.mock('../services/applicationService', () => ({
  createApplication: jest.fn().mockResolvedValue({
    id: 'app-123',
    referenceNumber: 'REF-12345'
  }),
  saveAsDraft: jest.fn().mockResolvedValue({})
}));

jest.mock('../services/fileService', () => ({
  uploadFile: jest.fn().mockImplementation((file) =>
    Promise.resolve({
      id: `file-${Date.now()}`,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString()
    })
  )
}));

jest.mock('../hooks/useApplications', () => ({
  useApplicationWorkflow: jest.fn(() => ({
    createApplication: {
      execute: jest.fn().mockResolvedValue({ id: 'app-123', referenceNumber: 'REF-12345' }),
      data: null,
      loading: false,
      error: null
    },
    saveAsDraft: {
      execute: jest.fn().mockResolvedValue({}),
      data: null,
      loading: false,
      error: null
    },
    goToNextStep: jest.fn(),
    goToPreviousStep: jest.fn(),
    updatePersonalInfo: jest.fn(),
    setUploadedFile: jest.fn(),
    removeUploadedFile: jest.fn(),
    completeStep: jest.fn(),
    resetWorkflow: jest.fn()
  }))
}));

jest.mock('../hooks/useFiles', () => ({
  useFileUpload: jest.fn(() => ({
    upload: jest.fn().mockResolvedValue({}),
    uploading: false,
    progress: 0,
    error: null,
    completed: true,
    file: null
  }))
}));

// Test wrapper with context reset
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      <ApplicationWorkflowProvider>
        {children}
        <ApplicationWorkflowProvider resetOnUnmount>
          {children}
        </ApplicationWorkflowProvider>
    </I18nextProvider>
  </BrowserRouter>
);

describe('Application Workflow Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Reset all mocks
    jest.clearAllMocks();

    // Reset i18n
    i18n.changeLanguage('en');
  });

  describe('Complete Workflow Journey', () => {
    it('should complete the entire application workflow', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ApplicationWorkflowPage />
        </TestWrapper>
      );

      // Step 1: Personal Information
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();

      // Fill out personal information form
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      await user.type(screen.getByLabelText(/street address/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'Anytown');
      await user.type(screen.getByLabelText(/state/i), 'CA');
      await user.type(screen.getByLabelText(/zip/i), '12345');
      await user.selectOptions(screen.getByLabelText(/country/i), 'US');
      await user.type(screen.getByLabelText(/date of birth/i), '1990-01-01');
      await user.selectOptions(screen.getByLabelText(/insurance type/i), 'health');

      // Navigate to next step
      await user.click(screen.getByRole('button', { name: /^next$/i }));

      await waitFor(() => {
        expect(screen.getByText('Upload Documents')).toBeInTheDocument();
        expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
      });

      // Step 2: File Upload
      // Mock file upload functionality
      const studentIdFile = new File(['student-id'], 'student-id.jpg', { type: 'image/jpeg' });
      const passportFile = new File(['passport'], 'passport.jpg', { type: 'image/jpeg' });

      // Upload student ID
      const studentIdInput = screen.getByTestId('file-upload-input');
      await user.upload(studentIdInput, studentIdFile);

      // Upload passport
      const passportInput = screen.getByTestId('passport-upload-input');
      await user.upload(passportInput, passportFile);

      await waitFor(() => {
        expect(screen.getByText(/all required files/i)).toBeInTheDocument();
      });

      // Navigate to next step
      await user.click(screen.getByRole('button', { name: /proceed to review/i }));

      // Wait for navigation
      await waitFor(() => {
        expect(screen.getByText('Review Your Application')).toBeInTheDocument();
      });
      expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();

      // Step 3: Review
      // Verify that the entered information is displayed
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();

      // Navigate to confirmation
      await user.click(screen.getByRole('button', { name: /proceed to confirmation/i }));

      await waitFor(() => {
        expect(screen.getByText('Confirm Submission')).toBeInTheDocument();
        expect(screen.getByText('Step 4 of 5')).toBeInTheDocument();
      });

      // Step 4: Confirmation
      // Verify submission notice
      expect(screen.getByText(/by submitting this application/i)).toBeInTheDocument();

      // Submit application
      await user.click(screen.getByRole('button', { name: /submit application/i }));

      // Wait for success page
      await waitFor(() => {
        expect(screen.getByText('Application Submitted!')).toBeInTheDocument();
      });
      expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();

      // Step 5: Success
      // Verify success message and reference number
      expect(screen.getByText(/successfully submitted/i)).toBeInTheDocument();
      expect(screen.getByText(/reference number/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /return to home/i })).toBeInTheDocument();
    });

    it('should handle form validation errors', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ApplicationWorkflowPage />
        </TestWrapper>
      );

      // Try to proceed without filling required fields
      await user.click(screen.getByRole('button', { name: /^next$/i }));

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email.*required/i)).toBeInTheDocument();
      });

      // Should still be on the same step
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    });

    it('should save and restore workflow state from localStorage', async () => {
      const user = userEvent.setup();

      // First render - fill some data
      const { unmount } = render(
        <TestWrapper>
          <ApplicationWorkflowPage />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');

      // Unmount component (simulating page refresh)
      unmount();

      // Re-render component
      render(
        <TestWrapper>
          <ApplicationWorkflowPage />
        </TestWrapper>
      );

      // Should restore the saved data
      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      });
    });

    it('should allow navigation between completed steps', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ApplicationWorkflowPage />
        </TestWrapper>
      );

      // Complete personal info step
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'John');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      await user.type(screen.getByLabelText(/street address/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'Anytown');
      await user.type(screen.getByLabelText(/state/i), 'CA');
      await user.type(screen.getByLabelText(/zip/i), '12345');
      await user.selectOptions(screen.getByLabelText(/country/i), 'US');
      await user.type(screen.getByLabelText(/date of birth/i), '1990-01-01');
      await user.selectOptions(screen.getByLabelText(/insurance type/i), 'health');

      await user.click(screen.getByRole('button', { name: /^next$/i }));

      await waitFor(() => {
        expect(screen.getByText('Upload Documents')).toBeInTheDocument();
      });

      // Should be able to click on the personal info step in the progress indicator
      const personalInfoStep = screen.getByText('Personal Info');
      await user.click(personalInfoStep);

      await waitFor(() => {
        expect(screen.getByText('Personal Information')).toBeInTheDocument();
      });

      // Data should still be there
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    });

    it('should prevent navigation to incomplete steps', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ApplicationWorkflowPage />
        </TestWrapper>
      );

      // Try to click on a future step in the progress indicator
      const reviewStep = screen.getByText('Review');
      await user.click(reviewStep);

      // Should remain on the current step
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      const mockError = new Error('API Error');
      jest.mocked(require('../hooks/useApplications').useApplicationWorkflow).mockReturnValue({
        createApplication: {
          execute: jest.fn().mockRejectedValue(mockError),
          data: null,
          loading: false,
          error: 'API Error',
        },
        // ... other methods
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ApplicationWorkflowPage />
        </TestWrapper>
      );

      // Fill form and try to save
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.click(screen.getByRole('button', { name: /save as draft/i }));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/api error/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors during file upload', async () => {
      // Mock file upload error
      jest.mocked(require('../hooks/useFiles').useFileUpload).mockReturnValue({
        upload: jest.fn().mockRejectedValue(new Error('Network Error')),
        uploading: false,
        progress: 0,
        error: 'Network Error',
        completed: false,
        file: null,
      });

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ApplicationWorkflowPage />
        </TestWrapper>
      );

      // Navigate to file upload step (assuming personal info is completed)
      // ... navigation code ...

      // Try to upload file
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByTestId('file-upload-input');
      await user.upload(input, file);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <ApplicationWorkflowPage />
        </TestWrapper>
      );

      // Check for proper form labels
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

      // Check for proper button roles
      expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save as draft/i })).toBeInTheDocument();

      // Check for progress indicator
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ApplicationWorkflowPage />
        </TestWrapper>
      );

      // Should be able to tab through form fields
      await user.tab();
      expect(screen.getByLabelText(/first name/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/last name/i)).toHaveFocus();

      // Should be able to activate buttons with Enter/Space
      const nextButton = screen.getByRole('button', { name: /^next$/i });
      nextButton.focus();
      await user.keyboard('{Enter}');

      // Should trigger form validation
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });
    });
  });
});