import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  Link as MuiLink,
  useTheme,
} from '@mui/material';
import { CookieOutlined } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CookieConsentBanner: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('formvault_gdpr_consent');
    if (!consent) {
      // Small delay for smooth entry
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('formvault_gdpr_consent', 'all');
    setIsVisible(false);
  };

  const handleAcceptNecessary = () => {
    localStorage.setItem('formvault_gdpr_consent', 'necessary');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: { xs: 16, sm: 24 },
        left: { xs: 16, sm: 24 },
        right: { xs: 16, sm: 24 },
        maxWidth: 720,
        mx: 'auto',
        zIndex: 2000,
        p: { xs: 2.5, sm: 3 },
        borderRadius: '20px',
        backgroundColor:
          theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(16px)',
        border:
          theme.palette.mode === 'light'
            ? '1px solid rgba(79, 70, 229, 0.25)'
            : '1px solid rgba(129, 140, 248, 0.3)',
        boxShadow:
          theme.palette.mode === 'light'
            ? '0 20px 48px -8px rgba(79, 70, 229, 0.18)'
            : '0 24px 54px -10px rgba(0, 0, 0, 0.85)',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems="center">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            backgroundColor: 'rgba(79, 70, 229, 0.12)',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CookieOutlined sx={{ fontSize: 28 }} />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
            {t('cookieConsent.title', 'EU GDPR & Cookie Compliance Notice')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
            {t('cookieConsent.description', 'We use strictly necessary cookies to ensure encrypted document transmission and remember your session. Under Regulation (EU) 2016/679 (GDPR), your identity documents are encrypted with AES-256 GCM. Learn more in our')}{' '}
            <MuiLink component={Link} to="/privacy-policy" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {t('cookieConsent.privacyPolicy', 'Privacy Policy')}
            </MuiLink>
            .
          </Typography>
        </Box>

        <Stack direction={{ xs: 'row', sm: 'column' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleAcceptAll}
            sx={{ fontWeight: 700, borderRadius: '10px', px: 2.5, whiteSpace: 'nowrap', flex: 1 }}
          >
            {t('cookieConsent.acceptAll', 'Accept All')}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={handleAcceptNecessary}
            sx={{ fontWeight: 600, borderRadius: '10px', px: 2, whiteSpace: 'nowrap', flex: 1 }}
          >
            {t('cookieConsent.essentialOnly', 'Essential Only')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default CookieConsentBanner;
