import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  Button,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Paper,
  Snackbar,
  useTheme,
} from '@mui/material';
import {
  EmailOutlined,
  ChatBubbleOutline,
  ExpandMoreOutlined,
  ContentCopyOutlined,
  HelpOutline,
  ScheduleOutlined,
  LocationOnOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const SupportPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const supportEmail = 'insurance@hktse.eu.org';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
  };

  const [chatLoading, setChatLoading] = useState(false);
  const [chatFeedback, setChatFeedback] = useState<string | null>(null);

  const handleOpenCrispChat = async () => {
    // 1. Check if Crisp is already loaded on window
    if ((window as any).$crisp) {
      try {
        (window as any).$crisp.push(['do', 'chat:show']);
        (window as any).$crisp.push(['do', 'chat:open']);
        return;
      } catch (e) {
        console.warn('Crisp open failed:', e);
      }
    }

    // 2. Otherwise dynamically retrieve crisp configuration and initialize
    setChatLoading(true);
    try {
      const { apiClient } = await import('../services/api');
      const res = await apiClient.get('/portal/config');
      const crispId = res?.data?.crisp_website_id;
      const crispPosition = res?.data?.crisp_position;
      const crispColor = res?.data?.crisp_custom_color;

      if (crispId) {
        (window as any).$crisp = (window as any).$crisp || [];
        (window as any).CRISP_WEBSITE_ID = crispId;

        // Apply position and color configuration
        const isLeft = crispPosition === 'left';
        (window as any).$crisp.push(['set', 'position:reverse', [isLeft]]);
        if (crispColor) {
          (window as any).$crisp.push(['set', 'color:theme', [crispColor]]);
        }
        (window as any).$crisp.push(['do', 'chat:show']);
        (window as any).$crisp.push(['do', 'chat:open']);

        let script = document.querySelector('script[src*="client.crisp.chat"]') as HTMLScriptElement;
        if (!script) {
          script = document.createElement('script');
          script.src = 'https://client.crisp.chat/l.js';
          script.async = true;
          script.onload = () => {
            try {
              (window as any).$crisp.push(['do', 'chat:show']);
              (window as any).$crisp.push(['do', 'chat:open']);
            } catch (err) {
              // Crisp client push may fail if blocked by ad-blocker
            }
          };
          document.head.appendChild(script);
        }
      } else {
        // Chat is not configured in backend: show informative message
        setChatFeedback(
          t('pages.support.chatUnavailable', {
            defaultValue: 'Live advisor chat is currently unconfigured. Please use the direct email option below.',
          })
        );
      }
    } catch (err) {
      console.error('Failed to initialize Crisp chat:', err);
      setChatFeedback(
        t('pages.support.chatError', {
          defaultValue: 'Could not connect to live chat. Please try again or compose an email.',
        })
      );
    } finally {
      setChatLoading(false);
    }
  };

  const faqs = [
    {
      q: t('pages.support.faqs.q1', {
        defaultValue: 'How does the insurance enquiry process work?',
      }),
      a: t('pages.support.faqs.a1', {
        defaultValue:
          'Once you submit your basic requirements through FormVault, HKTSE s.r.o. securely forwards your enquiry to licensed insurance intermediary České pojištění a.s. Their qualified insurance advisors will prepare available options and contact you with full pre-contractual information.',
      }),
    },
    {
      q: t('pages.support.faqs.q2', {
        defaultValue: 'Do the available insurance plans meet Czech Ministry of the Interior (OAMP) requirements?',
      }),
      a: t('pages.support.faqs.a2', {
        defaultValue:
          'Yes. The comprehensive health insurance plans provided through České pojištění a.s. fully comply with the Czech Foreigners Residence Act (Act No. 326/1999 Coll.) and are recognized for Czech long-term visa and residence permit applications.',
      }),
    },
    {
      q: t('pages.support.faqs.q3', {
        defaultValue: 'What should I do if my visa application is refused by the Embassy?',
      }),
      a: t('pages.support.faqs.a3', {
        defaultValue:
          'If your visa application is denied, licensed insurance policies generally qualify for premium refunds subject to carrier terms upon providing the official written rejection notice.',
      }),
    },
    {
      q: t('pages.support.faqs.q4', {
        defaultValue: 'How does medical claim settlement work in the Czech Republic?',
      }),
      a: t('pages.support.faqs.a4', {
        defaultValue:
          'Contracted clinics and hospitals provide direct cashless billing upon presentation of your insurance card. For other medical facilities, invoices and medical reports are submitted to the insurer for reimbursement.',
      }),
    },
    {
      q: t('pages.support.faqs.q5', {
        defaultValue: 'What information is needed to submit an enquiry?',
      }),
      a: t('pages.support.faqs.a5', {
        defaultValue:
          'Under our current enquiry process, we only collect basic details: your contact information, student status, age bracket, and intended length of stay. No sensitive passport scans or medical dossiers are required.',
      }),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', maxWidth: 820, mx: 'auto', mb: 6 }}>
        <Chip
          icon={<HelpOutline sx={{ fontSize: 16 }} />}
          label={t('pages.support.badge', { defaultValue: 'Client Care & Enquiry Assistance' })}
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
          {t('pages.support.title', { defaultValue: 'Customer Support & Help Center' })}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto', lineHeight: 1.6 }}>
          {t('pages.support.subtitle', {
            defaultValue:
              'Get assistance with your health insurance enquiry, understand Czech stay requirements, or reach out to our team.',
          })}
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
                {t('pages.support.emailCardTitle', { defaultValue: 'Direct Email Dispatch' })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                {t('pages.support.emailCardDesc', {
                  defaultValue:
                    'For policy verification, visa embassy inquiries, or submitting refusal refund forms. Average response time: < 2 hours.',
                })}
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
                  {t('pages.support.copyBtn', { defaultValue: 'Copy' })}
                </Button>
              </Paper>
            </Box>

            <Button
              variant="contained"
              fullWidth
              href={`mailto:${supportEmail}?subject=FormVault%20Insurance%20Inquiry`}
              sx={{ py: 1.2, fontWeight: 700, borderRadius: '10px' }}
            >
              {t('pages.support.composeEmail', { defaultValue: 'Compose Email' })}
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
                {t('pages.support.chatCardTitle', { defaultValue: 'Live Advisor Chat (Crisp)' })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.6 }}>
                {t('pages.support.chatCardDesc', {
                  defaultValue:
                    'Connect with our support team in English, Chinese (中文), or Czech. Assistance during European business hours.',
                })}
              </Typography>

              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <ScheduleOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {t('pages.support.hours', { defaultValue: 'Mon - Fri: 09:00 - 18:00 CET' })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <LocationOnOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {t('pages.support.location', { defaultValue: 'Prague, Czechia' })}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Button
              variant="outlined"
              color="success"
              fullWidth
              disabled={chatLoading}
              onClick={handleOpenCrispChat}
              sx={{ py: 1.2, fontWeight: 700, borderRadius: '10px', borderWidth: '2px' }}
            >
              {chatLoading
                ? t('pages.support.connectingChat', { defaultValue: 'Connecting to Crisp Agent...' })
                : t('pages.support.openChat', { defaultValue: 'Open Live Chat' })}
            </Button>
          </Card>
        </Grid>
      </Grid>

      {/* FAQ Section */}
      <Box sx={{ maxWidth: 840, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            {t('pages.support.faqTitle', { defaultValue: 'Frequently Asked Questions' })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('pages.support.faqSubtitle', {
              defaultValue: 'Quick answers regarding foreign insurance requirements in the Czech Republic.',
            })}
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
        message={t('pages.support.copied', {
          defaultValue: 'Support email copied to clipboard: insurance@hktse.eu.org',
        })}
      />

      <Snackbar
        open={Boolean(chatFeedback)}
        autoHideDuration={5000}
        onClose={() => setChatFeedback(null)}
        message={chatFeedback || ''}
      />
    </Container>
  );
};

export default SupportPage;
