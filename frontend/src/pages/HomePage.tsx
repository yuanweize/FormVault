import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Grid,
  Card,
  CardContent,
  Container,
  Chip,
  Stack,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Link,
  useTheme,
} from '@mui/material';
import {
  SecurityOutlined,
  LanguageOutlined,
  PhoneAndroidOutlined,
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
  LocalHospitalOutlined,
  SchoolOutlined,
  FlightTakeoffOutlined,
  CampaignOutlined,
  CloseOutlined,
  InfoOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  applicationService,
  TrackApplicationResponse,
  PortalShowcaseResponse,
  InsuranceCompanyShowcase,
  InsurancePlanShowcase,
  AgencyBannerShowcase,
} from '../services/applicationService';

// Default Czech Republic fallback broker data (strictly authentic partners & verified pricing)
const DEFAULT_CZECH_COMPANIES: InsuranceCompanyShowcase[] = [
  {
    id: 1,
    name: 'PVZP (Pojišťovna VZP)',
    code: 'PVZP',
    rating: 'Top Market Leader / 5,000+ Contracted Clinics',
    website: 'https://www.pvzp.cz',
    description: 'Premier Czech insurer for foreigners with the largest medical provider network and pre-existing conditions coverage options.',
    display_order: 1,
  },
  {
    id: 2,
    name: 'Slavia Pojišťovna',
    code: 'SLAVIA',
    rating: 'Best Value / Backdated Coverage Allowed',
    website: 'https://www.slavia-pojistovna.cz',
    description: 'Heritage Czech insurer established in 1868, offering cost-effective comprehensive policies with up to 3 months backdating.',
    display_order: 2,
  },
  {
    id: 3,
    name: 'SV Pojišťovna (formerly ERGO)',
    code: 'SV',
    rating: 'Client Favorite / Rapid Digital Settlement',
    website: 'https://www.sv-pojistovna.cz',
    description: 'Renowned for competitive student premiums, streamlined underwriting with no special questionnaires for healthy clients.',
    display_order: 3,
  },
];

