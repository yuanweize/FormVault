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
  SupportAgentOutlined,
  AssignmentOutlined,
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
  const [companies, setCompanies] = useState<InsuranceCompanyShowcase[]>([]);
  const [plans, setPlans] = useState<InsurancePlanShowcase[]>([]);
  const [banner, setBanner] = useState<AgencyBannerShowcase | null>({
    id: 1,
    title: 'Czech Foreigners Residence Act (Act No. 326/1999 Coll.) Compliant Insurance Information',
    subtitle: 'Foreign nationals applying for Czech long-term visas or residence permits must hold comprehensive health insurance meeting statutory requirements. Submit your enquiry to receive licensed intermediary options.',
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
    const nameInput =
      document.getElementById('inquiry-first-name-input') ||
      document.getElementById('inquiry-name-input');
    if (nameInput) {
      nameInput.focus();
    }
  };

  const scrollToTrack = () => {
    trackSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const refInput = document.getElementById('tracking-reference-input');
    if (refInput) {
      refInput.focus();
    }
  };

  const handleInquirySuccess = (res: LeadInquiryResponse) => {
    setTrackRef(res.reference_number);
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
            'No matching enquiry found. Please verify your reference number and registered email address.',
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
      {/* 1. Regulatory / Informational Announcement Banner */}
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
              {t('pages.home.banner.defaultButton', { defaultValue: 'Request Options' })}
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
          mb: { xs: 6, md: 8 },
        }}
      >
        <Chip
          icon={<VerifiedUserOutlined sx={{ fontSize: 16 }} />}
          label={t('pages.home.roleBadge', {
            defaultValue: 'International Student Health Insurance Enquiry • One-Shot Intake',
          })}
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
            fontSize: { xs: '2.2rem', sm: '3.1rem', md: '3.75rem' },
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
          {t('pages.home.title', {
            defaultValue: 'Health Insurance Enquiry for International Students in Czechia',
          })}
        </Typography>

        <Typography
          variant="h5"
          color="text.secondary"
          paragraph
          sx={{
            fontSize: { xs: '1.05rem', sm: '1.25rem' },
            lineHeight: 1.6,
            maxWidth: 740,
            mx: 'auto',
            mb: 4,
          }}
        >
          {t('pages.home.subtitle', {
            defaultValue:
              '在线填写一次基本资料和保险需求，我们会将您的申请需求转交给合作保险中介继续处理。',
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
              fontWeight: 700,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(79, 70, 229, 0.35)',
              textTransform: 'none',
            }}
          >
            {t('pages.home.requestOptions', { defaultValue: '开始填写 (Start Enquiry)' })}
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
              textTransform: 'none',
            }}
          >
            {t('pages.home.trackMyApplication', { defaultValue: 'Track My Application' })}
          </Button>
        </Stack>

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
        <Grid container spacing={2} sx={{ mb: 4, maxWidth: 720, mx: 'auto' }}>
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
              {t('pages.home.securityBadges.endToEnd', { defaultValue: 'AES-256-GCM Encrypted Storage' })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <SpeedOutlined sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {t('pages.home.securityBadges.autoEmail', { defaultValue: 'Automatic Reference & Status Tracking' })}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* 3. Lead Intake Form Section */}
      <Box ref={inquirySectionRef} id="inquiry-form-section" sx={{ mb: { xs: 8, md: 11 } }}>
        <LeadInquiryForm onSuccess={handleInquirySuccess} />
      </Box>

      {/* 4. Dual-Factor Application / Enquiry Status Tracker Section */}
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

      {/* 5. Educational Framework Section (Active in LEAD_ONLY when plans list is empty) */}
      {plans.length === 0 ? (
        <Box sx={{ mb: { xs: 8, md: 11 } }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Chip
              label={t('pages.home.guide.badge', { defaultValue: 'Czech Visa & Residency Guide' })}
              size="small"
              sx={{ fontWeight: 600, mb: 1.5, backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'primary.main' }}
            />
            <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', sm: '2.4rem' } }}>
              {t('pages.home.guide.title', { defaultValue: 'Understanding Czech Foreigners Health Insurance' })}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 660, mx: 'auto', mt: 1 }}>
              {t('pages.home.guide.subtitle', {
                defaultValue:
                  'Official statutory compliance criteria under Czech Act No. 326/1999 Coll. for international students, interns, and foreign residents.',
              })}
            </Typography>
          </Box>

          <Grid container spacing={3} justifyContent="center" alignItems="stretch">
            {[
              {
                icon: <LocalHospitalOutlined sx={{ fontSize: 32, color: '#4F46E5' }} />,
                title: t('pages.home.guide.card1Title', { defaultValue: 'Comprehensive Health Insurance (Komplexní)' }),
                badge: t('pages.home.guide.card1Badge', { defaultValue: 'Mandatory for Visa >90 Days' }),
                description: t('pages.home.guide.card1Desc', {
                  defaultValue:
                    'Required for long-term visa, residence permit, and extension applications at OAMP (Czech Ministry of the Interior). Covers outpatient diagnosis, hospitalization, emergency dental, prescription drugs, and repatriation.',
                }),
              },
              {
                icon: <SchoolOutlined sx={{ fontSize: 32, color: '#059669' }} />,
                title: t('pages.home.guide.card2Title', { defaultValue: 'Student & Youth Preferential Rates' }),
                badge: t('pages.home.guide.card2Badge', { defaultValue: 'Ages 15–30' }),
                description: t('pages.home.guide.card2Desc', {
                  defaultValue:
                    'University students and youths aged 15–30 qualify for substantial discounts from accredited insurance providers. Our partner prepares options aligned with your age bracket and academic term.',
                }),
              },
              {
                icon: <ShieldOutlined sx={{ fontSize: 32, color: '#D97706' }} />,
                title: t('pages.home.guide.card3Title', { defaultValue: 'Direct Hospital Settlement Networks' }),
                badge: t('pages.home.guide.card3Badge', { defaultValue: 'Nationwide Contracted Clinics' }),
                description: t('pages.home.guide.card3Desc', {
                  defaultValue:
                    'Leading healthcare provider networks across Prague (Motol, FNKV, VFN), Brno, and regional university cities support direct insurance billing, minimizing out-of-pocket expenses for students.',
                }),
              },
            ].map((card, idx) => (
              <Grid item xs={12} md={4} key={idx} sx={{ display: 'flex' }}>
                <Card
                  sx={{
                    width: '100%',
                    p: 3.5,
                    borderRadius: '20px',
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          p: 1.25,
                          borderRadius: '12px',
                          backgroundColor: 'rgba(79, 70, 229, 0.08)',
                          display: 'inline-flex',
                        }}
                      >
                        {card.icon}
                      </Box>
                      <Chip
                        label={card.badge}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: '0.72rem', backgroundColor: 'rgba(79, 70, 229, 0.08)' }}
                      />
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.2, fontSize: '1.15rem' }}>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: '0.875rem' }}>
                      {card.description}
                    </Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : null}

      {/* 6. Licensed Intermediary Partner Transparency Card (Replaces uncertified broker / direct carrier claims) */}
      <Box sx={{ mb: { xs: 8, md: 10 } }}>
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

      {/* 7. Feature Cards (Streamlined, Accurate Technical Wording) */}
      <Grid container spacing={2.5} sx={{ mb: 1 }}>
        {(customFeatures && customFeatures.length > 0
          ? customFeatures.map((item) => ({
              icon: <SecurityOutlined sx={{ fontSize: 24, color: '#4F46E5' }} />,
              badge: item.badge || 'Verified',
              title: item.title_key ? t(item.title_key, { defaultValue: item.title || '' }) : (item.title || ''),
              description: item.desc_key ? t(item.desc_key, { defaultValue: item.description || '' }) : (item.description || ''),
              gradient: item.gradient || 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%)',
            }))
          : [
              {
                icon: <SecurityOutlined sx={{ fontSize: 24, color: '#4F46E5' }} />,
                badge: 'AES-256 GCM',
                title: t('pages.home.features.secure', { defaultValue: 'AES-256-GCM Secure Data Vault' }),
                description: t('pages.home.features.secureDesc', {
                  defaultValue: 'Authenticated symmetric encryption with per-document nonces and cryptographic key derivation to protect customer enquiry data.',
                }),
                gradient: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(124, 58, 237, 0.12) 100%)',
              },
              {
                icon: <LanguageOutlined sx={{ fontSize: 24, color: '#059669' }} />,
                badge: '12 Languages',
                title: t('pages.home.features.multilingual', { defaultValue: 'Multilingual Chinese & English Support' }),
                description: t('pages.home.features.multilingualDesc', {
                  defaultValue: 'Seamless cross-border communication designed to assist international students and expatriates relocating to the Czech Republic.',
                }),
                gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.12) 100%)',
              },
              {
                icon: <AssignmentOutlined sx={{ fontSize: 24, color: '#D97706' }} />,
                badge: 'Tamper-Evident',
                title: t('pages.home.features.audit', { defaultValue: 'Tamper-Evident Audit Trail' }),
                description: t('pages.home.features.auditDesc', {
                  defaultValue: 'Cryptographically hashed timeline records each stage of enquiry handoff and intermediary consultation with zero data ambiguity.',
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
                p: { xs: 2, sm: 2.2 },
                borderRadius: '16px',
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(30, 41, 59, 0.55)'
                    : 'rgba(255, 255, 255, 0.85)',
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
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.55, display: 'block', fontSize: '0.82rem' }}>
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
