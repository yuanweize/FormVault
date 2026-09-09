import { createTheme, PaletteMode } from '@mui/material';

export const getAppTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // High-End Light Mode
            primary: {
              main: '#4F46E5', // Indigo-600
              light: '#6366F1', // Indigo-500
              dark: '#3730A3', // Indigo-800
              contrastText: '#FFFFFF',
            },
            secondary: {
              main: '#7C3AED', // Violet-600
              light: '#8B5CF6',
              dark: '#5B21B6',
              contrastText: '#FFFFFF',
            },
            background: {
              default: '#F8FAFC', // Slate-50
              paper: '#FFFFFF',
            },
            text: {
              primary: '#0F172A', // Slate-900
              secondary: '#475569', // Slate-600
            },
            divider: 'rgba(15, 23, 42, 0.08)',
            action: {
              hover: 'rgba(79, 70, 229, 0.04)',
              selected: 'rgba(79, 70, 229, 0.08)',
            },
          }
        : {
            // Modern Deep Obsidian Dark Mode
            primary: {
              main: '#818CF8', // Indigo-400
              light: '#A5B4FC', // Indigo-300
              dark: '#4F46E5',
              contrastText: '#0F172A',
            },
            secondary: {
              main: '#C084FC', // Violet-400
              light: '#E9D5FF',
              dark: '#9333EA',
              contrastText: '#0F172A',
            },
            background: {
              default: '#0B0F19', // Midnight Obsidian
              paper: '#111827', // Slate-900
            },
            text: {
              primary: '#F8FAFC',
              secondary: '#94A3B8', // Slate-400
            },
            divider: 'rgba(255, 255, 255, 0.08)',
            action: {
              hover: 'rgba(129, 140, 248, 0.08)',
              selected: 'rgba(129, 140, 248, 0.16)',
            },
          }),
      success: {
        main: '#10B981',
        light: '#34D399',
        dark: '#059669',
      },
      warning: {
        main: '#F59E0B',
        light: '#FBBF24',
        dark: '#D97706',
      },
      error: {
        main: '#EF4444',
        light: '#F87171',
        dark: '#DC2626',
      },
      info: {
        main: '#3B82F6',
        light: '#60A5FA',
        dark: '#2563EB',
      },
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily:
        '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: {
        fontWeight: 800,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontWeight: 700,
        letterSpacing: '-0.015em',
      },
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:active': {
              transform: 'scale(0.98)',
            },
          },
          containedPrimary: {
            background:
              mode === 'light'
                ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
                : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            boxShadow:
              mode === 'light'
                ? '0 4px 14px 0 rgba(79, 70, 229, 0.35)'
                : '0 4px 16px 0 rgba(99, 102, 241, 0.35)',
            '&:hover': {
              background:
                mode === 'light'
                  ? 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)'
                  : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              boxShadow:
                mode === 'light'
                  ? '0 6px 20px 0 rgba(79, 70, 229, 0.45)'
                  : '0 6px 20px 0 rgba(99, 102, 241, 0.5)',
              transform: 'translateY(-1px)',
            },
            '&.Mui-disabled': {
              background: mode === 'light' ? '#E2E8F0' : 'rgba(255, 255, 255, 0.12)',
              color: mode === 'light' ? '#94A3B8' : 'rgba(255, 255, 255, 0.38)',
              boxShadow: 'none',
            },
          },
          outlined: {
            borderColor: mode === 'light' ? 'rgba(79, 70, 229, 0.3)' : 'rgba(129, 140, 248, 0.3)',
            '&:hover': {
              borderColor: mode === 'light' ? '#4F46E5' : '#818CF8',
              backgroundColor: mode === 'light' ? 'rgba(79, 70, 229, 0.04)' : 'rgba(129, 140, 248, 0.08)',
              transform: 'translateY(-1px)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            border: mode === 'light' ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow:
              mode === 'light'
                ? '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)'
                : '0 10px 30px -5px rgba(0, 0, 0, 0.5)',
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: '14px',
            border: mode === 'light' ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid rgba(255, 255, 255, 0.07)',
          },
          elevation1: {
            boxShadow:
              mode === 'light'
                ? '0 2px 8px rgba(15, 23, 42, 0.04)'
                : '0 4px 16px rgba(0, 0, 0, 0.4)',
          },
          elevation2: {
            boxShadow:
              mode === 'light'
                ? '0 4px 16px rgba(15, 23, 42, 0.06)'
                : '0 8px 24px rgba(0, 0, 0, 0.5)',
          },
          elevation3: {
            boxShadow:
              mode === 'light'
                ? '0 10px 30px -5px rgba(15, 23, 42, 0.08)'
                : '0 12px 36px -5px rgba(0, 0, 0, 0.6)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(11, 15, 25, 0.85)',
            backdropFilter: 'blur(16px)',
            color: mode === 'light' ? '#0F172A' : '#F8FAFC',
            borderBottom: mode === 'light' ? '1px solid rgba(15, 23, 42, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'none',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '10px',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? '#4F46E5' : '#818CF8',
              borderWidth: '1.5px',
              boxShadow:
                mode === 'light'
                  ? '0 0 0 4px rgba(79, 70, 229, 0.12)'
                  : '0 0 0 4px rgba(129, 140, 248, 0.2)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            fontWeight: 500,
          },
        },
      },
    },
  });
