import React from 'react';
import {
  Box,
  Typography,
  Stack,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  ShieldOutlined,
  LockOutlined,
  AdminPanelSettingsOutlined,
  HttpsOutlined,
  EnhancedEncryptionOutlined,
  VerifiedUserOutlined,
  AssignmentTurnedInOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface SecurityAssuranceRailProps {
  compact?: boolean;
}

export const SecurityAssuranceRail: React.FC<SecurityAssuranceRailProps> = ({
  compact = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const badges = [
    {
      icon: <LockOutlined sx={{ fontSize: 16, color: '#10B981' }} />,
      label: t('securityRail.aes.label', { defaultValue: 'AES-256 GCM Storage' }),
      tooltip: t('securityRail.aes.tooltip', {
        defaultValue: 'Passports and attachments are symmetrically encrypted with AES-256 GCM and per-file nonces before disk storage.',
      }),
    },
    {
      icon: <AdminPanelSettingsOutlined sx={{ fontSize: 16, color: '#6366F1' }} />,
      label: t('securityRail.rbac.label', { defaultValue: 'Strict RBAC Isolation' }),
      tooltip: t('securityRail.rbac.tooltip', {
        defaultValue: 'Identity files are isolated in zero-trust enclaves; decryption is restricted exclusively to authenticated underwriters.',
      }),
    },
    {
      icon: <HttpsOutlined sx={{ fontSize: 16, color: '#06B6D4' }} />,
      label: t('securityRail.tls.label', { defaultValue: 'TLS 1.3 Strict Ingress' }),
      tooltip: t('securityRail.tls.tooltip', {
        defaultValue: 'In-transit communications are enforced via Cloudflare Zero-Trust ingress with strict HSTS and PFS cipher suites.',
      }),
    },
    {
      icon: <EnhancedEncryptionOutlined sx={{ fontSize: 16, color: '#8B5CF6' }} />,
      label: t('securityRail.session.label', { defaultValue: 'Volatile Session Sandbox' }),
      tooltip: t('securityRail.session.tooltip', {
        defaultValue: 'Sensitive applicant credentials exist in volatile session memory, preventing disk caching on shared workstations.',
      }),
    },
    {
      icon: <VerifiedUserOutlined sx={{ fontSize: 16, color: '#F59E0B' }} />,
      label: t('securityRail.cnb.label', { defaultValue: 'ČNB Intermediary Co-Compliance' }),
      tooltip: t('securityRail.cnb.tooltip', {
        defaultValue: 'Technical infrastructure operated by HKTSE s.r.o. in authorized cooperation with České pojištění a.s. under Act No. 170/2018 Coll.',
      }),
    },
    {
      icon: <AssignmentTurnedInOutlined sx={{ fontSize: 16, color: '#EC4899' }} />,
      label: t('securityRail.audit.label', { defaultValue: 'Tamper-Evident Audit' }),
      tooltip: t('securityRail.audit.tooltip', {
        defaultValue: 'Every decryption, document review, and status update generates an immutable cryptographic audit record.',
      }),
    },
  ];

  return (
    <Box
      sx={{
        width: '100%',
        p: { xs: 1.5, sm: 2 },
        mb: 3,
        borderRadius: '12px',
        backgroundColor: isDark
          ? 'rgba(17, 24, 39, 0.75)'
          : 'rgba(248, 250, 252, 0.85)',
        backdropFilter: 'blur(12px)',
        border: isDark
          ? '1px solid rgba(255, 255, 255, 0.08)'
          : '1px solid rgba(79, 70, 229, 0.1)',
        boxShadow: isDark
          ? '0 4px 20px -2px rgba(0, 0, 0, 0.3)'
          : '0 2px 12px -2px rgba(79, 70, 229, 0.06)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        {/* Active security pulse indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: isDark ? '#A5B4FC' : '#4F46E5',
            }}
          >
            {t('securityRail.title', { defaultValue: 'Institutional Security Rail' })}
          </Typography>
        </Box>

        {/* Security Trust Badges */}
        <Stack
          direction="row"
          spacing={{ xs: 1, sm: 2 }}
          flexWrap="wrap"
          alignItems="center"
          useFlexGap
        >
          {badges.map((badge, idx) => (
            <Tooltip title={badge.tooltip} arrow key={idx}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                  px: 1,
                  py: 0.4,
                  borderRadius: '6px',
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(255, 255, 255, 0.8)',
                  border: isDark
                    ? '1px solid rgba(255, 255, 255, 0.06)'
                    : '1px solid rgba(0, 0, 0, 0.05)',
                  cursor: 'default',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(255, 255, 255, 1)',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {badge.icon}
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: isDark ? '#E2E8F0' : '#334155',
                  }}
                >
                  {badge.label}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default SecurityAssuranceRail;
