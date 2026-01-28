import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from '../App';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Return expected text for specific keys to match test expectations
      const translations: Record<string, string> = {
        'pages.success.title': 'Application Submitted!',
        'app.title': 'Secure Insurance Application Portal',
        'app.subtitle': 'Secure Insurance Application Portal',
        'stepper.personalInfo': 'Personal Information',
        'stepper.review': 'Review & Submit',
        'pages.home.title': 'Secure Insurance Application Portal',
      };
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: () => new Promise(() => { }),
    },
  }),
}));

// Mock the workflow context to avoid provider race conditions
jest.mock('../contexts/ApplicationWorkflowContext', () => {
  const actual = jest.requireActual('../contexts/ApplicationWorkflowContext');
  return {
    ...actual,
    useApplicationWorkflowContext: () => ({
      state: {
        referenceNumber: 'REF-12345',
        personalInfo: { firstName: 'John', lastName: 'Doe' },
        uploadedFiles: {},
        currentStep: 'success',
        completedSteps: ['personal-info', 'file-upload', 'review', 'confirmation', 'success'],
        submissionStatus: 'submitted',
        isDirty: false
      },
      resetWorkflow: jest.fn(),
      goToStep: jest.fn(),
    }),
    ApplicationWorkflowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock the workflow context to avoid provider race conditions
jest.mock('../contexts/ApplicationWorkflowContext', () => {
  const actual = jest.requireActual('../contexts/ApplicationWorkflowContext');
  return {
    ...actual,
    useApplicationWorkflowContext: () => ({
      state: {
        referenceNumber: 'REF-12345',
        personalInfo: { firstName: 'John', lastName: 'Doe' },
        uploadedFiles: {},
        currentStep: 'success',
        completedSteps: ['personal-info', 'file-upload', 'review', 'confirmation', 'success'],
        submissionStatus: 'submitted',
        isDirty: false
      },
      resetWorkflow: jest.fn(),
      goToStep: jest.fn(),
    }),
    ApplicationWorkflowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const theme = createTheme();

const renderWithRouter = (initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('App', () => {
  it('renders home page by default', () => {
    renderWithRouter(['/']);
    // Might appear in header and main content
    expect(screen.getAllByText(/Secure Insurance Application Portal/i)[0]).toBeInTheDocument();
  });

  it('renders review page', async () => {
    renderWithRouter(['/review']);
    // Might appear in stepper and page title
    const elements = await screen.findAllByText('Review & Submit');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders success page', async () => {
    // Context is already mocked above
    renderWithRouter(['/success']);
    // Should appear in title
    expect(await screen.findByText('Application Submitted!')).toBeInTheDocument();
  });

  it('renders 404 page for unknown routes', () => {
    renderWithRouter(['/unknown-route']);
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('renders app structure correctly', async () => {
    renderWithRouter(['/']);

    // Check that the app renders without crashing
    const elements = await screen.findAllByText(/Secure Insurance Application Portal/i);
    expect(elements.length).toBeGreaterThan(0);
  });
});