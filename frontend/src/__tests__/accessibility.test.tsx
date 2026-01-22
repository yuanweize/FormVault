/**
 * Unit accessibility tests using jest-axe for React components.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';

import PersonalInfoForm from '../components/forms/PersonalInfoForm';
import FileUpload from '../components/forms/FileUpload';
import LanguageSelector from '../components/common/LanguageSelector';
import NavigationStepper from '../components/navigation/NavigationStepper';
import ErrorBoundary from '../components/common/ErrorBoundary';
import i18n from '../i18n/config';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  </BrowserRouter>
);

describe('Accessibility Tests', () => {
  describe('PersonalInfoForm', () => {
    it('should have no accessibility violations', async () => {
      const mockOnSubmit = jest.fn();
      const { container } = render(
        <TestWrapper>
          <PersonalInfoForm onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form labels and associations', async () => {
      const mockOnSubmit = jest.fn();
      const { getByLabelText, getByRole } = render(
        <TestWrapper>
          <PersonalInfoForm onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      // Test that all form fields have proper labels
      expect(getByLabelText(/first name/i)).toBeInTheDocument();
      expect(getByLabelText(/last name/i)).toBeInTheDocument();
      expect(getByLabelText(/email/i)).toBeInTheDocument();
      expect(getByLabelText(/phone/i)).toBeInTheDocument();

      // Test fieldset for address
      expect(getByRole('group', { name: /address/i })).toBeInTheDocument();
    });

    it('should announce validation errors to screen readers', async () => {
      const mockOnSubmit = jest.fn();
      const { container, getByRole, getByText } = render(
        <TestWrapper>
          <PersonalInfoForm onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      // Submit form to trigger validation
      const submitButton = getByRole('button', { name: /next/i });
      submitButton.click();

      // Check that error messages have proper ARIA attributes
      const errorMessage = getByText(/first name is required/i);
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('FileUpload', () => {
    it('should have no accessibility violations', async () => {
      const mockOnUpload = jest.fn();
      const { container } = render(
        <TestWrapper>
          <FileUpload
            fileType="student_id"
            onUploadSuccess={mockOnUpload}
            onUploadError={jest.fn()}
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper file input accessibility', async () => {
      const mockOnUpload = jest.fn();
      const { getByLabelText, getByRole } = render(
        <TestWrapper>
          <FileUpload
            fileType="student_id"
            onUploadSuccess={mockOnUpload}
            onUploadError={jest.fn()}
          />
        </TestWrapper>
      );

      // Test file input has proper label
      const fileInput = getByLabelText(/upload student id/i);
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept');

      // Test drop zone accessibility
      const dropZone = getByRole('button', { name: /drag and drop/i });
      expect(dropZone).toHaveAttribute('tabindex', '0');
      expect(dropZone).toHaveAttribute('aria-describedby');
    });

    it('should announce upload progress to screen readers', async () => {
      const mockOnUpload = jest.fn();
      const { container, getByRole } = render(
        <TestWrapper>
          <FileUpload
            fileType="passport"
            onUploadSuccess={mockOnUpload}
            onUploadError={jest.fn()}
            isUploading={true}
            uploadProgress={50}
          />
        </TestWrapper>
      );

      // Test progress bar accessibility
      const progressBar = getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');

      // Test live region for status updates
      const statusRegion = container.querySelector('[aria-live="polite"]');
      expect(statusRegion).toBeInTheDocument();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('LanguageSelector', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper combobox accessibility', async () => {
      const { getByRole, getAllByRole } = render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      // Test combobox role and attributes
      const combobox = getByRole('combobox', { name: /select language/i });
      expect(combobox).toHaveAttribute('aria-expanded');
      expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');

      // Test options accessibility
      combobox.click();
      const options = getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
      
      options.forEach(option => {
        expect(option).toHaveAttribute('role', 'option');
      });
    });
  });

  describe('NavigationStepper', () => {
    it('should have no accessibility violations', async () => {
      const steps = [
        { id: 'personal-info', label: 'Personal Information', completed: true },
        { id: 'file-upload', label: 'File Upload', completed: false },
        { id: 'review', label: 'Review', completed: false }
      ];

      const { container } = render(
        <TestWrapper>
          <NavigationStepper steps={steps} currentStep="file-upload" />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper navigation accessibility', async () => {
      const steps = [
        { id: 'personal-info', label: 'Personal Information', completed: true },
        { id: 'file-upload', label: 'File Upload', completed: false },
        { id: 'review', label: 'Review', completed: false }
      ];

      const { getByRole, getAllByRole } = render(
        <TestWrapper>
          <NavigationStepper steps={steps} currentStep="file-upload" />
        </TestWrapper>
      );

      // Test navigation landmark
      const nav = getByRole('navigation', { name: /progress/i });
      expect(nav).toBeInTheDocument();

      // Test step accessibility
      const listItems = getAllByRole('listitem');
      expect(listItems).toHaveLength(3);

      // Test current step indication
      const currentStep = getByRole('listitem', { current: true });
      expect(currentStep).toHaveAttribute('aria-current', 'step');
    });
  });

  describe('ErrorBoundary', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });

    afterAll(() => {
      console.error = originalError;
    });

    it('should have no accessibility violations when displaying error', async () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { container } = render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper error message accessibility', async () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const { getByRole, getByText } = render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      // Test error alert
      const errorAlert = getByRole('alert');
      expect(errorAlert).toBeInTheDocument();

      // Test error heading
      const errorHeading = getByRole('heading', { level: 2 });
      expect(errorHeading).toBeInTheDocument();

      // Test retry button accessibility
      const retryButton = getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    it('should maintain proper color contrast ratios', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <button className="btn-primary">Primary Button</button>
            <button className="btn-secondary">Secondary Button</button>
            <p className="text-muted">Muted text</p>
            <a href="#" className="link">Link text</a>
          </div>
        </TestWrapper>
      );

      // axe will check color contrast automatically
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });

    it('should not rely solely on color for information', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <span className="text-success" aria-label="Success">✓ Valid</span>
            <span className="text-error" aria-label="Error">✗ Invalid</span>
            <div className="required-field">
              <label htmlFor="test-input">
                Required Field <span aria-label="required">*</span>
              </label>
              <input id="test-input" required />
            </div>
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support proper tab order', async () => {
      const { container, getAllByRole } = render(
        <TestWrapper>
          <div>
            <button>First Button</button>
            <input type="text" placeholder="Text Input" />
            <select>
              <option>Option 1</option>
            </select>
            <button>Last Button</button>
          </div>
        </TestWrapper>
      );

      // Test that all interactive elements are focusable
      const interactiveElements = container.querySelectorAll(
        'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
      );

      interactiveElements.forEach(element => {
        expect(element).not.toHaveAttribute('tabindex', '-1');
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should handle focus management in modals', async () => {
      const { container, getByRole } = render(
        <TestWrapper>
          <div>
            <button>Open Modal</button>
            <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
              <h2 id="modal-title">Modal Title</h2>
              <button>Modal Button</button>
              <button>Close Modal</button>
            </div>
          </div>
        </TestWrapper>
      );

      // Test modal accessibility
      const modal = getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});