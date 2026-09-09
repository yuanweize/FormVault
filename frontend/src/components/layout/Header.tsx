import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ShieldOutlined,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LanguageSelector from '../common/LanguageSelector';
import NavigationStepper from '../navigation/NavigationStepper';
import { useThemeMode } from '../../contexts/ThemeModeContext';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode, toggleColorMode } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar
        sx={{
          minHeight: { xs: '60px', sm: '68px' },
          px: { xs: 2, sm: 3 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo & Title */}
        <Box
          onClick={() => navigate('/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <Box
            sx={{
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              color: '#FFFFFF',
            }}
          >
            <ShieldOutlined sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </Box>
          <Box>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              component="div"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background:
                  theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, #1E293B 0%, #4F46E5 100%)'
                    : 'linear-gradient(135deg, #FFFFFF 0%, #A5B4FC 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2,
              }}
            >
              {isSmallMobile
                ? t('app.shortTitle', { defaultValue: 'FormVault' })
                : t('app.title')}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: { xs: 'none', md: 'block' },
                fontSize: '0.725rem',
                lineHeight: 1,
              }}
            >
              {t('app.subtitle', { defaultValue: 'Secure Insurance Application Portal' })}
            </Typography>
          </Box>
        </Box>

        {/* Center System Status Badge (Desktop) */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.5,
            borderRadius: '20px',
            backgroundColor:
              theme.palette.mode === 'light'
                ? 'rgba(16, 185, 129, 0.08)'
                : 'rgba(16, 185, 129, 0.12)',
            border:
              theme.palette.mode === 'light'
                ? '1px solid rgba(16, 185, 129, 0.2)'
                : '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.3)',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: theme.palette.mode === 'light' ? '#047857' : '#34D399',
              letterSpacing: '0.02em',
            }}
          >
            Vault Secure • AES-256 GCM
          </Typography>
        </Box>

        {/* Right Action Icons (Theme toggle & Language selector) */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 2 },
          }}
        >
          <Tooltip
            title={
              mode === 'dark'
                ? t('common.theme.light', { defaultValue: 'Switch to light mode' })
                : t('common.theme.dark', { defaultValue: 'Switch to dark mode' })
            }
          >
            <IconButton
              onClick={toggleColorMode}
              color="inherit"
              size="medium"
              aria-label={
                String(mode === 'dark'
                  ? t('common.theme.light', { defaultValue: 'Switch to light mode' })
                  : t('common.theme.dark', { defaultValue: 'Switch to dark mode' }))
              }
              sx={{
                borderRadius: '10px',
                border:
                  theme.palette.mode === 'light'
                    ? '1px solid rgba(15, 23, 42, 0.08)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'light'
                      ? 'rgba(15, 23, 42, 0.04)'
                      : 'rgba(255, 255, 255, 0.06)',
                },
              }}
            >
              {mode === 'dark' ? (
                <Brightness7 sx={{ color: '#FBBF24', fontSize: 20 }} />
              ) : (
                <Brightness4 sx={{ color: '#64748B', fontSize: 20 }} />
              )}
            </IconButton>
          </Tooltip>

          <LanguageSelector />
        </Box>
      </Toolbar>

      {/* Navigation Stepper progress */}
      <Box
        sx={{
          px: { xs: 1, sm: 2 },
          pb: 1,
          overflow: 'hidden',
        }}
      >
        <NavigationStepper />
      </Box>
    </AppBar>
  );
};

export default Header;