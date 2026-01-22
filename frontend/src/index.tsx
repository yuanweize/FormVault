import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
// Import i18n configuration
import './i18n/config';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      '@media (max-width:600px)': {
        fontSize: '2rem',
      },
    },
    h2: {
      fontSize: '2rem',
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h3: {
      fontSize: '1.75rem',
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h4: {
      fontSize: '1.5rem',
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h5: {
      fontSize: '1.25rem',
      '@media (max-width:600px)': {
        fontSize: '1.125rem',
      },
    },
    h6: {
      fontSize: '1.125rem',
      '@media (max-width:600px)': {
        fontSize: '1rem',
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (max-width:600px)': {
            paddingLeft: '8px',
            paddingRight: '8px',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: '44px', // Touch-friendly minimum height
          '@media (max-width:600px)': {
            minHeight: '48px', // Larger touch target on mobile
            fontSize: '1rem',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            minHeight: '44px',
            '@media (max-width:600px)': {
              minHeight: '48px',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          minHeight: '44px',
          '@media (max-width:600px)': {
            minHeight: '48px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            margin: '8px',
            borderRadius: '8px',
          },
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);