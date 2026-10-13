import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  Card,
  Container,
  Chip,
  Stack,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from '@mui/material';
import {
  SecurityOutlined,
  LanguageOutlined,
  ArrowForwardOutlined,
  VerifiedUserOutlined,
  SpeedOutlined,
  LockOutlined,
  SearchOutlined,
  CheckCircleOutline,
  RadioButtonChecked,
  RadioButtonUnchecked,
  OpenInNewOutlined,
  ShieldOutlined,
  SchoolOutlined,
  CampaignOutlined,
  CloseOutlined,
  SupportAgentOutlined,
  AssignmentOutlined,
  ExpandMoreOutlined,
  HelpOutline,
  ContactSupportOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  applicationService,
  TrackApplicationResponse,
  PortalShowcaseResponse,
  InsuranceCompanyShowcase,
  InsurancePlanShowcase,
  AgencyBannerShowcase,
  LeadInquiryResponse,
} from '../services/applicationService';
import { LeadInquiryForm } from '../components/forms';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const trackSectionRef = useRef<HTMLDivElement>(null);
  const inquirySectionRef = useRef<HTMLDivElement>(null);

  // Showcase state (strictly empty fallback in LEAD_ONLY mode; no hardcoded insurer quotes)
  const [, setCompanies] = useState<InsuranceCompanyShowcase[]>([]);
  const [, setPlans] = useState<InsurancePlanShowcase[]>([]);
  const [banner, setBanner] = useState<AgencyBannerShowcase | null>({
    id: 1,
    title: 'Czech Foreigners Residence Act (Act No. 326/1999 Coll.) Compliant Insurance Information',
    subtitle:
      'Foreign nationals applying for Czech long-term visas or residence permits must hold comprehensive health insurance meeting statutory requirements. Submit your enquiry to receive licensed intermediary options.',
    tag: 'Regulatory Notice',
    button_text: 'Request Options',
    display_order: 1,
  });
  const [bannerVisible, setBannerVisible] = useState(true);

  // Tracking form state
  const [trackRef, setTrackRef] = useState('');
  const [trackEmail, setTrackEmail] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackResult, setTrackResult] = useState<TrackApplicationResponse | null>(null);

  // FAQ Accordion state
  const [expandedFaq, setExpandedFaq] = useState<string | false>('faq-1');

  // Feature cards custom config state
  interface FeatureCardItem {
    id?: string;
    badge?: string;
    title?: string;
    title_key?: string;
    description?: string;
    desc_key?: string;
    icon?: string;
    gradient?: string;
  }
  const [customFeatures, setCustomFeatures] = useState<FeatureCardItem[] | null>(null);

  useEffect(() => {
    // Fetch live showcase data from API (fails gracefully to empty lists in LEAD_ONLY mode)
    const loadShowcase = async () => {
      try {
        const data: PortalShowcaseResponse = await applicationService.getPortalShowcase();
        if (data.success) {
          setCompanies(data.companies || []);
          setPlans(data.plans || []);
          if (data.banners && data.banners.length > 0) {
            setBanner(data.banners[0]);
          }
        }
      } catch (err) {
        // Fail-close to empty showcase
        setCompanies([]);
        setPlans([]);
      }

      // Fetch dynamic portal config for customizable features showcase
      try {
        const config = await applicationService.getPortalConfig();
        if (config && config.features_config) {
          const parsed = JSON.parse(config.features_config);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCustomFeatures(parsed);
          }
        }
      } catch (err) {
        // Retain professional default feature cards
      }
    };
    loadShowcase();
  }, []);

  const scrollToInquiry = () => {
    inquirySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      const nameInput =
        document.getElementById('firstName') ||
        document.getElementById('inquiry-first-name-input') ||
        document.getElementById('inquiry-name-input');
      if (nameInput) {
        nameInput.focus();
      }
    }, 400);
  };

  const scrollToTrack = () => {
    trackSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      const refInput = document.getElementById('tracking-reference-input');
      if (refInput) {
        refInput.focus();
      }
    }, 400);
  };

  const handleInquirySuccess = (res: LeadInquiryResponse) => {
    setTrackRef(res.reference_number);
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackRef.trim() || !trackEmail.trim()) {
      setTrackError(
        String(
          t('pages.home.tracker.provideBothError', {
            defaultValue: 'Please provide both your Application Reference Number and registered Email.',
          })
        )
      );
      return;
    }

    setIsTracking(true);
    setTrackError(null);
    setTrackResult(null);

    try {
      const res = await applicationService.trackApplication(trackRef.trim(), trackEmail.trim());
      setTrackResult(res);
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        String(
          t('pages.home.tracker.notFoundError', {
            defaultValue:
              'No matching enquiry found. Please verify your reference number and registered email address.',
          })
        );
      setTrackError(errMsg);
    } finally {
      setIsTracking(false);
    }
  };

  const handleFaqChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedFaq(isExpanded ? panel : false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', border: '#10B981' };
      case 'exported':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#2563EB', border: '#3B82F6' };
      case 'submitted':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#D97706', border: '#F59E0B' };
      default:
        return { bg: 'rgba(100, 116, 139, 0.15)', text: '#475569', border: '#94A3B8' };
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
      {/* =========================================================================
          1. HERO SECTION
          ========================================================================= */}
      <Box
        sx={{
          textAlign: 'center',
          maxWidth: 880,
          mx: 'auto',
          mb: { xs: 6, md: 9 },
        }}
      >
        {/* Role & Compliance Badge */}
        <Chip
          icon={<VerifiedUserOutlined sx={{ fontSize: 16 }} />}
          label={t('pages.home.roleBadge', {
            defaultValue: 'Czech Foreigners Health Insurance Enquiry • Official Introducer (Tipař)',
          })}
          sx={{
            mb: 3,
            px: 1.5,
            py: 0.5,
            fontSize: '0.825rem',
            fontWeight: 650,
            background:
              theme.palette.mode === 'light'
                ? 'rgba(79, 70, 229, 0.08)'
                : 'rgba(129, 140, 248, 0.12)',
            color: 'primary.main',
            border:
              theme.palette.mode === 'light'
                ? '1px solid rgba(79, 70, 229, 0.2)'
                : '1px solid rgba(129, 140, 248, 0.25)',
            borderRadius: '20px',
          }}
        />

        {/* Main Title */}
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 850,
            fontSize: { xs: '2.1rem', sm: '3.1rem', md: '3.75rem' },
            letterSpacing: '-0.035em',
            lineHeight: 1.15,
            mb: 2.5,
            background:
              theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, #0F172A 20%, #4F46E5 100%)'
                : 'linear-gradient(135deg, #F8FAFC 20%, #A5B4FC 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t('pages.home.title', {
            defaultValue: 'Health Insurance Enquiry for International Students in Czechia',
          })}
        </Typography>

        {/* Subtitle */}
        <Typography
          variant="h5"
          color="text.secondary"
          paragraph
          sx={{
            fontSize: { xs: '1.05rem', sm: '1.25rem' },
            lineHeight: 1.6,
            maxWidth: 760,
            mx: 'auto',
            mb: 4,
            fontWeight: 400,
          }}
        >
          {t('pages.home.subtitle', {
            defaultValue:
              'Tell us your basic requirements. We’ll securely forward your enquiry to our insurance intermediary partner (České pojištění a.s.), who will prepare available options and tailored pricing.',
          })}
        </Typography>

        {/* CTA Button Group */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardOutlined />}
            onClick={scrollToInquiry}
            sx={{
              px: 4.5,
              py: 1.6,
              fontSize: '1.05rem',
              fontWeight: 750,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(79, 70, 229, 0.35)',
              textTransform: 'none',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 28px rgba(79, 70, 229, 0.45)',
              },
            }}
          >
            {t('pages.home.requestOptions', { defaultValue: 'Request Insurance Options' })}
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<SearchOutlined />}
            onClick={scrollToTrack}
            sx={{
              px: 3.5,
              py: 1.5,
              fontSize: '0.95rem',
              fontWeight: 650,
              borderRadius: '12px',
              borderWidth: '1.5px',
              textTransform: 'none',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderWidth: '1.5px',
                transform: 'translateY(-2px)',
              },
            }}
          >
            {t('pages.home.trackMyApplication', { defaultValue: 'Track My Application' })}
          </Button>
        </Stack>

        {/* Footnote Disclaimers */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: 4, fontSize: '0.82rem' }}
        >
          {t('pages.home.partnerDisclaimerFootnote', {
            defaultValue:
              'Insurance products and regulated insurance services are handled by our intermediary partner (České pojištění a.s.).',
          })}
        </Typography>

        {/* Value Metrics Row */}
        <Grid container spacing={2} sx={{ mb: 4, maxWidth: 740, mx: 'auto' }}>
          {[
            {
              value: 'Act 326/1999',
              label: t('pages.home.metrics.actCompliance', { defaultValue: 'Czech OAMP Compliant Standards' }),
            },
            {
              value: '< 2 Min',
              label: t('pages.home.metrics.rapidApp', { defaultValue: 'Rapid Online Enquiry' }),
            },
            {
              value: 'AES-256 GCM',
              label: t('pages.home.metrics.bankPrivacy', { defaultValue: 'Encrypted Lead Forwarding' }),
            },
          ].map((metric, i) => (
            <Grid item xs={4} key={i}>
              <Box
                sx={{
                  py: 1.8,
                  px: 1.2,
                  borderRadius: '14px',
                  backgroundColor:
                    theme.palette.mode === 'light'
                      ? 'rgba(255, 255, 255, 0.8)'
                      : 'rgba(255, 255, 255, 0.03)',
                  border:
                    theme.palette.mode === 'light'
                      ? '1px solid rgba(15, 23, 42, 0.06)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(8px)',
                  boxShadow:
                    theme.palette.mode === 'light'
                      ? '0 2px 10px rgba(0, 0, 0, 0.03)'
                      : '0 2px 10px rgba(0, 0, 0, 0.3)',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '0.92rem', sm: '1.15rem' },
                    color: 'primary.main',
                  }}
                >
                  {metric.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 550 }}>
                  {metric.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Security badges */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.2, sm: 4 }}
          justifyContent="center"
          alignItems="center"
          sx={{ color: 'text.secondary', fontSize: '0.85rem' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <LockOutlined sx={{ fontSize: 18, color: 'success.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 550 }}>
              {t('pages.home.securityBadges.endToEnd', { defaultValue: 'AES-256-GCM Encrypted Storage' })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <SpeedOutlined sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 550 }}>
              {t('pages.home.securityBadges.autoEmail', {
                defaultValue: 'Automatic Reference & Status Tracking',
              })}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* =========================================================================
          2. 3-STEP STREAMLINED PROCESS (HOW IT WORKS)
          ========================================================================= */}
      <Box sx={{ mb: { xs: 8, md: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: 4.5 }}>
          <Chip
            label={t('pages.home.howItWorks.badge', { defaultValue: 'How It Works' })}
            size="small"
            sx={{
              fontWeight: 700,
              mb: 1.5,
              backgroundColor:
                theme.palette.mode === 'light' ? 'rgba(79, 70, 229, 0.08)' : 'rgba(129, 140, 248, 0.15)',
              color: 'primary.main',
            }}
          />
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', sm: '2.1rem' }, mb: 1 }}>
            {t('pages.home.howItWorks.title', { defaultValue: 'Simple 3-Step Insurance Enquiry' })}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto', fontSize: '0.95rem' }}>
            {t('pages.home.howItWorks.subtitle', {
              defaultValue:
                'Transparent, fast, and fully compliant with Czech foreigners residency insurance requirements.',
            })}
          </Typography>
        </Box>

        <Grid container spacing={3} alignItems="stretch">
          {[
            {
              step: '01',
              icon: <AssignmentOutlined sx={{ fontSize: 30, color: '#4F46E5' }} />,
              title: t('pages.home.howItWorks.step1Title', { defaultValue: '1. Submit Stay Parameters' }),
              description: t('pages.home.howItWorks.step1Desc', {
                defaultValue:
                  'Select your stay dates, university, and age bracket. Takes under 2 minutes with zero paper hassles.',
              }),
              colorBg: 'rgba(79, 70, 229, 0.08)',
              chipColor: '#4F46E5',
            },
            {
              step: '02',
              icon: <SupportAgentOutlined sx={{ fontSize: 30, color: '#059669' }} />,
              title: t('pages.home.howItWorks.step2Title', { defaultValue: '2. Advisor Review & Quotation' }),
              description: t('pages.home.howItWorks.step2Desc', {
                defaultValue:
                  'Encrypted transfer to licensed broker České pojištění a.s., who compares accredited underwriters and student discounts.',
              }),
              colorBg: 'rgba(16, 185, 129, 0.08)',
              chipColor: '#059669',
            },
            {
              step: '03',
              icon: <ShieldOutlined sx={{ fontSize: 30, color: '#D97706' }} />,
              title: t('pages.home.howItWorks.step3Title', { defaultValue: '3. Receive Official Certificate' }),
              description: t('pages.home.howItWorks.step3Desc', {
                defaultValue:
                  'Upon confirming your preferred option and payment, receive your official Potvrzení o pojištění directly for visa submission.',
              }),
              colorBg: 'rgba(245, 158, 11, 0.08)',
              chipColor: '#D97706',
            },
          ].map((item, idx) => (
            <Grid item xs={12} md={4} key={idx} sx={{ display: 'flex' }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, sm: 3.5 },
                  width: '100%',
                  borderRadius: '20px',
                  backgroundColor:
                    theme.palette.mode === 'light'
                      ? 'rgba(255, 255, 255, 0.85)'
                      : 'rgba(30, 41, 59, 0.5)',
                  border:
                    theme.palette.mode === 'light'
                      ? '1px solid rgba(226, 232, 240, 0.9)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow:
                      theme.palette.mode === 'light'
                        ? '0 12px 30px -6px rgba(79, 70, 229, 0.12)'
                        : '0 12px 30px -6px rgba(0, 0, 0, 0.6)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        p: 1.25,
                        borderRadius: '12px',
                        backgroundColor: item.colorBg,
                        display: 'inline-flex',
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Chip
                      label={item.step}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        backgroundColor: item.colorBg,
                        color: item.chipColor,
                        borderRadius: '8px',
                      }}
                    />
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.2, fontSize: '1.15rem' }}>
                    {item.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.65, fontSize: '0.88rem' }}
                  >
                    {item.description}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* =========================================================================
          3. MAIN LEAD INTAKE FORM SECTION
          ========================================================================= */}
      <Box ref={inquirySectionRef} id="inquiry-form-section" sx={{ mb: { xs: 8, md: 10 } }}>
        <LeadInquiryForm onSuccess={handleInquirySuccess} />
      </Box>

      {/* =========================================================================
          4. USEFUL FAQ SECTION (FREQUENTLY ASKED QUESTIONS)
          ========================================================================= */}
      <Box sx={{ mb: { xs: 8, md: 10 }, maxWidth: 860, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4.5 }}>
          <Chip
            icon={<HelpOutline sx={{ fontSize: 16 }} />}
            label={t('pages.support.badge', { defaultValue: 'Frequently Asked Questions' })}
            size="small"
            sx={{
              fontWeight: 700,
              mb: 1.5,
              backgroundColor:
                theme.palette.mode === 'light' ? 'rgba(79, 70, 229, 0.08)' : 'rgba(129, 140, 248, 0.15)',
              color: 'primary.main',
            }}
          />
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', sm: '2.1rem' }, mb: 1 }}>
            {t('pages.support.faqTitle', { defaultValue: 'Frequently Asked Questions' })}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto', fontSize: '0.95rem' }}>
            {t('pages.support.faqSubtitle', {
              defaultValue: 'Quick answers regarding foreign insurance requirements in the Czech Republic.',
            })}
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          {[
            {
              id: 'faq-1',
              q: t('pages.support.faqs.q1', {
                defaultValue: 'How fast will I receive my official insurance certificate after submission?',
              }),
              a: t('pages.support.faqs.a1', {
                defaultValue:
                  'Standard electronic policy certificates (Potvrzení o pojištění) are generated within 1 to 4 business hours after underwriting review and payment confirmation. You will receive the certified PDF directly to your email, complete with the contract number for your Czech visa application.',
              }),
            },
            {
              id: 'faq-2',
              q: t('pages.support.faqs.q2', {
                defaultValue: 'Are your policies 100% accepted by the Czech Ministry of Interior (OAMP)?',
              }),
              a: t('pages.support.faqs.a2', {
                defaultValue:
                  'Yes. Comprehensive health insurance options distributed by our licensed intermediary partner České pojištění a.s. strictly comply with the Foreigners Residence Act (Act No. 326/1999 Coll.) and OAMP requirements with statutory limits up to 400,000 EUR.',
              }),
            },
            {
              id: 'faq-3',
              q: t('pages.support.faqs.q3', {
                defaultValue: 'What should I do if my visa application is refused by the Embassy?',
              }),
              a: t('pages.support.faqs.a3', {
                defaultValue:
                  'If your visa or residence permit is denied, you are entitled to a refund pursuant to carrier cancellation terms. Simply send a copy of the official OAMP/Embassy refusal document to insurance@hktse.eu.org, and our team will process the policy cancellation and refund.',
              }),
            },
            {
              id: 'faq-4',
              q: t('pages.support.faqs.q4', {
                defaultValue: 'How does medical claim reimbursement and direct billing work in Czechia?',
              }),
              a: t('pages.support.faqs.a4', {
                defaultValue:
                  'For hospitals and clinics contracted with your underwriter (e.g. Motol, FNKV, VFN in Prague, or FN Brno), you simply show your physical or digital insurance card for direct cashless billing. For non-contracted facilities, pay the invoice, obtain the medical report, and submit it for prompt reimbursement within 14 days.',
              }),
            },
            {
              id: 'faq-5',
              q: t('pages.support.faqs.q5', {
                defaultValue: 'What details are required to submit an insurance enquiry?',
              }),
              a: t('pages.support.faqs.a5', {
                defaultValue:
                  'FormVault only collects your stay parameters (duration, start date, student status, age bracket) and basic contact information. Identity document scans and passport numbers are NOT collected during initial lead intake.',
              }),
            },
          ].map((item) => (
            <Accordion
              key={item.id}
              expanded={expandedFaq === item.id}
              onChange={handleFaqChange(item.id)}
              elevation={0}
              sx={{
                borderRadius: '16px !important',
                border:
                  theme.palette.mode === 'light'
                    ? '1px solid rgba(226, 232, 240, 0.9)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor:
                  theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(30, 41, 59, 0.45)',
                '&:before': { display: 'none' },
                transition: 'all 0.2s ease',
                '&.Mui-expanded': {
                  borderColor: 'primary.main',
                  boxShadow:
                    theme.palette.mode === 'light'
                      ? '0 6px 20px -2px rgba(79, 70, 229, 0.08)'
                      : '0 6px 20px -2px rgba(0, 0, 0, 0.4)',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreOutlined sx={{ color: 'primary.main' }} />}
                sx={{
                  px: 3,
                  py: 1.5,
                  '& .MuiAccordionSummary-content': { my: 0.5 },
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 750, fontSize: '1rem' }}>
                  {item.q}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pt: 0, pb: 2.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: '0.92rem' }}>
                  {item.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            variant="text"
            size="small"
            startIcon={<ContactSupportOutlined />}
            onClick={() => navigate('/support')}
            sx={{ fontWeight: 650, textTransform: 'none', fontSize: '0.88rem' }}
          >
            {t('pages.home.tracker.supportNote', {
              defaultValue: 'Need assistance with your insurance enquiry or visa documents? Visit Help Center',
            })}
          </Button>
        </Box>
      </Box>

      {/* =========================================================================
          5. COMPACT DUAL-FACTOR APPLICATION / ENQUIRY STATUS TRACKER
          ========================================================================= */}
      <Box ref={trackSectionRef} id="track-status" sx={{ mb: { xs: 8, md: 10 } }}>
        <Card
          sx={{
            maxWidth: 860,
            mx: 'auto',
            borderRadius: '24px',
            border:
              theme.palette.mode === 'light'
                ? '1px solid rgba(79, 70, 229, 0.2)'
                : '1px solid rgba(129, 140, 248, 0.25)',
            boxShadow:
              theme.palette.mode === 'light'
                ? '0 16px 40px -8px rgba(79, 70, 229, 0.12)'
                : '0 20px 48px -12px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              p: { xs: 3, sm: 4 },
              background:
                theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(248, 250, 252, 0.8) 100%)'
                  : 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  backgroundColor: 'primary.main',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SearchOutlined fontSize="small" />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {t('pages.home.tracker.title', { defaultValue: 'Track Enquiry Status' })}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('pages.home.tracker.subtitle', {
                defaultValue:
                  'Enter your reference number and registered email address to check real-time forwarding and handling status.',
              })}
            </Typography>

            {/* Tracking Form */}
            <form onSubmit={handleTrackSubmit}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={5}>
                  <TextField
                    id="tracking-reference-input"
                    fullWidth
                    label={String(t('pages.home.tracker.refLabel', { defaultValue: 'Reference Number' }))}
                    placeholder={String(t('pages.home.tracker.refPlaceholder', { defaultValue: 'e.g. APP-2026-001234' }))}
                    value={trackRef}
                    onChange={(e) => setTrackRef(e.target.value.toUpperCase())}
                    disabled={isTracking}
                    size="medium"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label={String(t('pages.home.tracker.emailLabel', { defaultValue: 'Registered Email' }))}
                    placeholder={String(t('pages.home.tracker.emailPlaceholder', { defaultValue: 'e.g. client@example.com' }))}
                    type="email"
                    value={trackEmail}
                    onChange={(e) => setTrackEmail(e.target.value)}
                    disabled={isTracking}
                    size="medium"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isTracking}
                    sx={{
                      height: 54,
                      fontWeight: 700,
                      borderRadius: '10px',
                      textTransform: 'none',
                    }}
                  >
                    {isTracking ? <CircularProgress size={24} color="inherit" /> : t('pages.home.tracker.trackButton', { defaultValue: 'Track' })}
                  </Button>
                </Grid>
              </Grid>
            </form>

            {trackError && (
              <Alert severity="error" sx={{ mt: 2.5, borderRadius: '12px' }}>
                {trackError}
              </Alert>
            )}

            {/* Tracking Result Display */}
            {trackResult && (
              <Box
                sx={{
                  mt: 3.5,
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: '16px',
                  backgroundColor:
                    theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(79, 70, 229, 0.15)',
                }}
              >
                {/* Result Header */}
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2.5,
                    pb: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('pages.home.tracker.refLabel', { defaultValue: 'Reference Number' })}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                      {trackResult.reference_number}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={trackResult.status_label || trackResult.status}
                      sx={{
                        fontWeight: 700,
                        backgroundColor: getStatusColor(trackResult.status).bg,
                        color: getStatusColor(trackResult.status).text,
                        border: `1px solid ${getStatusColor(trackResult.status).border}`,
                      }}
                    />
                    <Chip
                      label={`${trackResult.insurance_type} Insurance`}
                      variant="outlined"
                      size="small"
                    />
                  </Stack>
                </Box>

                {/* Masked Applicant Details */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      {t('pages.home.tracker.applicantName', { defaultValue: 'Applicant Name' })}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {trackResult.masked_name || t('pages.home.tracker.protected', { defaultValue: 'Protected' })}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      {t('pages.home.tracker.registeredEmail', { defaultValue: 'Registered Email' })}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {trackResult.masked_email || t('pages.home.tracker.protected', { defaultValue: 'Protected' })}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      {t('pages.home.tracker.lastUpdated', { defaultValue: 'Last Updated' })}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {trackResult.updated_at
                        ? new Date(trackResult.updated_at).toLocaleString()
                        : t('pages.home.tracker.recently', { defaultValue: 'Recently' })}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ mb: 3 }} />

                {/* Visual Timeline Progression */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  {t('pages.home.tracker.timelineTitle', { defaultValue: 'Application Processing Timeline' })}
                </Typography>

                <Stack spacing={2}>
                  {trackResult.timeline?.map((step) => (
                    <Box
                      key={step.key}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                        position: 'relative',
                      }}
                    >
                      <Box sx={{ mt: 0.2 }}>
                        {step.completed ? (
                          <CheckCircleOutline sx={{ color: '#10B981', fontSize: 22 }} />
                        ) : step.current ? (
                          <RadioButtonChecked sx={{ color: '#4F46E5', fontSize: 22 }} />
                        ) : (
                          <RadioButtonUnchecked sx={{ color: 'text.disabled', fontSize: 22 }} />
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: step.completed || step.current ? 700 : 500,
                              color:
                                step.completed || step.current ? 'text.primary' : 'text.secondary',
                            }}
                          >
                            {step.label}
                          </Typography>
                          {step.current && (
                            <Chip
                              label={t('pages.home.tracker.currentStage', { defaultValue: 'Current Stage' })}
                              size="small"
                              color="primary"
                              sx={{ height: 20, fontSize: '0.675rem', fontWeight: 700 }}
                            />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {step.description}
                        </Typography>
                      </Box>
                      {step.timestamp && (
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {new Date(step.timestamp).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </Card>
      </Box>

      {/* =========================================================================
          6. STATUTORY COMPLIANCE & PARTNER TRANSPARENCY SECTION
          ========================================================================= */}
      <Box sx={{ mb: { xs: 8, md: 10 } }}>
        {/* Informational / Regulatory Notice Banner (Moved down to compliance area) */}
        {banner && bannerVisible && (
          <Paper
            elevation={0}
            sx={{
              position: 'relative',
              mb: 4,
              p: { xs: 2.5, sm: 3 },
              pr: { xs: 5, sm: 6 },
              borderRadius: '20px',
              background:
                theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.07) 0%, rgba(124, 58, 237, 0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(79, 70, 229, 0.18) 0%, rgba(124, 58, 237, 0.1) 100%)',
              border: '1px solid rgba(79, 70, 229, 0.22)',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: { xs: 1.5, md: 2.5 },
              boxShadow: '0 4px 20px -2px rgba(79, 70, 229, 0.06)',
            }}
          >
            {/* Top-Right Close Button */}
            <IconButton
              size="small"
              onClick={() => setBannerVisible(false)}
              aria-label={String(t('common.close', { defaultValue: 'Close' }))}
              sx={{
                position: 'absolute',
                top: { xs: 8, sm: 10 },
                right: { xs: 8, sm: 10 },
                color: 'text.secondary',
                '&:hover': { color: 'text.primary' },
              }}
            >
              <CloseOutlined fontSize="small" />
            </IconButton>

            {/* Left Text Block */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: '12px',
                  backgroundColor: 'rgba(79, 70, 229, 0.14)',
                  color: 'primary.main',
                  display: { xs: 'none', sm: 'flex' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                <CampaignOutlined fontSize="small" />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <Chip
                    label={
                      banner.id === 1 && (banner.tag === 'Regulatory Notice' || !banner.tag)
                        ? t('pages.home.banner.defaultTag', { defaultValue: 'Regulatory Notice' })
                        : banner.tag || t('pages.home.banner.notice', { defaultValue: 'Notice' })
                    }
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: 22,
                      backgroundColor: 'primary.main',
                      color: '#FFFFFF',
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    component="span"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '0.92rem', sm: '1rem' },
                      lineHeight: 1.45,
                      color: 'text.primary',
                      wordBreak: 'break-word',
                    }}
                  >
                    {banner.id === 1 && banner.title.includes('Czech Foreigners Residence Act')
                      ? t('pages.home.banner.defaultTitle', { defaultValue: banner.title })
                      : banner.title}
                  </Typography>
                </Box>
                {banner.subtitle && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.82rem', sm: '0.875rem' },
                      lineHeight: 1.6,
                      wordBreak: 'break-word',
                    }}
                  >
                    {banner.id === 1 && banner.subtitle.includes('Foreign nationals applying for Czech long-term visas')
                      ? t('pages.home.banner.defaultSubtitle', { defaultValue: banner.subtitle })
                      : banner.subtitle}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Action Button */}
            <Box
              sx={{
                alignSelf: { xs: 'flex-start', md: 'center' },
                flexShrink: 0,
                mt: { xs: 0.5, md: 0 },
              }}
            >
              <Button
                variant="contained"
                size="small"
                onClick={scrollToInquiry}
                sx={{
                  px: 2.4,
                  py: 0.8,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  textTransform: 'none',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                }}
              >
                {t('pages.home.banner.defaultButton', { defaultValue: 'Request Options' })}
              </Button>
            </Box>
          </Paper>
        )}

        {/* Licensed Intermediary Partner Transparency Card */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4.5 },
            borderRadius: '24px',
            backgroundColor:
              theme.palette.mode === 'light' ? 'rgba(248, 250, 252, 0.95)' : 'rgba(15, 23, 42, 0.8)',
            border:
              theme.palette.mode === 'light'
                ? '1px solid rgba(79, 70, 229, 0.15)'
                : '1px solid rgba(129, 140, 248, 0.2)',
          }}
        >
          <Grid container spacing={3.5} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                label={t('pages.home.partnerIntermediary.badge', {
                  defaultValue: 'Statutory Cooperation • Licensed Intermediary',
                })}
                size="small"
                sx={{
                  mb: 1.5,
                  fontWeight: 700,
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#059669',
                }}
              />
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5, fontSize: { xs: '1.5rem', sm: '1.9rem' } }}>
                {t('pages.home.partnerIntermediary.title', {
                  defaultValue: 'Cooperation with Licensed Insurance Intermediary',
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, fontSize: '0.9rem', mb: 2 }}>
                {t('pages.home.partnerIntermediary.disclosure', {
                  defaultValue:
                    'FormVault is operated by HKTSE s.r.o. under a cooperation agreement with České pojištění a.s. HKTSE collects basic insurance enquiries and contact details and forwards them to České pojištění a.s. HKTSE is not an insurance company or insurance intermediary. Insurance advice, product offers and regulated insurance distribution are handled by České pojištění a.s.',
                })}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                <Link
                  href="https://hktse.eu.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  HKTSE s.r.o. (IČO: 10858032) <OpenInNewOutlined sx={{ fontSize: 14 }} />
                </Link>
                <Link
                  href="https://ceskepojisteni.cz/"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    color: 'primary.main',
                  }}
                >
                  České pojištění a.s. (IČO: 07963363) <OpenInNewOutlined sx={{ fontSize: 14 }} />
                </Link>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <SupportAgentOutlined sx={{ color: 'primary.main', fontSize: 28 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {t('pages.home.partnerIntermediary.partnerCardTitle', {
                        defaultValue: 'České pojištění a.s.',
                      })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('pages.home.partnerIntermediary.partnerRole', {
                        defaultValue: 'Licensed Insurance Intermediary (Makléř)',
                      })}
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.825rem', lineHeight: 1.6 }}>
                  {t('pages.home.partnerIntermediary.partnerDesc', {
                    defaultValue:
                      'Registered intermediary regulated under Czech National Bank (ČNB) supervision, authorized to distribute comprehensive foreigners health insurance and provide professional policy advice.',
                  })}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* =========================================================================
          7. SECURITY & ARCHITECTURE FEATURE CARDS
          ========================================================================= */}
      <Grid container spacing={2.5} sx={{ mb: 2 }}>
        {(customFeatures && customFeatures.length > 0
          ? customFeatures.map((item) => ({
              icon: <SecurityOutlined sx={{ fontSize: 24, color: '#4F46E5' }} />,
              badge: item.badge || 'Verified',
              title: item.title_key ? t(item.title_key, { defaultValue: item.title || '' }) : item.title || '',
              description: item.desc_key ? t(item.desc_key, { defaultValue: item.description || '' }) : item.description || '',
              gradient: item.gradient || 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%)',
            }))
          : [
              {
                icon: <SecurityOutlined sx={{ fontSize: 24, color: '#4F46E5' }} />,
                badge: 'AES-256 GCM',
                title: t('pages.home.features.secure', { defaultValue: 'AES-256-GCM Secure Data Vault' }),
                description: t('pages.home.features.secureDesc', {
                  defaultValue:
                    'Authenticated symmetric encryption with per-document nonces and cryptographic key derivation to protect customer enquiry data.',
                }),
                gradient: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%)',
              },
              {
                icon: <LanguageOutlined sx={{ fontSize: 24, color: '#059669' }} />,
                badge: '12 Languages',
                title: t('pages.home.features.multilingual', { defaultValue: 'Multilingual Chinese & English Support' }),
                description: t('pages.home.features.multilingualDesc', {
                  defaultValue:
                    'Seamless cross-border communication designed to assist international students and expatriates relocating to the Czech Republic.',
                }),
                gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.12) 100%)',
              },
              {
                icon: <AssignmentOutlined sx={{ fontSize: 24, color: '#D97706' }} />,
                badge: 'Tamper-Evident',
                title: t('pages.home.features.audit', { defaultValue: 'Tamper-Evident Audit Trail' }),
                description: t('pages.home.features.auditDesc', {
                  defaultValue:
                    'Cryptographically hashed timeline records each stage of enquiry handoff and intermediary consultation with zero data ambiguity.',
                }),
                gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.12) 100%)',
              },
            ]
        ).map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                p: { xs: 2.2, sm: 2.5 },
                borderRadius: '16px',
                backgroundColor:
                  theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.55)' : 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                border:
                  theme.palette.mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(226, 232, 240, 0.85)',
                transition: 'all 0.25s ease-in-out',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  borderColor: 'primary.main',
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '0 8px 24px -4px rgba(0, 0, 0, 0.5)'
                      : '0 8px 24px -4px rgba(79, 70, 229, 0.12)',
                },
              }}
            >
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: '10px',
                      background: feature.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  {feature.badge && (
                    <Chip
                      label={feature.badge}
                      size="small"
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 750,
                        letterSpacing: '0.02em',
                        borderRadius: '6px',
                        height: 22,
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'rgba(79, 70, 229, 0.08)',
                        color: theme.palette.mode === 'dark' ? '#E2E8F0' : '#4338CA',
                      }}
                    />
                  )}
                </Stack>
                <Typography variant="subtitle1" sx={{ fontWeight: 750, fontSize: '1.05rem', mb: 0.6 }}>
                  {feature.title}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ lineHeight: 1.55, display: 'block', fontSize: '0.82rem' }}
                >
                  {feature.description}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default HomePage;
