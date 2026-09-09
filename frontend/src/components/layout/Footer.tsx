import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Stack,
  useTheme,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldOutlined, EmailOutlined } from '@mui/icons-material';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor:
          theme.palette.mode === 'dark'
            ? 'rgba(15, 23, 42, 0.85)'
            : 'rgba(248, 250, 252, 0.95)',
        backdropFilter: 'blur(16px)',
        borderTop:
          theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(15, 23, 42, 0.08)',
        py: 4,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2.5,
          }}
        >
          {/* Brand & Broker Accreditation */}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
              <ShieldOutlined sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {t('footer.brokerTitle', 'FormVault Insurance Brokerage & Underwriting Services')}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.5 }}>
              {t('footer.brokerDesc', 'Licensed intermediary operations in Prague, Czech Republic. Official partner for PVZP, Slavia, Maxima & UNIQA.')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
              © {new Date().getFullYear()} FormVault. {t('footer.allRightsReserved')}
            </Typography>
          </Box>

          {/* Direct Support Contact & Links */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1.5, sm: 3 }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <EmailOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Link
                href="mailto:insurance@hktse.eu.org"
                variant="caption"
                color="text.secondary"
                underline="hover"
                sx={{ fontWeight: 600, fontFamily: 'monospace' }}
              >
                insurance@hktse.eu.org
              </Link>
            </Box>

            <Link
              component={RouterLink}
              to="/privacy-policy"
              variant="body2"
              color="text.secondary"
              underline="hover"
              sx={{ fontWeight: 600, transition: 'color 0.2s', '&:hover': { color: 'primary.main' } }}
            >
              {t('footer.privacy', { defaultValue: 'Privacy Policy' })}
            </Link>

            <Link
              component={RouterLink}
              to="/terms-of-service"
              variant="body2"
              color="text.secondary"
              underline="hover"
              sx={{ fontWeight: 600, transition: 'color 0.2s', '&:hover': { color: 'primary.main' } }}
            >
              {t('footer.terms', { defaultValue: 'Terms of Service' })}
            </Link>

            <Link
              component={RouterLink}
              to="/support"
              variant="body2"
              color="text.secondary"
              underline="hover"
              sx={{ fontWeight: 600, transition: 'color 0.2s', '&:hover': { color: 'primary.main' } }}
            >
              {t('footer.support', { defaultValue: 'Support & FAQ' })}
            </Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;