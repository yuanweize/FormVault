import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Paper,
  Alert,
  Snackbar,
  useTheme,
} from '@mui/material';
import {
  EmailOutlined,
  ChatBubbleOutline,
  ExpandMoreOutlined,
  ContentCopyOutlined,
  CheckCircleOutline,
  HelpOutline,
  LocalHospitalOutlined,
  ScheduleOutlined,
  LocationOnOutlined,
  AssignmentTurnedInOutlined,
} from '@mui/icons-material';

const SupportPage: React.FC = () => {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const supportEmail = 'insurance@hktse.eu.org';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
  };

  const handleOpenCrispChat = () => {
    // Check if crisp is loaded on window
    if ((window as any).$crisp) {
      (window as any).$crisp.push(['do', 'chat:open']);
    } else {
      alert('Live chat is initializing or currently offline. Please email us directly at ' + supportEmail);
    }
  };

  const faqs = [
    {
      q: 'How fast will I receive my official insurance certificate after submission?',
      a: 'Standard electronic policy certificates (Potvrzení o pojištění) are generated within 1 to 4 business hours after underwriting review and payment confirmation. You will receive the certified PDF directly to your email, complete with the contract number for your Czech visa application.',
    },
    {
      q: 'Are your policies 100% accepted by the Czech Ministry of Interior (OAMP)?',
      a: 'Yes. All policies mediated through our agency (PVZP, Slavia, Maxima, UNIQA) strictly comply with the Foreigners Residence Act (Act No. 326/1999 Coll.). They include comprehensive health insurance (KZPC) with medical limits up to 10,000,000 CZK (EUR 400,000) and are automatically registered in the Czech national insurance registry.',
    },
    {
      q: 'What should I do if my visa application is refused by the Embassy?',
      a: 'If your visa or residence permit is denied, you are entitled to a refund pursuant to carrier cancellation terms. Simply send a copy of the official OAMP/Embassy refusal document to insurance@hktse.eu.org, and our team will process the policy cancellation and refund.',
    },
    {
      q: 'How does medical claim reimbursement and direct billing work in Czechia?',
      a: 'For hospitals and clinics contracted with your underwriter (e.g. Motol, FNKV, VFN in Prague, or FN Brno), you simply show your physical or digital insurance card for direct cashless billing. For non-contracted facilities, pay the invoice, obtain the medical report, and submit it for prompt reimbursement within 14 days.',
    },
    {
      q: 'Why are passport and student verification documents required?',
      a: 'Czech insurance law mandates strict identity verification for foreign nationals to register your policy with the Ministry of the Interior. Uploading your student ID also qualifies you for discounted university student rates (up to 30% savings).',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', maxWidth: 820, mx: 'auto', mb: 6 }}>
        <Chip
          icon={<HelpOutline sx={{ fontSize: 16 }} />}
          label="24/7 Client Care & Broker Assistance"
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
          Customer Support & Help Center
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto', lineHeight: 1.6 }}>
          Get assistance with policy applications, Czech visa document requirements, claim procedures, or chat live with an
          underwriting advisor.
        </Typography>
      </Box>

      {/* Support Action Cards */}
      <Grid container spacing={3.5} sx={{ mb: 8 }}>
        {/* Email Support Card */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              borderRadius: '20px',
              p: 3,
              border: '2px solid rgba(79, 70, 229, 0.25)',
              boxShadow: '0 8px 30px -4px rgba(79, 70, 229, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '14px',
                  backgroundColor: 'rgba(79, 70, 229, 0.12)',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <EmailOutlined sx={{ fontSize: 28 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                Direct Email Dispatch
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                For policy verification, visa embassy inquiries, or submitting refusal refund forms. Average response time: &lt; 2 hours.
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  backgroundColor: theme.palette.mode === 'light' ? '#F1F5F9' : 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {supportEmail}
                </Typography>
                <Button
                  size="small"
                  startIcon={<ContentCopyOutlined fontSize="small" />}
                  onClick={handleCopyEmail}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Copy
                </Button>
              </Paper>
            </Box>

            <Button
              variant="contained"
              fullWidth
              href={`mailto:${supportEmail}?subject=FormVault%20Insurance%20Inquiry`}
              sx={{ py: 1.2, fontWeight: 700, borderRadius: '10px' }}
            >
              Compose Email
            </Button>
          </Card>
        </Grid>

        {/* Crisp Live Chat Card */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              borderRadius: '20px',
              p: 3,
              border: '2px solid rgba(16, 185, 129, 0.25)',
              boxShadow: '0 8px 30px -4px rgba(16, 185, 129, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '14px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <ChatBubbleOutline sx={{ fontSize: 28 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                Live Advisor Chat (Crisp)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                Connect directly with a licensed insurance specialist in English, Chinese (中文), or Czech. Instant assistance during European business hours.
              </Typography>

              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <ScheduleOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Mon - Fri: 09:00 - 18:00 CET
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <LocationOnOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Prague, Czechia
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Button
              variant="outlined"
              color="success"
              fullWidth
              onClick={handleOpenCrispChat}
              sx={{ py: 1.2, fontWeight: 700, borderRadius: '10px', borderWidth: '2px' }}
            >
              Open Live Chat
            </Button>
          </Card>
        </Grid>
      </Grid>

      {/* FAQ Section */}
      <Box sx={{ maxWidth: 840, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Frequently Asked Questions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quick answers regarding foreign insurance requirements in the Czech Republic.
          </Typography>
        </Box>

        <Stack spacing={2}>
          {faqs.map((faq, index) => (
            <Accordion
              key={index}
              sx={{
                borderRadius: '14px !important',
                '&:before': { display: 'none' },
                border: '1px solid rgba(15, 23, 42, 0.08)',
                boxShadow: 'none',
                overflow: 'hidden',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreOutlined />} sx={{ py: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, pr: 2 }}>
                  {faq.q}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 2.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {faq.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      </Box>

      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        message="Support email copied to clipboard: insurance@hktse.eu.org"
      />
    </Container>
  );
};

export default SupportPage;
