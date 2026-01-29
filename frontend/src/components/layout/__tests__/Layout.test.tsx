import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Layout from '../Layout';

// Mock the Header and Footer components to avoid complex dependencies
jest.mock('../Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">FormVault Header</div>;
  };
});

jest.mock('../Footer', () => {
  return function MockFooter() {
    return <div data-testid="mock-footer">FormVault Footer</div>;
  };
});

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Layout', () => {
  it('renders children content', () => {
    renderWithProviders(
      <Layout>
        <div data-testid="test-content">Test Content</div>
      </Layout>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('renders header and footer', () => {
    renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    // Check for mocked header and footer
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    const { container } = renderWithProviders(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    // Check that the layout has the expected structure
    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
  });
});