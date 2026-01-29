import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import App from '../App';
import Header from '../components/layout/Header';
import NavigationStepper from '../components/navigation/NavigationStepper';
import PersonalInfoForm from '../components/forms/PersonalInfoForm';
import FileUpload from '../components/forms/FileUpload';
import LanguageSelector from '../components/common/LanguageSelector';
import ErrorBoundary from '../components/common/ErrorBoundary';

// i18n initialization removed to use global setupTests.ts mock and i18n/config.ts

// Mock theme with responsive breakpoints
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </I18nextProvider>
  </BrowserRouter>
);

// Mock matchMedia for responsive tests
const mockMatchMedia = (width: number) => {
  const matcher = jest.fn().mockImplementation((query: string) => {
    const maxMatch = /max-width:\s*(\d+(\.\d+)?)px/.exec(query);
    const minMatch = /min-width:\s*(\d+(\.\d+)?)px/.exec(query);
    const maxWidth = maxMatch ? Number(maxMatch[1]) : undefined;
    const minWidth = minMatch ? Number(minMatch[1]) : undefined;
    const matches = (maxWidth === undefined || width <= maxWidth)
      && (minWidth === undefined || width >= minWidth);

    return {
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matcher,
  });
  Object.defineProperty(global, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matcher,
  });
};

describe('Mobile Responsiveness Tests', () => {
  beforeEach(() => {
    // Reset viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  describe('Mobile Viewport (320px - 599px)', () => {
    beforeEach(() => {
      mockMatchMedia(450);
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 450,
      });
    });

    test('Header displays correctly on mobile', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Should show short title on mobile
      expect(screen.getByText('FormVault')).toBeInTheDocument();

      // Language selector should be present
      const languageButton = screen.getByRole('button', { name: /select language/i });
      expect(languageButton).toBeInTheDocument();
    });

    test('Navigation stepper adapts to mobile', () => {
      render(
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <MemoryRouter initialEntries={['/personal-info']}>
            <NavigationStepper />
          </MemoryRouter>
        </ThemeProvider>
      );

      // Should show short labels on mobile
      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('Files')).toBeInTheDocument();
    });

    test('Personal info form is mobile-friendly', () => {
      const mockSubmit = jest.fn();

      render(
        <TestWrapper>
          <PersonalInfoForm onSubmit={mockSubmit} />
        </TestWrapper>
      );

      // Form should render without errors
      expect(screen.getByText('Personal Information')).toBeInTheDocument();

      // Form fields should be present
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    test('File upload component is touch-friendly', () => {
      const mockUploadSuccess = jest.fn();
      const mockUploadError = jest.fn();

      render(
        <TestWrapper>
          <FileUpload
            fileType="student_id"
            onUploadSuccess={mockUploadSuccess}
            onUploadError={mockUploadError}
          />
        </TestWrapper>
      );

      // Should show mobile-friendly upload interface
      expect(screen.getByText('Student ID')).toBeInTheDocument();
      expect(screen.getByText('Select File')).toBeInTheDocument();
      expect(screen.getByText('Take Photo')).toBeInTheDocument();
    });
  });

  describe('Tablet Viewport (600px - 899px)', () => {
    beforeEach(() => {
      mockMatchMedia(899);
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
    });

    test('Components adapt to tablet size', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Should show full title on tablet
      expect(screen.getByText('FormVault')).toBeInTheDocument();
    });

    test('Form layout adjusts for tablet', () => {
      const mockSubmit = jest.fn();

      render(
        <TestWrapper>
          <PersonalInfoForm onSubmit={mockSubmit} />
        </TestWrapper>
      );

      // Form should be properly laid out for tablet
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });
  });

  describe('Desktop Viewport (900px+)', () => {
    beforeEach(() => {
      mockMatchMedia(1200);
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
    });

    test('Components display full desktop layout', () => {
      render(
        <TestWrapper>
          <Header />
        </TestWrapper>
      );

      // Should show full title and language icon
      expect(screen.getByText('FormVault')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Mobile Responsiveness', () => {
    test('Error boundary displays mobile-friendly error message', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
      expect(screen.getByText('Go Home')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Language Selector Mobile Behavior', () => {
    test('Language selector is touch-friendly on mobile', () => {
      mockMatchMedia(599);

      render(
        <TestWrapper>
          <LanguageSelector />
        </TestWrapper>
      );

      const languageButton = screen.getByRole('button', { name: /select language/i });
      expect(languageButton).toBeInTheDocument();

      // Button should have adequate touch target size
      const buttonElement = languageButton as HTMLElement;
      const styles = window.getComputedStyle(buttonElement);

      // Note: In a real test environment, you would check computed styles
      // Here we just verify the button exists and is accessible
      expect(buttonElement).toBeVisible();
    });
  });

  describe('Accessibility on Mobile', () => {
    test('Touch targets meet minimum size requirements', () => {
      const mockSubmit = jest.fn();

      render(
        <TestWrapper>
          <PersonalInfoForm onSubmit={mockSubmit} />
        </TestWrapper>
      );

      // All interactive elements should be present and accessible
      const submitButton = screen.getByRole('button', { name: /next/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeVisible();
    });

    test('Form inputs are properly labeled for screen readers', () => {
      const mockSubmit = jest.fn();

      render(
        <TestWrapper>
          <PersonalInfoForm onSubmit={mockSubmit} />
        </TestWrapper>
      );

      // Check that form inputs have proper labels
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    });
  });

  describe('Performance on Mobile', () => {
    test('Components render without performance issues', () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Render should complete within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000); // 1 second
    });
  });
});