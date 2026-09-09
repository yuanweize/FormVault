import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
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
  LockOutlined,
  GavelOutlined,
  DeleteForeverOutlined,
  FileDownloadOutlined,
  EmailOutlined,
  CheckCircleOutline,
} from '@mui/icons-material';
import { apiClient } from '../services/api';

const PrivacyPolicyPage: React.FC = () => {
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
      setSubmitError('Please provide your full name and registered email address.');
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
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message || 'Failed to submit GDPR request. Please try again or email us directly.'
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
          label="EU Regulation 2016/679 (GDPR) & Czech Act No. 110/2019 Coll. Compliant"
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
          Privacy Policy & Data Protection
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680, mx: 'auto', lineHeight: 1.6 }}>
          Official declaration of how FormVault Insurance collects, processes, encrypts, and protects personal identity
          data for Czech Republic and European Union insurance applications.
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
                  1. Data Controller Identification
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  The data controller responsible for the processing of your personal data is{' '}
                  <strong>FormVault Insurance Brokerage Services (operating in Prague, Czech Republic)</strong>.
                  For any inquiries regarding data protection or to contact our Data Protection Officer (DPO), please email:{' '}
                  <strong>insurance@hktse.eu.org</strong>.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
                  2. Purpose of Data Processing & Legal Basis
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  We collect and process your identity details (Name, Date of Birth, Passport/ID copy, Student Status,
                  Address) strictly for the following purposes:
                </Typography>
                <Box component="ul" sx={{ pl: 2.5, mt: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
                  <li>Binding and issuing health, travel, and student insurance policies with licensed underwriters;</li>
                  <li>Compliance with the Czech Foreigners Residence Act (Act No. 326/1999 Coll., OAMP requirements);</li>
                  <li>Audit verification, fraud prevention, and regulatory archiving under Czech Insurance Law.</li>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Legal basis: <em>Article 6(1)(b) GDPR</em> (Performance of a contract) and <em>Article 6(1)(c) GDPR</em> (Legal obligations).
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
                  3. Hardware-Grade Encryption & Zero-Knowledge Storage
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  All passport photos, student identification cards, and personal records transmitted to FormVault are encrypted
                  at rest using <strong>AES-256 GCM authenticated encryption</strong> with unique initialization vectors (IV).
                  Database connections are strictly isolated from the public Internet, and internal transfers utilize TLS 1.3.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>
                  4. Your Rights Under GDPR (Articles 15-22)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  As an applicant, you possess the following enforceable statutory rights:
                </Typography>
                <Box component="ul" sx={{ pl: 2.5, mt: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
                  <li><strong>Right of Access (Art. 15):</strong> Request a copy of all personal records we hold about you;</li>
                  <li><strong>Right to Rectification (Art. 16):</strong> Correct any incomplete or erroneous personal details;</li>
                  <li><strong>Right to Erasure / "Right to be Forgotten" (Art. 17):</strong> Request deletion of submitted documents where statutory retention periods permit;</li>
                  <li><strong>Right to Data Portability (Art. 20):</strong> Receive your structured data in standard machine-readable JSON/PDF.</li>
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
                Exercise Your GDPR Rights
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: '0.85rem' }}>
              Submit an official data request directly to our Data Protection Officer. We will process and confirm your request
              within 30 calendar days as mandated by EU law.
            </Typography>

            <form onSubmit={handleGdprSubmit}>
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="gdpr-type-label">Request Action</InputLabel>
                  <Select
                    labelId="gdpr-type-label"
                    label="Request Action"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                  >
                    <MenuItem value="access">Right of Access (Export My Data)</MenuItem>
                    <MenuItem value="rectification">Right to Rectification (Correct Errors)</MenuItem>
                    <MenuItem value="erasure">Right to Erasure (Delete My Documents)</MenuItem>
                    <MenuItem value="portability">Data Portability (Structured Machine Copy)</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Full Legal Name"
                  placeholder="e.g. Jan Novak"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <TextField
                  fullWidth
                  size="small"
                  type="email"
                  label="Registered Email"
                  placeholder="e.g. jan@example.cz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Application Reference # (Optional)"
                  placeholder="e.g. APP-2026-001234"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                />

                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  label="Specific Notes / Request Details"
                  placeholder="Specify which documents or corrections you are requesting..."
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
                    <strong>Ticket Created: {submitResult.ticket_id}</strong>
                    <br />
                    {submitResult.message}
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
                  {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Submit Formal GDPR Request'}
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
