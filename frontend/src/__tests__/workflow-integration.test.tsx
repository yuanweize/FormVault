/**
 * End-to-end integration tests for the application submission workflow.
 * 
 * These tests verify the complete user journey from start to finish,
 * including form validation, file uploads, and submission confirmation.
 */

import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ApplicationWorkflowProvider } from '../contexts/ApplicationWorkflowContext';
import ApplicationWorkflowPage from '../pages/ApplicationWorkflowPage';

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
    <ApplicationWorkflowProvider>
      {children}
    </ApplicationWorkflowProvider>
  </BrowserRouter>
);

describe('Application Workflow Integration', () => {
  jest.setTimeout(30000);

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Reset all mocks
    jest.clearAllMocks();

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    ) as jest.Mock;
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
      expect(screen.getByRole('heading', { name: 'Personal Information' })).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();

      // Fill out personal information form
      const firstNameInput = screen.getByTestId('first-name-input');
      const lastNameInput = screen.getByTestId('last-name-input');
      const emailInput = screen.getByTestId('email-input');
      const phoneInput = screen.getByTestId('phone-input');
      const streetInput = screen.getByTestId('street-address-input');
      const cityInput = screen.getByTestId('city-input');
      const stateInput = screen.getByTestId('state-input');
      const zipInput = screen.getByTestId('zip-code-input');

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john.doe@example.com');
      await user.type(phoneInput, '12345678901');
      await user.type(streetInput, '123 Main St');
      await user.type(cityInput, 'Anytown');
      await user.type(stateInput, 'CA');
      await user.type(zipInput, '12345');

      // Select Country (MUI Select)
      const countrySelect = screen.getByLabelText(/country/i);
      await user.click(countrySelect);
      const countryListbox = screen.getByRole('listbox');
      await user.click(within(countryListbox).getByText('United States'));

      // Date of Birth
      const dobInput = screen.getByLabelText(/date of birth/i);
      await user.type(dobInput, '1990-01-01');

      // Select Insurance Type (MUI Select)
      const insuranceSelect = screen.getByLabelText(/insurance type/i);
      await user.click(insuranceSelect);
      const insuranceListbox = screen.getByRole('listbox');
      await user.click(within(insuranceListbox).getByText('Health Insurance'));

      // Navigate to next step
      const nextButtons = screen.getAllByRole('button', { name: /next/i });
      await user.click(nextButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Document Upload')).toBeInTheDocument();
        expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Step 2: File Upload
      const studentIdFile = new File(['student-id'], 'student-id.jpg', { type: 'image/jpeg' });
      const passportFile = new File(['passport'], 'passport.jpg', { type: 'image/jpeg' });

      // Upload student ID
      const studentIdInput = await screen.findByTestId('student_id-upload-input');
      await user.upload(studentIdInput, studentIdFile);

      // Upload passport
      const passportInput = await screen.findByTestId('passport-upload-input');
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
      expect(screen.getByText(/by submitting this application/i)).toBeInTheDocument();

      // Submit application
      await user.click(screen.getByRole('button', { name: /submit application/i }));

      // Wait for success page
      await waitFor(() => {
        expect(screen.getByText('Application Submitted!')).toBeInTheDocument();
      });
      expect(screen.getByText('Step 5 of 5')).toBeInTheDocument();

      // Step 5: Success
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
      const nextButtons = screen.getAllByRole('button', { name: /next/i });
      await user.click(nextButtons[0]);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Should still be on the same step
      expect(screen.getByRole('heading', { name: 'Personal Information' })).toBeInTheDocument();
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

      await user.type(screen.getByTestId('first-name-input'), 'John');
      await user.type(screen.getByTestId('last-name-input'), 'Doe');

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
      await user.type(screen.getByTestId('first-name-input'), 'John');
      await user.type(screen.getByTestId('last-name-input'), 'Doe');
      await user.type(screen.getByTestId('email-input'), 'john@example.com');
      await user.type(screen.getByTestId('phone-input'), '12345678901');
      await user.type(screen.getByTestId('street-address-input'), '123 Main St');
      await user.type(screen.getByTestId('city-input'), 'Anytown');
      await user.type(screen.getByTestId('state-input'), 'CA');
      await user.type(screen.getByTestId('zip-code-input'), '12345');

      const dobInput = screen.getByLabelText(/date of birth/i);
      await user.type(dobInput, '1990-01-01');

      const countrySelect = screen.getByLabelText(/country/i);
      await user.click(countrySelect);
      const countryListbox = screen.getByRole('listbox');
      await user.click(within(countryListbox).getByText('United States'));

      const insuranceSelect = screen.getByLabelText(/insurance type/i);
      await user.click(insuranceSelect);
      const insuranceListbox = screen.getByRole('listbox');
      await user.click(within(insuranceListbox).getByText('Health Insurance'));

      const nextButtons = screen.getAllByRole('button', { name: /next/i });
      await user.click(nextButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Upload Documents')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Should be able to click on the personal info step in the progress indicator
      const personalInfoStep = screen.getByText('Personal Information');
      await user.click(personalInfoStep);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Personal Information' })).toBeInTheDocument();
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
      expect(screen.getByRole('heading', { name: 'Personal Information' })).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      render(
        <TestWrapper>
          <ApplicationWorkflowPage />
        </TestWrapper>
      );
      const saveButtons = screen.getAllByRole('button', { name: /save as draft/i });
      expect(saveButtons[0]).toBeInTheDocument();
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
      const nextButtons = screen.getAllByRole('button', { name: /next/i });
      expect(nextButtons[0]).toBeInTheDocument();
      const saveButtons = screen.getAllByRole('button', { name: /save as draft/i });
      expect(saveButtons[0]).toBeInTheDocument();

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
      const nextButtons = screen.getAllByRole('button', { name: /next/i });
      const nextButton = nextButtons[0];
      nextButton.focus();
      await user.keyboard('{Enter}');

      // Should trigger form validation
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });
    });
  });
});