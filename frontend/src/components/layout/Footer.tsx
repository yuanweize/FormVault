import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Stack,
  Divider,
  useTheme,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldOutlined, EmailOutlined, VerifiedOutlined, OpenInNewOutlined } from '@mui/icons-material';
import { apiClient } from '../../services/api';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [portalConfig, setPortalConfig] = useState<{
    operator_legal_name?: string;
    operator_website_url?: string;
    partner_name?: string;
    partner_website_url?: string;
    relationship_status?: string;
    broker_legal_disclosure?: string;
  } | null>(null);

  useEffect(() => {
    // Dynamically retrieve configured broker legal disclosure and websites
    const fetchBrokerDisclosure = async () => {
      try {
        const res = await apiClient.get('/portal/config');
        if (res.data) {
          setPortalConfig(res.data);
        }
      } catch (e) {
        // Fallback gracefully to default i18n
      }
    };
    fetchBrokerDisclosure();
  }, []);

  const isPartnerVerified = portalConfig?.relationship_status === 'VERIFIED';
  const operatorUrl = portalConfig?.operator_website_url || 'https://hktse.eu.org/';
  const partnerUrl = portalConfig?.partner_website_url || 'https://ceskepojisteni.cz/';
  const operatorName = portalConfig?.operator_legal_name || 'HKTSE s.r.o.';
  const partnerName = portalConfig?.partner_name || 'České pojištění a.s.';

  const defaultBrokerDesc = (
    <span>
      {t('footer.techPlatformLead', 'FormVault is operated by ')}
      <Link
        href={operatorUrl}
        target="_blank"
        rel="noopener noreferrer"
        color="inherit"
        underline="hover"
        sx={{ fontWeight: 700 }}
      >
        {operatorName}
      </Link>
      {' (IČO: 10858032), providing digital intake & IT infrastructure as a lead introducer (tipař) '}
      {isPartnerVerified ? (
        <>
          {'in authorized cooperation with '}
          <Link
            href={partnerUrl}
            target="_blank"
            rel="noopener noreferrer"
            color="inherit"
            underline="hover"
            sx={{ fontWeight: 700 }}
          >
            {partnerName}
          </Link>
          {' (registered independent broker under Czech National Bank ČNB supervision per Act No. 170/2018 Coll.).'}
        </>
      ) : (
        'under configurable intermediary settings per Act No. 170/2018 Coll.'
      )}
    </span>
  );

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor:
          theme.palette.mode === 'dark'
            ? 'rgba(15, 23, 42, 0.92)'
            : 'rgba(248, 250, 252, 0.98)',
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
          <Box sx={{ maxWidth: { xs: '100%', md: '58%' } }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
              <ShieldOutlined sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {t('footer.brokerTitle', 'FormVault Insurance Technology & Distribution Support')}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
              {portalConfig?.broker_legal_disclosure ? (
                <span>{portalConfig.broker_legal_disclosure}</span>
              ) : (
                defaultBrokerDesc
              )}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Link
                href={operatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="caption"
                color="primary"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, fontWeight: 700 }}
              >
                {operatorName} <OpenInNewOutlined sx={{ fontSize: 12 }} />
              </Link>
              {isPartnerVerified && (
                <Link
                  href={partnerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="caption"
                  color="primary"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, fontWeight: 700 }}
                >
                  {partnerName} <OpenInNewOutlined sx={{ fontSize: 12 }} />
                </Link>
              )}
            </Stack>
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

        <Divider sx={{ my: 2.5, opacity: 0.6 }} />

        {/* Legal Regulatory Disclosure & Corporate Verification (Discreet yet Authoritative) */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1.5,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
            <span>© {new Date().getFullYear()} FormVault. {t('footer.allRightsReserved', 'All rights reserved.')}</span>
            <span>•</span>
            <Link
              href="https://hktse.eu.org/"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              underline="hover"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}
            >
              HKTSE s.r.o. <OpenInNewOutlined sx={{ fontSize: 11 }} />
            </Link>
            <span>•</span>
            <Link
              href="https://ceskepojisteni.cz/"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              underline="hover"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}
            >
              České pojištění a.s. <OpenInNewOutlined sx={{ fontSize: 11 }} />
            </Link>
            <span>•</span>
            <span>IČO: 10858032</span>
            <span>•</span>
            <Link
              href="https://verejnerejstriky.msp.gov.cz/vypis/1122326"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              underline="hover"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}
            >
              <VerifiedOutlined sx={{ fontSize: 12, color: 'success.main' }} />
              Municipal Court in Prague <OpenInNewOutlined sx={{ fontSize: 11 }} />
            </Link>
          </Typography>

          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.72rem' }}>
            Czech Act No. 170/2018 Coll. & Act No. 326/1999 Coll. (OAMP Compliant)
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;