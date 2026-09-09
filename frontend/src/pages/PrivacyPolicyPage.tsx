import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  useTheme,
} from '@mui/material';
import {
  ShieldOutlined,
  GavelOutlined,
  CheckCircleOutline,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../services/api';

const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  // GDPR Request Form State
  const [requestType, setRequestType] = useState('access');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<any | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleGdprSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setSubmitError(
        t('pages.privacy.form.validationError', {
          defaultValue: 'Please provide your full name and registered email address.',
        })
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitResult(null);

    try {
      const res = await apiClient.post('/portal/gdpr-request', {
        request_type: requestType,
        full_name: fullName.trim(),
        email: email.trim(),
        reference_number: refNumber.trim() || undefined,
        details: details.trim() || undefined,
      });

      setSubmitResult(res.data);
      setFullName('');
      setEmail('');
      setRefNumber('');
      setDetails('');
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          t('errors.general', { defaultValue: 'Failed to submit GDPR request. Please try again or email us directly.' })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      {/* Header Badge & Title */}
      <Box sx={{ textAlign: 'center', maxWidth: 840, mx: 'auto', mb: 6 }}>
        <Chip
          icon={<GavelOutlined sx={{ fontSize: 16 }} />}
          label={t('pages.privacy.badge', {
            defaultValue: 'EU Regulation 2016/679 (GDPR) & Czech Act No. 110/2019 Coll. Compliant',
          })}
          sx={{
            mb: 2,
            px: 1.5,
            py: 0.5,
            fontSize: '0.8rem',
            fontWeight: 700,
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            color: 'primary.main',
            border: '1px solid rgba(79, 70, 229, 0.25)',
          }}
        />
        <Typography variant="h2" component="h1" sx={{ fontWeight: 800, fontSize: { xs: '2.2rem', sm: '3rem' }, mb: 2 }}>
          {t('pages.privacy.title', { defaultValue: 'Privacy Policy & Data Protection' })}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680, mx: 'auto', lineHeight: 1.6 }}>
          {t('pages.privacy.subtitle', {
            defaultValue:
              'Official declaration of how FormVault Insurance collects, processes, encrypts, and protects personal identity data for Czech Republic and European Union insurance applications.',
          })}
        </Typography>
      </Box>

      {/* Main Content Layout */}
      <Grid container spacing={4}>
        {/* Left Column: Legal Terms */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: '20px',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(30, 41, 59, 0.5)',
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
                  {t('pages.privacy.section1Title', { defaultValue: '1. Data Processing Architecture & Intermediary Role' })}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('pages.privacy.section1Lead', {
                    defaultValue:
                      'The technical application infrastructure is operated by ',
                  })}
                  <a
                    href="https://hktse.eu.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}
                  >
                    HKTSE s.r.o.
                  </a>
                  {' (IČO: 10858032, Municipal Court in Prague). Insurance distribution and underwriting mediation is conducted in authorized cooperation with '}
                  <a
                    href="https://ceskepojisteni.cz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}
                  >
                    České pojištění a.s.
                  </a>
                  {', an independent intermediary supervised by the Czech National Bank (ČNB). Underwriter partners and our platform act as joint or independent controllers under GDPR Article 26/28. For data privacy inquiries or DPO correspondence, email: insurance@hktse.eu.org.'}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
                  {t('pages.privacy.section2Title', { defaultValue: '2. Purpose of Data Processing & Legal Basis' })}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('pages.privacy.section2Intro', {
                    defaultValue:
                      'We collect and process your identity details (Name, Date of Birth, Passport/ID copy, Student Status, Address) strictly for the following purposes:',
                  })}
                </Typography>
                <Box component="ul" sx={{ pl: 2.5, mt: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
                  <li>
                    {t('pages.privacy.section2Item1', {
                      defaultValue:
                        'Binding and issuing health, travel, and student insurance policies with licensed underwriters;',
                    })}
                  </li>
                  <li>
                    {t('pages.privacy.section2Item2', {
                      defaultValue:
                        'Compliance with the Czech Foreigners Residence Act (Act No. 326/1999 Coll., OAMP requirements);',
                    })}
                  </li>
                  <li>
                    {t('pages.privacy.section2Item3', {
                      defaultValue:
                        'Audit verification, fraud prevention, and regulatory archiving under Czech Insurance Law.',
                    })}
                  </li>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('pages.privacy.section2Legal', {
                    defaultValue:
                      'Legal basis: Article 6(1)(b) GDPR (Performance of a contract) and Article 6(1)(c) GDPR (Legal obligations).',
                  })}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
                  {t('pages.privacy.section3Title', {
                    defaultValue: '3. AES-256 GCM Storage Vault & Underwriter RBAC Isolation',
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('pages.privacy.section3Content', {
                    defaultValue:
                      'All uploaded passport copies, student confirmation letters, and identity records are symmetrically encrypted at rest using AES-256-GCM authenticated encryption with per-file salt and unique nonces (FV_GCM_V1 envelope). Access to decrypted records is strictly restricted through role-based access control (RBAC) to verified operational underwriters, with all review and export actions recorded in audit trails.',
                  })}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
                  {t('pages.privacy.section4Title', { defaultValue: '4. Your Rights Under GDPR (Articles 15-22)' })}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {t('pages.privacy.section4Intro', {
                    defaultValue: 'As an applicant, you possess the following enforceable statutory rights:',
                  })}
                </Typography>
                <Box component="ul" sx={{ pl: 2.5, mt: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
                  <li>{t('pages.privacy.section4Item1')}</li>
                  <li>{t('pages.privacy.section4Item2')}</li>
                  <li>{t('pages.privacy.section4Item3')}</li>
                  <li>{t('pages.privacy.section4Item4')}</li>
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column: Interactive GDPR Data Subject Request Panel */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={3}
            sx={{
              p: { xs: 3, sm: 3.5 },
              borderRadius: '20px',
              border: '2px solid rgba(79, 70, 229, 0.3)',
              backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(30, 41, 59, 0.7)',
              position: 'sticky',
              top: 88,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <ShieldOutlined color="primary" sx={{ fontSize: 26 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {t('pages.privacy.form.title', { defaultValue: 'Exercise Your GDPR Rights' })}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: '0.85rem' }}>
              {t('pages.privacy.form.subtitle', {
                defaultValue:
                  'Submit an official data request directly to our Data Protection Officer. We will process and confirm your request within 30 calendar days as mandated by EU law.',
              })}
            </Typography>

            <form onSubmit={handleGdprSubmit}>
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="gdpr-type-label">
                    {t('pages.privacy.form.requestAction', { defaultValue: 'Request Action' })}
                  </InputLabel>
                  <Select
                    labelId="gdpr-type-label"
                    label={t('pages.privacy.form.requestAction', { defaultValue: 'Request Action' })}
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                  >
                    <MenuItem value="access">
                      {t('pages.privacy.form.types.access', { defaultValue: 'Right of Access (Export My Data)' })}
                    </MenuItem>
                    <MenuItem value="rectification">
                      {t('pages.privacy.form.types.rectification', {
                        defaultValue: 'Right to Rectification (Correct Errors)',
                      })}
                    </MenuItem>
                    <MenuItem value="erasure">
                      {t('pages.privacy.form.types.erasure', {
                        defaultValue: 'Right to Erasure (Delete My Documents)',
                      })}
                    </MenuItem>
                    <MenuItem value="portability">
                      {t('pages.privacy.form.types.portability', {
                        defaultValue: 'Data Portability (Structured Machine Copy)',
                      })}
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label={String(t('pages.privacy.form.fullName', { defaultValue: 'Full Legal Name' }))}
                  placeholder={String(t('pages.privacy.form.fullNamePlaceholder', { defaultValue: 'e.g. Jan Novak' }))}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  label={String(t('pages.privacy.form.registeredEmail', { defaultValue: 'Registered Email' }))}
                  placeholder={String(
                    t('pages.privacy.form.registeredEmailPlaceholder', {
                      defaultValue: 'e.g. jan@example.cz',
                    })
                  )}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <TextField
                  fullWidth
                  size="small"
                  label={String(t('pages.privacy.form.refNumber', { defaultValue: 'Application Reference # (Optional)' }))}
                  placeholder={String(t('pages.privacy.form.refNumberPlaceholder', { defaultValue: 'e.g. APP-2026-001234' }))}
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                />

                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  label={String(t('pages.privacy.form.details', { defaultValue: 'Specific Notes / Request Details' }))}
                  placeholder={String(
                    t('pages.privacy.form.detailsPlaceholder', {
                      defaultValue: 'Specify which documents or corrections you are requesting...',
                    })
                  )}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />

                {submitError && (
                  <Alert severity="error" sx={{ borderRadius: '10px' }}>
                    {submitError}
                  </Alert>
                )}

                {submitResult && (
                  <Alert
                    severity="success"
                    icon={<CheckCircleOutline />}
                    sx={{ borderRadius: '10px', fontSize: '0.85rem' }}
                  >
                    <strong>
                      {t('pages.privacy.form.successTitle', { defaultValue: 'Request Recorded Successfully' })}:{' '}
                      {submitResult.ticket_id}
                    </strong>
                    <br />
                    {submitResult.message || t('pages.privacy.form.successDesc')}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    py: 1.2,
                    fontWeight: 700,
                    borderRadius: '10px',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                  }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    t('pages.privacy.form.submit', { defaultValue: 'Submit Formal GDPR Request' })
                  )}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PrivacyPolicyPage;
