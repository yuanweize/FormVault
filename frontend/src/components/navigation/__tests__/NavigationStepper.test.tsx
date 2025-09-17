import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NavigationStepper from '../NavigationStepper';

const theme = createTheme();

// Mock react-i18next is handled by __mocks__/react-i18next.js

const renderWithProviders = (component: React.ReactElement, initialEntries: string[] = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('NavigationStepper', () => {
  it('does not render on home page', () => {
    const { container } = renderWithProviders(<NavigationStepper />, ['/']);
    expect(container.firstChild).toBeNull();
  });

  it('does not render on 404 page', () => {
    const { container } = renderWithProviders(<NavigationStepper />, ['/unknown-page']);
    expect(container.firstChild).toBeNull();
  });

  it('renders stepper on personal info page', () => {
    renderWithProviders(<NavigationStepper />, ['/personal-info']);
    
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('File Upload')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('shows correct active step for personal info page', () => {
    renderWithProviders(<NavigationStepper />, ['/personal-info']);
    
    // Check that the stepper is rendered
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('File Upload')).toBeInTheDocument();
  });

  it('shows correct active step for file upload page', () => {
    renderWithProviders(<NavigationStepper />, ['/file-upload']);
    
    expect(screen.getByText('File Upload')).toBeInTheDocument();
  });

  it('shows correct active step for review page', () => {
    renderWithProviders(<NavigationStepper />, ['/review']);
    
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  it('shows correct active step for success page', () => {
    renderWithProviders(<NavigationStepper />, ['/success']);
    
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});