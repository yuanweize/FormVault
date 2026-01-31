import { createTheme, PaletteMode } from '@mui/material';

export const getAppTheme = (mode: PaletteMode) => createTheme({
    palette: {
        mode,
        ...(mode === 'light'
            ? {
                // Light Mode
                primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
                secondary: { main: '#9c27b0' },
                background: { default: '#f5f7fa', paper: '#ffffff' },
                text: { primary: '#1a202c', secondary: '#4a5568' },
            }
            : {
                // Dark Mode
                primary: { main: '#90caf9', light: '#e3f2fd', dark: '#42a5f5' },
                secondary: { main: '#ce93d8' },
                background: { default: '#121212', paper: '#1e1e1e' },
                text: { primary: '#e0e0e0', secondary: '#b0bec5' },
            }),
    },
    shape: {
        borderRadius: 8,
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700 }, // Responsive font sizes can be added here
        h4: { fontWeight: 600 },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                },
                containedPrimary: {
                    // Gradient only in Light Mode for "premium" feel; Flat in Dark Mode for readability
                    background: mode === 'light'
                        ? 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)'
                        : undefined,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '12px', // Softer feel
                    boxShadow: mode === 'light'
                        ? '0 4px 20px 0 rgba(0,0,0,0.05)'
                        : '0 4px 20px 0 rgba(0,0,0,0.5)', // Deeper shadow in dark mode
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none', // Remove default MUI overlay in dark mode for cleaner look
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
                fullWidth: true,
            },
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                    }
                }
            }
        },
    },
});
