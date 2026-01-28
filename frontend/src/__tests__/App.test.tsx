import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from '../App';

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
    expect(screen.getByText(/Secure Insurance Application Portal/i)).toBeInTheDocument();
  });

  it('renders review page', () => {
    renderWithRouter(['/review']);
    expect(screen.getByText('Review & Submit')).toBeInTheDocument();
  });

  it('renders success page', async () => {
    // Context is already mocked above
    renderWithRouter(['/success']);
    expect(await screen.findByText('Application Submitted!')).toBeInTheDocument();
  });

  it('renders 404 page for unknown routes', () => {
    renderWithRouter(['/unknown-route']);
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('renders app structure correctly', () => {
    renderWithRouter(['/']);

    // Check that the app renders without crashing
    expect(screen.getByText('Welcome to FormVault')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });
});