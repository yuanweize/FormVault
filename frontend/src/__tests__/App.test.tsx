import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from '../App';

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
    expect(screen.getByText('Welcome to FormVault')).toBeInTheDocument();
  });

  it('renders personal info page', () => {
    renderWithRouter(['/personal-info']);
    expect(screen.getAllByText('Personal Information')).toHaveLength(2); // One in stepper, one in page title
  });

  it('renders file upload page', () => {
    renderWithRouter(['/file-upload']);
    expect(screen.getByText('Document Upload')).toBeInTheDocument();
  });

  it('renders review page', () => {
    renderWithRouter(['/review']);
    expect(screen.getByText('Review & Submit')).toBeInTheDocument();
  });

  it('renders success page', async () => {
    // Mock localStorage to provide state for the success page
    const mockState = {
      referenceNumber: 'REF-12345',
      personalInfo: { firstName: 'John', lastName: 'Doe' },
      uploadedFiles: {},
      currentStep: 'success',
      completedSteps: ['personal-info', 'file-upload', 'review', 'confirmation', 'success'],
      submissionStatus: 'submitted'
    };
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'formvault_workflow_state') return JSON.stringify(mockState);
      return null;
    });

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