const DEFAULT_CZECH_PLANS: InsurancePlanShowcase[] = [
  {
    id: 1,
    company_id: 1,
    company_name: 'PVZP',
    company_code: 'PVZP',
    name: 'PVZP Komplexní PLUS (Student 15-30 let)',
    category: 'Comprehensive Health',
    price_amount: 12978,
    currency: 'CZK',
    billing_period: 'year',
    coverage_summary: '10,000,000 CZK (~400,000 EUR) medical limit with 5,000+ contracted medical facilities across the Czech Republic.',
    badge: 'Top Authority',
    target_audience: 'University Students (15-30 yrs) & OAMP Applicants',
    features: 'Czech OAMP visa certified\nDirect hospital billing (Motol, FNKV, VFN)\n10,000,000 CZK comprehensive limit\nPre-existing condition coverage eligible',
    is_featured: true,
    display_order: 1,
  },
  {
    id: 2,
    company_id: 2,
    company_name: 'Slavia',
    company_code: 'SLAVIA',
    name: 'Slavia KZPC 131 Komplexní (Student 15-35 let)',
    category: 'Student Special',
    price_amount: 11200,
    currency: 'CZK',
    billing_period: 'year',
    coverage_summary: 'High-value comprehensive medical care with +2 extra months free promotional discount and up to 3 months backdating.',
    badge: 'Best Value (+2 Mo Free)',
    target_audience: 'Students (15-35 yrs) & Visa Applicants',
    features: 'Act No. 326/1999 Coll. fully certified\n+2 extra months free included\nBackdating permitted up to 3 months\nEmergency dental & prescription drugs covered',
    is_featured: true,
    display_order: 2,
  },
  {
    id: 3,
    company_id: 3,
    company_name: 'SV',
    company_code: 'SV',
    name: 'SV WELCOME Komplex (Student 16-26 let)',
    category: 'Comprehensive Health',
    price_amount: 11214,
    currency: 'CZK',
    billing_period: 'year',
    coverage_summary: 'Highly competitive premium rate with top client satisfaction and straightforward claims processing.',
    badge: 'Competitive Student Rate',
    target_audience: 'Foreign Students (16-26 yrs) & Scholars',
    features: 'Official OAMP long-term visa certified\nCompetitive student annual fee\nNo special medical form needed for standard applicants\n24/7 multilingual medical hotline',
    is_featured: true,
    display_order: 3,
  },
  {
    id: 4,
    company_id: 1,
    company_name: 'PVZP',
    company_code: 'PVZP',
    name: 'PVZP Komplexní EXCLUSIVE (Standard Adult)',
    category: 'VIP Comprehensive',
    price_amount: 18540,
    currency: 'CZK',
    billing_period: 'year',
    coverage_summary: 'Premium medical security for adults, working professionals, trade license holders (Živnostenský list) and families.',
    badge: 'Exclusive Care',
    target_audience: 'Working Professionals & Expatriates',
    features: '10,000,000 CZK medical limit per event\nEnhanced outpatient medication & dental\nDirect cashless billing in top private hospitals\nFree Schengen travel rider included',
    is_featured: false,
    display_order: 4,
  },
];

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const trackSectionRef = useRef<HTMLDivElement>(null);

  // Showcase state
  const [companies, setCompanies] = useState<InsuranceCompanyShowcase[]>(DEFAULT_CZECH_COMPANIES);
  const [plans, setPlans] = useState<InsurancePlanShowcase[]>(DEFAULT_CZECH_PLANS);
  const [banner, setBanner] = useState<AgencyBannerShowcase | null>({
    id: 1,
    title: 'Czech Foreigners Residence Act (326/1999 Coll.) Compliant Insurance',
    subtitle: 'All insurance certificates issued through our agency meet the latest OAMP Czech Ministry requirements for Long-Term Visa and Residence Permit applications.',
    tag: 'Regulatory Notice',
    button_text: 'Apply Online',
    display_order: 1,
  });
  const [bannerVisible, setBannerVisible] = useState(true);

  // Tracking form state
  const [trackRef, setTrackRef] = useState('');
  const [trackEmail, setTrackEmail] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackResult, setTrackResult] = useState<TrackApplicationResponse | null>(null);

  useEffect(() => {
    // Fetch live showcase data from API
    const loadShowcase = async () => {
      try {
        const data: PortalShowcaseResponse = await applicationService.getPortalShowcase();
        if (data.success) {
          if (data.companies && data.companies.length > 0) {
            setCompanies(data.companies);
          }
          if (data.plans && data.plans.length > 0) {
            setPlans(data.plans);
          }
          if (data.banners && data.banners.length > 0) {
            setBanner(data.banners[0]);
          }
        }
      } catch (err) {
        // Retain default templates gracefully
      }
    };
    loadShowcase();
  }, []);

  const handleGetStarted = (presetInsuranceType?: string) => {
    if (presetInsuranceType) {
      sessionStorage.setItem('preferred_insurance_type', presetInsuranceType);
    }
    navigate('/personal-info');
  };

  const scrollToTrack = () => {
    trackSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const refInput = document.getElementById('tracking-reference-input');
    if (refInput) {
      refInput.focus();
    }
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackRef.trim() || !trackEmail.trim()) {
      setTrackError(
        t('pages.home.tracker.provideBothError', {
          defaultValue: 'Please provide both your Application Reference Number and registered Email.',
        })
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
        t('pages.home.tracker.notFoundError', {
          defaultValue:
            'No matching application found. Please verify your reference number and registered email address.',
        });
      setTrackError(errMsg);
    } finally {
      setIsTracking(false);
    }
  };

  const getPlanCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('student')) return <SchoolOutlined sx={{ fontSize: 28, color: '#4F46E5' }} />;
    if (c.includes('travel') || c.includes('schengen')) return <FlightTakeoffOutlined sx={{ fontSize: 28, color: '#059669' }} />;
    return <LocalHospitalOutlined sx={{ fontSize: 28, color: '#2563EB' }} />;
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
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      {/* 1. Regulatory / Agency Announcement Banner */}
      {banner && bannerVisible && (
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            mb: { xs: 3, md: 5 },
            p: { xs: 2, sm: 2.5 },
            pr: { xs: 5, sm: 6 },
            borderRadius: '16px',
            background:
              theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.05) 100%)'
                : 'linear-gradient(135deg, rgba(79, 70, 229, 0.2) 0%, rgba(124, 58, 237, 0.12) 100%)',
            border: '1px solid rgba(79, 70, 229, 0.25)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 1.5, md: 2.5 },
            boxShadow: '0 4px 20px -2px rgba(79, 70, 229, 0.08)',
          }}
        >
          {/* Top-Right Close Button */}
          <IconButton
            size="small"
            onClick={() => setBannerVisible(false)}
            aria-label={String(t('common.close', 'Close'))}
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
                p: 1,
                borderRadius: '10px',
                backgroundColor: 'rgba(79, 70, 229, 0.15)',
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
                  {banner.id === 1 && banner.subtitle.includes('All insurance certificates issued through our agency meet')
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
              onClick={() => handleGetStarted('health')}
              sx={{
                px: 2.2,
                py: 0.7,
                fontSize: '0.82rem',
                fontWeight: 700,
                borderRadius: '8px',
                whiteSpace: 'nowrap',
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
              }}
            >
              {banner.id === 1 && (banner.button_text === 'Apply Online' || banner.button_text === 'Apply Now')
                ? t('pages.home.banner.defaultButton', { defaultValue: 'Apply Online' })
                : banner.button_text || t('pages.home.banner.learnMore', { defaultValue: 'Apply Online' })}
            </Button>
          </Box>
        </Paper>
      )}

      {/* 2. Hero Section */}
      <Box
        sx={{
          textAlign: 'center',
          maxWidth: 860,
          mx: 'auto',
          mb: { xs: 6, md: 9 },
        }}
      >
        <Chip
          icon={<VerifiedUserOutlined sx={{ fontSize: 16 }} />}
          label={t('pages.home.authorizedBroker', { defaultValue: 'Authorized European Insurance Broker • Czech Republic & EU Standards' })}
          sx={{
            mb: 3,
            px: 1.5,
            py: 0.5,
            fontSize: '0.825rem',
            fontWeight: 600,
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

        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 800,
            fontSize: { xs: '2.25rem', sm: '3.15rem', md: '3.85rem' },
            letterSpacing: '-0.03em',
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
          {t('pages.home.title', { defaultValue: 'Secure Insurance Application Portal' })}
        </Typography>

        <Typography
          variant="h5"
          color="text.secondary"
          paragraph
          sx={{
            fontSize: { xs: '1.05rem', sm: '1.25rem' },
            lineHeight: 1.6,
            maxWidth: 720,
            mx: 'auto',
            mb: 4,
          }}
        >
          {t('pages.home.subtitle', {
            defaultValue:
              'Official digital broker portal for student health, foreigner comprehensive residency insurance, and European travel coverage. Instant submission with verified carrier dispatch.',
          })}
        </Typography>

        {/* CTA Button Group */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          alignItems="center"
          sx={{ mb: 4 }}
        >
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardOutlined />}
            onClick={() => handleGetStarted()}
            sx={{
              px: 4.5,
              py: 1.6,
              fontSize: '1.05rem',
              fontWeight: 700,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(79, 70, 229, 0.35)',
            }}
          >
            {t('pages.home.getStarted', { defaultValue: 'Start New Application' })}
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
              fontWeight: 600,
              borderRadius: '12px',
              borderWidth: '1.5px',
            }}
          >
            {t('pages.home.trackMyApplication', { defaultValue: 'Track My Application' })}
          </Button>
        </Stack>

        {/* Live Metrics Row */}
        <Grid container spacing={2} sx={{ mb: 4, maxWidth: 700, mx: 'auto' }}>
          {[
            { value: 'Act 326/1999', label: t('pages.home.metrics.actCompliance', { defaultValue: 'Czech OAMP Compliant' }) },
            { value: '< 3 Min', label: t('pages.home.metrics.rapidApp', { defaultValue: 'Rapid Application' }) },
            { value: 'AES-256 GCM', label: t('pages.home.metrics.bankPrivacy', { defaultValue: 'Bank-Grade Privacy' }) },
          ].map((metric, i) => (
            <Grid item xs={4} key={i}>
              <Box
                sx={{
                  py: 1.5,
                  px: 1,
                  borderRadius: '12px',
                  backgroundColor:
                    theme.palette.mode === 'light'
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'rgba(255, 255, 255, 0.03)',
                  border:
                    theme.palette.mode === 'light'
                      ? '1px solid rgba(15, 23, 42, 0.06)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '0.9rem', sm: '1.1rem' },
                    color: 'primary.main',
                  }}
                >
                  {metric.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
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
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {t('pages.home.securityBadges.endToEnd', { defaultValue: 'End-to-End Encrypted Storage' })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <SpeedOutlined sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {t('pages.home.securityBadges.autoEmail', { defaultValue: 'Automatic Tracking Confirmation Email' })}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* 3. Dual-Factor Application Status Tracker Section */}
      <Box ref={trackSectionRef} id="track-status" sx={{ mb: { xs: 8, md: 11 } }}>
        <Card
          sx={{
            maxWidth: 820,
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
                  width: 36,
                  height: 36,
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
                {t('pages.home.tracker.title', { defaultValue: 'Track Application Status' })}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('pages.home.tracker.subtitle', { defaultValue: 'Enter your tracking reference number and registered email address to check real-time underwriting progress.' })}
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
                  {trackResult.timeline?.map((step, idx) => (
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

      {/* 4. Curated Insurance Plans (Dynamic Czech / Universal Showcase) */}
      <Box sx={{ mb: { xs: 8, md: 11 } }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Chip
            label={t('pages.home.plans.badge', { defaultValue: 'Curated Coverage Tiers' })}
            size="small"
            sx={{ fontWeight: 600, mb: 1.5, backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'primary.main' }}
          />
          <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', sm: '2.4rem' } }}>
            {t('pages.home.plans.title', { defaultValue: 'Recommended Insurance Plans' })}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto', mt: 1 }}>
            {t('pages.home.plans.subtitle', { defaultValue: 'Fully certified by Czech regulatory authorities (OAMP) for foreign students, expatriates, and travelers.' })}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {plans.map((plan) => (
            <Grid item xs={12} sm={6} md={3} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '20px',
                  border: plan.is_featured
                    ? '2px solid rgba(79, 70, 229, 0.4)'
                    : '1px solid rgba(15, 23, 42, 0.08)',
                  boxShadow: plan.is_featured
                    ? '0 12px 30px -4px rgba(79, 70, 229, 0.2)'
                    : '0 4px 16px -2px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 16px 36px -4px rgba(79, 70, 229, 0.25)',
                  },
                }}
              >
                {plan.badge && (
                  <Chip
                    label={plan.badge}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      backgroundColor: plan.is_featured ? 'primary.main' : 'rgba(79, 70, 229, 0.1)',
                      color: plan.is_featured ? '#FFFFFF' : 'primary.main',
                    }}
                  />
                )}
                <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ mb: 2 }}>{getPlanCategoryIcon(plan.category)}</Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    {plan.company_name}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.3, mb: 1, minHeight: 48 }}>
                    {plan.name}
                  </Typography>

                  <Box sx={{ my: 2 }}>
                    <Typography variant="h4" component="span" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      {plan.price_amount > 0
                        ? `${plan.price_amount.toLocaleString()} ${plan.currency}`
                        : t('pages.home.plans.customRate', { defaultValue: 'Custom Rate' })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {plan.billing_period === 'month'
                        ? t('pages.home.plans.perMonth', { defaultValue: '/ month' })
                        : t('pages.home.plans.perYear', { defaultValue: '/ year' })}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, minHeight: 60, fontSize: '0.875rem' }}>
                    {plan.coverage_summary}
                  </Typography>

                  {plan.features && (
                    <Stack spacing={0.8} sx={{ mb: 3, flex: 1 }}>
                      {plan.features.split('\n').map((feat, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleOutline sx={{ fontSize: 16, color: '#10B981' }} />
                          <Typography variant="caption" color="text.primary" sx={{ fontWeight: 500 }}>
                            {feat}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}

                  <Button
                    variant={plan.is_featured ? 'contained' : 'outlined'}
                    fullWidth
                    onClick={() => handleGetStarted(plan.category.toLowerCase().includes('travel') ? 'travel' : 'health')}
                    sx={{
                      mt: 'auto',
                      fontWeight: 700,
                      borderRadius: '10px',
                      py: 1,
                    }}
                  >
                    {t('pages.home.plans.applyNow', { defaultValue: 'Apply Now' })}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 5. Partner Underwriters Trust Wall */}
      <Box sx={{ mb: { xs: 8, md: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Chip
            label={t('pages.home.partners.badge', { defaultValue: 'Underwriting Partners' })}
            size="small"
            sx={{ fontWeight: 600, mb: 1, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}
          />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t('pages.home.partners.title', { defaultValue: 'Underwritten by Leading European Insurers' })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 580, mx: 'auto', mt: 0.5 }}>
            {t('pages.home.partners.subtitle', { defaultValue: 'Our agency is authorized to bind coverage directly with leading insurance institutions in the Czech Republic.' })}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {companies.map((company) => (
            <Grid item xs={12} sm={6} md={3} key={company.id}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: '16px',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  p: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 8px 24px -4px rgba(79, 70, 229, 0.12)',
                  },
                }}
              >
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <ShieldOutlined sx={{ color: 'primary.main', fontSize: 22 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {company.name}
                    </Typography>
                  </Stack>
                  <Chip
                    label={company.rating}
                    size="small"
                    sx={{
                      mb: 1.5,
                      fontWeight: 600,
                      fontSize: '0.725rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      color: '#2563EB',
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.825rem', lineHeight: 1.5 }}>
                    {company.description}
                  </Typography>
                </Box>
                {company.website && (
                  <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Link
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      {t('pages.home.partners.officialPortal', { defaultValue: 'Official Portal' })} <OpenInNewOutlined sx={{ fontSize: 14 }} />
                    </Link>
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 6. Feature Cards (AES-256 GCM, Global, Mobile) */}
      <Grid container spacing={3.5}>
        {[
          {
            icon: <SecurityOutlined sx={{ fontSize: 32, color: '#4F46E5' }} />,
            badge: 'AES-256 GCM',
            title: t('pages.home.features.secure', { defaultValue: 'Encrypted Document Vault' }),
            description: t('pages.home.features.secureDesc', {
              defaultValue: 'Your identity and passport documents are encrypted with AES-256 GCM before storage.',
            }),
            gradient: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%)',
          },
          {
            icon: <LanguageOutlined sx={{ fontSize: 32, color: '#059669' }} />,
            badge: 'Multilingual',
            title: t('pages.home.features.multilingual', { defaultValue: 'International Coverage' }),
            description: t('pages.home.features.multilingualDesc', {
              defaultValue: 'Full multi-language support for international students, expats, and visa applicants.',
            }),
            gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.12) 100%)',
          },
          {
            icon: <PhoneAndroidOutlined sx={{ fontSize: 32, color: '#D97706' }} />,
            badge: 'Mobile Optimized',
            title: t('pages.home.features.mobile', { defaultValue: 'Instant Document Capture' }),
            description: t('pages.home.features.mobileDesc', {
              defaultValue: 'Upload your passport and visa documents directly from your smartphone camera.',
            }),
            gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.12) 100%)',
          },
        ].map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                p: { xs: 2, sm: 3 },
                borderRadius: '20px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow:
                    theme.palette.mode === 'light'
                      ? '0 12px 30px -4px rgba(79, 70, 229, 0.12)'
                      : '0 16px 36px -4px rgba(0, 0, 0, 0.65)',
                },
              }}
            >
              <CardContent sx={{ p: 1 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '14px',
                    background: feature.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2.5,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, fontSize: '1.2rem', mb: 1.2 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default HomePage;