import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Paper,
  Divider,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  ShieldOutlined,
  ArrowForwardOutlined,
  ArrowBackOutlined,
  PersonOutline,
  SchoolOutlined,
  CalendarTodayOutlined,
  ContactMailOutlined,
  AssignmentTurnedInOutlined,
  CheckCircleOutline,
  ContentCopyOutlined,
  WorkOutline,
  FamilyRestroomOutlined,
  PublicOutlined,
  CloudUploadOutlined,
  DeleteOutline,
  EditOutlined,
  InfoOutlined,
  LocationCityOutlined,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker as DatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import {
  applicationService,
  LeadInquiryRequest,
  LeadInquiryResponse,
  PortalPublicConfig,
  LeadDocumentItem,
} from '../../services/applicationService';
import {
  CZECH_UNIVERSITIES,
  COMMON_COUNTRIES,
  CZECH_CITIES,
} from '../../i18n/glossary';

interface LeadInquiryFormProps {
  onSuccess?: (response: LeadInquiryResponse) => void;
  id?: string;
}

const STORAGE_KEY = 'formvault_lead_inquiry_draft';

export const LeadInquiryForm: React.FC<LeadInquiryFormProps> = ({
  onSuccess,
  id = 'inquiry-form',
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  // Active Stepper Step:
  // 0: Basic Information
  // 1: Stay & Status
  // 2: Coverage Timing
  // 3: Contact & Documents
  // 4: Review & Submit
  const [activeStep, setActiveStep] = useState(0);

  // Portal Public Config (for document_intake_policy)
  const [portalConfig, setPortalConfig] = useState<PortalPublicConfig | null>(null);

  // Intake Session (for document uploads if enabled)
  const [sessionToken, setSessionToken] = useState<string>('');
  const [uploadedDocs, setUploadedDocs] = useState<LeadDocumentItem[]>([]);
  const [uploadingPassport, setUploadingPassport] = useState(false);
  const [uploadingStudyProof, setUploadingStudyProof] = useState(false);

  // Form Field States
  // Step 0: Basic Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Dayjs | null>(null);
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>('prefer_not_to_say');
  const [nationality, setNationality] = useState<string>('China');

  // Step 1: Stay & Status
  const [stayType, setStayType] = useState<'student' | 'employment' | 'family' | 'other'>('student');
  const [school, setSchool] = useState('');
  const [czechCity, setCzechCity] = useState('');

  // Step 2: Coverage Timing
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().add(7, 'day'));
  const [durationPreset, setDurationPreset] = useState<'3' | '6' | '12' | '24' | 'custom'>('12');
  const [customMonths, setCustomMonths] = useState<number>(12);
  const [currentInsuranceExpiry, setCurrentInsuranceExpiry] = useState<Dayjs | null>(null);

  // Step 3: Contact & Documents
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [wechatId, setWechatId] = useState('');
  const [preferredContact, setPreferredContact] = useState<'email' | 'phone' | 'wechat'>('email');
  const [preferredLanguage, setPreferredLanguage] = useState<'zh' | 'en' | 'cs'>(
    (i18n.language?.startsWith('zh') ? 'zh' : i18n.language?.startsWith('cs') ? 'cs' : 'en') as 'zh' | 'en' | 'cs'
  );
  const [specialNotes, setSpecialNotes] = useState('');

  // Step 4: Consent & Anti-Abuse
  const [handoffConsent, setHandoffConsent] = useState(false);
  const [hpWebsite, setHpWebsite] = useState(''); // Honeypot trap

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<LeadInquiryResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // UTM Parameters (captured once from URL on mount)
  const [utmParams, setUtmParams] = useState({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
    referral_code: '',
  });

  // Load portal config & capture UTM parameters
  useEffect(() => {
    try {
      const search = window.location.search;
      if (search) {
        const params = new URLSearchParams(search);
        setUtmParams({
          utm_source: params.get('utm_source') || '',
          utm_medium: params.get('utm_medium') || '',
          utm_campaign: params.get('utm_campaign') || '',
          utm_term: params.get('utm_term') || '',
          utm_content: params.get('utm_content') || '',
          referral_code: params.get('referral_code') || params.get('ref') || '',
        });
      }
    } catch {
      // Ignore URL parsing errors
    }

    applicationService
      .getPortalConfig()
      .then((cfg) => setPortalConfig(cfg))
      .catch(() => {});
  }, []);

  // Hydrate draft from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.firstName) setFirstName(draft.firstName);
        if (draft.lastName) setLastName(draft.lastName);
        if (draft.dateOfBirth) setDateOfBirth(dayjs(draft.dateOfBirth));
        if (draft.gender) setGender(draft.gender);
        if (draft.nationality) setNationality(draft.nationality);
        if (draft.stayType) setStayType(draft.stayType);
        if (draft.school) setSchool(draft.school);
        if (draft.czechCity) setCzechCity(draft.czechCity);
        if (draft.startDate) setStartDate(dayjs(draft.startDate));
        if (draft.durationPreset) setDurationPreset(draft.durationPreset);
        if (draft.customMonths) setCustomMonths(draft.customMonths);
        if (draft.email) setEmail(draft.email);
        if (draft.phone) setPhone(draft.phone);
        if (draft.wechatId) setWechatId(draft.wechatId);
        if (draft.preferredContact) setPreferredContact(draft.preferredContact);
        if (draft.preferredLanguage) setPreferredLanguage(draft.preferredLanguage);
        if (draft.specialNotes) setSpecialNotes(draft.specialNotes);
      }
    } catch {
      // Ignore parse error
    }
  }, []);

  // Persist draft to sessionStorage on state changes
  useEffect(() => {
    if (successResult) return;
    try {
      const draft = {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth?.isValid() ? dateOfBirth.format('YYYY-MM-DD') : null,
        gender,
        nationality,
        stayType,
        school,
        czechCity,
        startDate: startDate?.isValid() ? startDate.format('YYYY-MM-DD') : null,
        durationPreset,
        customMonths,
        email,
        phone,
        wechatId,
        preferredContact,
        preferredLanguage,
        specialNotes,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }, [
    firstName,
    lastName,
    dateOfBirth,
    gender,
    nationality,
    stayType,
    school,
    czechCity,
    startDate,
    durationPreset,
    customMonths,
    email,
    phone,
    wechatId,
    preferredContact,
    preferredLanguage,
    specialNotes,
    successResult,
  ]);

  // Derived effective duration in months
  const effectiveMonths = useMemo(() => {
    if (durationPreset === 'custom') {
      return customMonths > 0 ? customMonths : 12;
    }
    return parseInt(durationPreset, 10);
  }, [durationPreset, customMonths]);

  // Derived coverage date window (from startDate to startDate + months - 1 day)
  const coverageWindow = useMemo(() => {
    if (!startDate || !startDate.isValid()) return null;
    const end = startDate.add(effectiveMonths, 'month').subtract(1, 'day');
    return {
      startFormatted: startDate.format('YYYY-MM-DD'),
      endFormatted: end.format('YYYY-MM-DD'),
      months: effectiveMonths,
    };
  }, [startDate, effectiveMonths]);

  // Derived age calculation from dateOfBirth
  const derivedAge = useMemo(() => {
    if (!dateOfBirth || !dateOfBirth.isValid()) return null;
    const now = dayjs();
    const age = now.diff(dateOfBirth, 'year');
    return age >= 0 && age <= 120 ? age : null;
  }, [dateOfBirth]);

  // Ensure intake session is initialized if policy requires documents
  const ensureIntakeSession = useCallback(async (): Promise<string> => {
    if (sessionToken) return sessionToken;
    try {
      const resp = await applicationService.createIntakeSession();
      if (resp.session_token) {
        setSessionToken(resp.session_token);
        return resp.session_token;
      }
    } catch {
      // Handle gracefully
    }
    return '';
  }, [sessionToken]);

  // Handle document upload
  const handleFileUpload = async (file: File, docType: 'PASSPORT' | 'STUDY_CONFIRMATION') => {
    setStepError(null);
    const isPassport = docType === 'PASSPORT';
    if (isPassport) setUploadingPassport(true);
    else setUploadingStudyProof(true);

    try {
      const token = await ensureIntakeSession();
      if (!token) {
        setStepError('Failed to initialize secure upload session. Please try again.');
        return;
      }
      const uploaded = await applicationService.uploadIntakeDocument(token, file, docType);
      setUploadedDocs((prev) => [...prev.filter((d) => d.document_type !== docType), uploaded]);
    } catch (err: any) {
      setStepError(err.response?.data?.detail || 'Failed to upload document. Please ensure file is valid.');
    } finally {
      if (isPassport) setUploadingPassport(false);
      else setUploadingStudyProof(false);
    }
  };

  const handleRemoveDoc = async (docId: string) => {
    if (!sessionToken) return;
    try {
      await applicationService.deleteIntakeDocument(sessionToken, docId);
      setUploadedDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch {
      // Ignore
    }
  };

  // Step labels
  const stepLabels = [
    t('components.leadForm.steps.basicInfo', { defaultValue: 'Basic Information' }),
    t('components.leadForm.steps.stayAndStatus', { defaultValue: 'Stay & Status' }),
    t('components.leadForm.steps.coverageTiming', { defaultValue: 'Insurance Timing' }),
    t('components.leadForm.steps.contactAndDocs', { defaultValue: 'Contact & Documents' }),
    t('components.leadForm.steps.reviewAndSubmit', { defaultValue: 'Review & Submit' }),
  ];

  // Validate current step before advancing
  const handleNext = () => {
    setStepError(null);

    // Step 0: Basic Information Validation
    if (activeStep === 0) {
      if (!firstName.trim() || !lastName.trim()) {
        setStepError(
          t('components.leadForm.validation.firstNameRequired', {
            defaultValue: 'Please provide both your First Name and Last Name.',
          })
        );
        return;
      }
      if (!dateOfBirth || !dateOfBirth.isValid()) {
        setStepError(
          t('components.leadForm.validation.dobRequired', {
            defaultValue: 'Please provide a valid Date of Birth.',
          })
        );
        return;
      }
      if (!nationality.trim()) {
        setStepError(
          t('components.leadForm.validation.nationalityRequired', {
            defaultValue: 'Please select your nationality.',
          })
        );
        return;
      }
    }

    // Step 1: Stay & Status Validation
    if (activeStep === 1) {
      if (stayType === 'student' && !school.trim()) {
        setStepError(
          t('components.leadForm.validation.schoolRequired', {
            defaultValue: 'Please enter or select your educational institution or university in Czechia.',
          })
        );
        return;
      }
    }

    // Step 2: Coverage Timing Validation
    if (activeStep === 2) {
      if (!startDate || !startDate.isValid()) {
        setStepError(
          t('components.leadForm.validation.startDateRequired', {
            defaultValue: 'Please specify the requested insurance start date.',
          })
        );
        return;
      }
      if (effectiveMonths <= 0 || effectiveMonths > 60) {
        setStepError(
          t('components.leadForm.validation.durationRequired', {
            defaultValue: 'Please enter a valid coverage duration in months.',
          })
        );
        return;
      }
    }

    // Step 3: Contact & Documents Validation
    if (activeStep === 3) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim() || !emailRegex.test(email.trim())) {
        setStepError(
          t('components.leadForm.validation.emailInvalid', {
            defaultValue: 'Please enter a valid email address.',
          })
        );
        return;
      }
      if (!phone.trim() && !wechatId.trim()) {
        setStepError(
          t('components.leadForm.validation.contactChannelRequired', {
            defaultValue: 'Please provide at least one active contact channel (Phone number or WeChat ID).',
          })
        );
        return;
      }
      if (preferredContact === 'wechat' && !wechatId.trim()) {
        setStepError(
          t('components.leadForm.validation.wechatRequired', {
            defaultValue: 'You selected WeChat as your preferred contact method. Please provide your WeChat ID.',
          })
        );
        return;
      }
      if (preferredContact === 'phone' && !phone.trim()) {
        setStepError(
          t('components.leadForm.validation.phoneRequired', {
            defaultValue: 'You selected Phone as your preferred contact method. Please provide your Phone number.',
          })
        );
        return;
      }

      // Check document policy if INITIAL_REQUIRED
      if (portalConfig?.document_intake_policy === 'INITIAL_REQUIRED') {
        const hasPassport = uploadedDocs.some((d) => d.document_type === 'PASSPORT');
        if (!hasPassport) {
          setStepError(
            t('components.leadForm.validation.documentRequired', {
              defaultValue: 'Document upload (Passport copy) is required under current policy.',
            })
          );
          return;
        }
      }
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStepError(null);
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  // Submit Lead Inquiry
  const handleSubmit = async () => {
    setStepError(null);

    // Anti-Abuse: If honeypot is filled, simulate instant fake success without hitting server
    if (hpWebsite.trim()) {
      setSuccessResult({
        success: true,
        reference_number: 'FV-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        status: 'INQUIRY_RECEIVED',
        status_label: 'Enquiry Received',
        recipient: 'České pojištění a.s.',
        message: 'Your enquiry has been received.',
      });
      return;
    }

    if (!handoffConsent) {
      setStepError(
        t('components.leadForm.validation.consentRequired', {
          defaultValue:
            'You must give consent to forward your enquiry to licensed intermediary České pojištění a.s. before submitting.',
        })
      );
      return;
    }

    setSubmitting(true);

    try {
      const passportDoc = uploadedDocs.find((d) => d.document_type === 'PASSPORT');
      const studyDoc = uploadedDocs.find((d) => d.document_type === 'STUDY_CONFIRMATION');

      const payload: LeadInquiryRequest = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        date_of_birth: dateOfBirth?.format('YYYY-MM-DD'),
        gender,
        nationality: nationality.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        wechat: wechatId.trim() || undefined,
        wechat_id: wechatId.trim() || undefined,
        preferred_contact_method: preferredContact,
        preferred_language: preferredLanguage,
        student_status: stayType === 'student',
        school_or_university: school.trim() || undefined,
        type_of_stay: stayType,
        requested_start_date: startDate?.format('YYYY-MM-DD'),
        requested_duration_months: effectiveMonths,
        czech_city: czechCity.trim() || undefined,
        current_insurance_expiry_date: currentInsuranceExpiry?.isValid()
          ? currentInsuranceExpiry.format('YYYY-MM-DD')
          : undefined,
        special_notes: specialNotes.trim() || undefined,
        handoff_consent: handoffConsent,
        intake_session_token: sessionToken || undefined,
        passport_file_id: passportDoc?.id || undefined,
        study_confirmation_file_id: studyDoc?.id || undefined,
        ...utmParams,
      };

      const response = await applicationService.submitInquiry(payload);
      setSuccessResult(response);
      sessionStorage.removeItem(STORAGE_KEY);
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err: any) {
      setStepError(
        err.response?.data?.detail ||
          t('components.leadForm.validation.submitFailed', {
            defaultValue: 'Submission failed. Please check your network connection and try again.',
          })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (successResult?.reference_number) {
      navigator.clipboard.writeText(successResult.reference_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleReset = () => {
    setSuccessResult(null);
    setActiveStep(0);
    setFirstName('');
    setLastName('');
    setDateOfBirth(null);
    setGender('prefer_not_to_say');
    setNationality('China');
    setStayType('student');
    setSchool('');
    setCzechCity('');
    setStartDate(dayjs().add(7, 'day'));
    setDurationPreset('12');
    setCustomMonths(12);
    setCurrentInsuranceExpiry(null);
    setEmail('');
    setPhone('');
    setWechatId('');
    setPreferredContact('email');
    setSpecialNotes('');
    setHandoffConsent(false);
    setSessionToken('');
    setUploadedDocs([]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Card
        id={id}
        sx={{
          borderRadius: { xs: '16px', sm: '24px' },
          border:
            theme.palette.mode === 'light'
              ? '1px solid rgba(79, 70, 229, 0.15)'
              : '1px solid rgba(129, 140, 248, 0.2)',
          boxShadow:
            theme.palette.mode === 'light'
              ? '0 12px 36px -8px rgba(79, 70, 229, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03)'
              : '0 16px 40px -12px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          backgroundColor: theme.palette.mode === 'light' ? '#ffffff' : '#0f172a',
        }}
      >
        <Box
          sx={{
            p: { xs: 2.5, sm: 4.5 },
            background:
              theme.palette.mode === 'light'
                ? 'linear-gradient(180deg, rgba(79, 70, 229, 0.03) 0%, rgba(255, 255, 255, 1) 120px)'
                : 'linear-gradient(180deg, rgba(79, 70, 229, 0.08) 0%, rgba(15, 23, 42, 1) 120px)',
          }}
        >
          {/* Header Badge & Title */}
          <Box sx={{ mb: 3.5, textAlign: 'center' }}>
            <Chip
              icon={<ShieldOutlined sx={{ fontSize: 16 }} />}
              label={t('components.leadForm.badge', {
                defaultValue: 'One-Shot Intake • České pojištění a.s. Partner Referral',
              })}
              size="small"
              sx={{
                mb: 1.5,
                fontWeight: 700,
                backgroundColor: 'rgba(79, 70, 229, 0.08)',
                color: 'primary.main',
                borderRadius: '8px',
              }}
            />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.5rem', sm: '2rem' },
                letterSpacing: '-0.02em',
                color: 'text.primary',
              }}
            >
              {t('components.leadForm.title', {
                defaultValue: 'Health Insurance Enquiry for Foreigners in Czechia',
              })}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 660, mx: 'auto', mt: 1, fontSize: '0.95rem' }}
            >
              {t('components.leadForm.subtitle', {
                defaultValue:
                  'Submit your requirements once. We structure your enquiry and securely forward it to licensed broker České pojištění a.s. for compliant options and official quotes.',
              })}
            </Typography>
          </Box>

          {/* Stepper Progress Bar */}
          {!successResult && (
            <Box sx={{ width: '100%', mb: 4 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {stepLabels.map((label, index) => (
                  <Step key={label} completed={activeStep > index}>
                    <StepLabel
                      StepIconProps={{
                        sx: {
                          '&.Mui-active': { color: 'primary.main' },
                          '&.Mui-completed': { color: '#10B981' },
                        },
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: activeStep === index ? 700 : 500,
                          color: activeStep === index ? 'primary.main' : 'text.secondary',
                        }}
                      >
                        {label}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}

          {/* Step Error Alert */}
          {stepError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setStepError(null)}>
              {stepError}
            </Alert>
          )}

          {/* Honeypot hidden field for anti-abuse */}
          <input
            type="text"
            name="hp_website"
            value={hpWebsite}
            onChange={(e) => setHpWebsite(e.target.value)}
            style={{ display: 'none', position: 'absolute', left: '-9999px' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* ===================== SUCCESS VIEW ===================== */}
          {successResult ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircleOutline sx={{ fontSize: 72, color: '#10B981', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                {t('components.leadForm.success.title', {
                  defaultValue: 'Enquiry Received Successfully!',
                })}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 580, mx: 'auto', mb: 3 }}>
                {t('components.leadForm.success.subtitle', {
                  defaultValue:
                    'Your insurance enquiry has been securely registered and transferred to licensed broker České pojištění a.s.',
                })}
              </Typography>

              {/* Reference Number Card */}
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  maxWidth: 480,
                  mx: 'auto',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(79, 70, 229, 0.04)',
                  borderColor: 'rgba(79, 70, 229, 0.25)',
                  mb: 4,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  {t('components.leadForm.success.refLabel', { defaultValue: 'Tracking Reference Number' })}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: 'primary.main',
                    my: 1,
                  }}
                >
                  {successResult.reference_number}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyOutlined />}
                  onClick={handleCopyRef}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                >
                  {copied
                    ? t('components.leadForm.success.copiedBtn', { defaultValue: 'Copied to Clipboard!' })
                    : t('components.leadForm.success.copyBtn', { defaultValue: 'Copy Reference' })}
                </Button>
              </Paper>

              {/* 3 Clear Next Steps */}
              <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'left', mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                  {t('components.leadForm.success.nextStepsTitle', { defaultValue: 'What Happens Next?' })}
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        flexShrink: 0,
                      }}
                    >
                      1
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {t('components.leadForm.success.step1Title', {
                          defaultValue: '1. Dossier Preparation & Underwriting Review',
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('components.leadForm.success.step1Desc', {
                          defaultValue:
                            'Your parameters are structured and checked against Czech statutory residency requirements (Act No. 326/1999 Coll.).',
                        })}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        flexShrink: 0,
                      }}
                    >
                      2
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {t('components.leadForm.success.step2Title', {
                          defaultValue: '2. Direct Contact by Licensed Broker',
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('components.leadForm.success.step2Desc', {
                          defaultValue:
                            'A licensed advisor from České pojištění a.s. will contact you via your preferred channel with tailored quotes and policy recommendations.',
                        })}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: 'primary.main',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        flexShrink: 0,
                      }}
                    >
                      3
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {t('components.leadForm.success.step3Title', {
                          defaultValue: '3. Official Policy Issuance',
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t('components.leadForm.success.step3Desc', {
                          defaultValue:
                            'Upon agreement and electronic payment, your official OAMP-compliant insurance certificate is issued without needing to re-enter your information.',
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Box>

              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3 }}
              >
                {t('components.leadForm.success.submitAnother', { defaultValue: 'Submit Another Enquiry' })}
              </Button>
            </Box>
          ) : (
            /* ===================== STEP FORM VIEWS ===================== */
            <Box component="form" noValidate>
              {/* STEP 0: BASIC INFORMATION */}
              {activeStep === 0 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {t('components.leadForm.steps.basicInfo', { defaultValue: 'Basic Information' })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {t('components.leadForm.fields.dateOfBirthHelper', {
                      defaultValue: 'Used to verify statutory age eligibility and youth student rates.',
                    })}
                  </Typography>

                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        id="firstName"
                        name="firstName"
                        label={t('components.leadForm.fields.firstName', { defaultValue: 'First Name' })}
                        placeholder={String(t('components.leadForm.fields.firstNamePlaceholder', { defaultValue: 'e.g., Ming / John' }))}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        variant="outlined"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        id="lastName"
                        name="lastName"
                        label={t('components.leadForm.fields.lastName', { defaultValue: 'Last Name' })}
                        placeholder={String(t('components.leadForm.fields.lastNamePlaceholder', { defaultValue: 'e.g., Zhang / Doe' }))}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        variant="outlined"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label={t('components.leadForm.fields.dateOfBirth', { defaultValue: 'Date of Birth' })}
                        value={dateOfBirth}
                        onChange={(newVal) => setDateOfBirth(newVal && newVal.isValid() ? newVal : null)}
                        format="YYYY-MM-DD"
                        openTo="year"
                        views={['year', 'month', 'day']}
                        maxDate={dayjs()}
                        minDate={dayjs().subtract(100, 'year')}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            id: 'dateOfBirth',
                            name: 'dateOfBirth',
                            inputProps: {
                              'data-testid': 'dateOfBirth-input',
                              onChange: (e: any) => {
                                const v = e.target?.value;
                                if (v) {
                                  const p = dayjs(v);
                                  if (p.isValid()) setDateOfBirth(p);
                                }
                              },
                              onInput: (e: any) => {
                                const v = e.target?.value;
                                if (v) {
                                  const p = dayjs(v);
                                  if (p.isValid()) setDateOfBirth(p);
                                }
                              },
                            },
                            helperText:
                              derivedAge !== null
                                ? `${derivedAge} ${t('common.yearsOld', { defaultValue: 'years old' })} • ${
                                    derivedAge < 18
                                      ? t('components.leadForm.fields.ageJunior', { defaultValue: 'Minor Tier' })
                                      : derivedAge <= 26
                                      ? t('components.leadForm.fields.ageJunior', { defaultValue: 'Student / Youth Discount Band (18–26)' })
                                      : t('components.leadForm.fields.ageAdult', { defaultValue: 'Standard Adult Foreigner Tier' })
                                  }`
                                : t('components.leadForm.fields.dateOfBirthHelper', { defaultValue: 'Select date of birth' }),
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        id="nationality"
                        options={COMMON_COUNTRIES}
                        getOptionLabel={(option) => {
                          if (typeof option === 'string') return option;
                          if (i18n.language?.startsWith('zh')) return `${option.nameZh} (${option.code})`;
                          if (i18n.language?.startsWith('cs')) return `${option.nameCs} (${option.code})`;
                          return `${option.nameEn} (${option.code})`;
                        }}
                        value={
                          COMMON_COUNTRIES.find((c) => c.nameEn === nationality || c.nameZh === nationality || c.code === nationality) ||
                          null
                        }
                        onChange={(_event, newValue) => {
                          if (newValue) {
                            setNationality(typeof newValue === 'string' ? newValue : newValue.nameEn);
                          }
                        }}
                        freeSolo
                        onInputChange={(_event, newInputValue) => {
                          if (newInputValue) setNationality(newInputValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            required
                            onChange={(e) => setNationality(e.target.value)}
                            label={t('components.leadForm.fields.nationality', { defaultValue: 'Nationality' })}
                            placeholder={String(t('components.leadForm.fields.nationalityPlaceholder', { defaultValue: 'Search country...' }))}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                        {t('components.leadForm.fields.gender', { defaultValue: 'Gender' })}
                      </Typography>
                      <ToggleButtonGroup
                        value={gender}
                        exclusive
                        onChange={(_e, val) => {
                          if (val) setGender(val);
                        }}
                        size="small"
                        sx={{ flexWrap: 'wrap', gap: 1 }}
                      >
                        <ToggleButton value="male" sx={{ px: 2, borderRadius: '8px !important' }}>
                          {t('components.leadForm.fields.genderMale', { defaultValue: 'Male' })}
                        </ToggleButton>
                        <ToggleButton value="female" sx={{ px: 2, borderRadius: '8px !important' }}>
                          {t('components.leadForm.fields.genderFemale', { defaultValue: 'Female' })}
                        </ToggleButton>
                        <ToggleButton value="other" sx={{ px: 2, borderRadius: '8px !important' }}>
                          {t('components.leadForm.fields.genderOther', { defaultValue: 'Other' })}
                        </ToggleButton>
                        <ToggleButton value="prefer_not_to_say" sx={{ px: 2, borderRadius: '8px !important' }}>
                          {t('components.leadForm.fields.genderPreferNot', { defaultValue: 'Prefer not to say' })}
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* STEP 1: STAY & STATUS */}
              {activeStep === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {t('components.leadForm.steps.stayAndStatus', { defaultValue: 'Stay & Status' })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {t('components.leadForm.fields.stayType', { defaultValue: 'Select your purpose of stay in the Czech Republic.' })}
                  </Typography>

                  {/* 4 Cards for Stay Type */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                      {
                        key: 'student' as const,
                        icon: <SchoolOutlined sx={{ fontSize: 28 }} />,
                        title: t('components.leadForm.fields.stayStudent', { defaultValue: 'Student / Study' }),
                        desc: t('components.leadForm.fields.stayStudentDesc', { defaultValue: 'Degree, language prep, Erasmus exchange' }),
                      },
                      {
                        key: 'employment' as const,
                        icon: <WorkOutline sx={{ fontSize: 28 }} />,
                        title: t('components.leadForm.fields.stayWork', { defaultValue: 'Employment / Work' }),
                        desc: t('components.leadForm.fields.stayWorkDesc', { defaultValue: 'Employee card, business license, blue card' }),
                      },
                      {
                        key: 'family' as const,
                        icon: <FamilyRestroomOutlined sx={{ fontSize: 28 }} />,
                        title: t('components.leadForm.fields.stayFamily', { defaultValue: 'Family Reunification' }),
                        desc: t('components.leadForm.fields.stayFamilyDesc', { defaultValue: 'Accompanying spouse, child, or family' }),
                      },
                      {
                        key: 'other' as const,
                        icon: <PublicOutlined sx={{ fontSize: 28 }} />,
                        title: t('components.leadForm.fields.stayOther', { defaultValue: 'Other / Long-Term' }),
                        desc: t('components.leadForm.fields.stayOtherDesc', { defaultValue: 'Scientific research, sports, or other stay' }),
                      },
                    ].map((item) => {
                      const selected = stayType === item.key;
                      return (
                        <Grid item xs={12} sm={6} key={item.key}>
                          <Paper
                            onClick={() => setStayType(item.key)}
                            variant="outlined"
                            sx={{
                              p: 2.2,
                              cursor: 'pointer',
                              borderRadius: '14px',
                              transition: 'all 0.2s ease',
                              backgroundColor: selected
                                ? theme.palette.mode === 'light'
                                  ? 'rgba(79, 70, 229, 0.05)'
                                  : 'rgba(79, 70, 229, 0.2)'
                                : 'transparent',
                              borderColor: selected ? 'primary.main' : 'divider',
                              borderWidth: selected ? '2px' : '1px',
                              '&:hover': {
                                borderColor: 'primary.main',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.8 }}>
                              <Box sx={{ color: selected ? 'primary.main' : 'text.secondary' }}>{item.icon}</Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {item.title}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 5 }}>
                              {item.desc}
                            </Typography>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {/* University Selector (if student) */}
                  {stayType === 'student' && (
                    <Box sx={{ mb: 2.5 }}>
                      <Autocomplete
                        id="schoolOrUniversity"
                        options={CZECH_UNIVERSITIES}
                        getOptionLabel={(option) => {
                          if (typeof option === 'string') return option;
                          if (i18n.language?.startsWith('zh')) return `${option.nameZh} • ${option.nameCs}`;
                          if (i18n.language?.startsWith('cs')) return option.nameCs;
                          return `${option.nameEn} (${option.city})`;
                        }}
                        value={
                          CZECH_UNIVERSITIES.find(
                            (u) => u.nameEn === school || u.nameCs === school || u.nameZh === school || u.code === school
                          ) || null
                        }
                        onChange={(_e, val) => {
                          if (val) {
                            setSchool(typeof val === 'string' ? val : val.nameEn);
                            if (typeof val !== 'string' && !czechCity) {
                              setCzechCity(val.city);
                            }
                          }
                        }}
                        freeSolo
                        autoSelect
                        onInputChange={(_e, val, reason) => {
                          if (reason !== 'reset') {
                            setSchool(val);
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            onChange={(e) => setSchool(e.target.value)}
                            onBlur={(e) => {
                              if (e.target.value) setSchool(e.target.value);
                            }}
                            label={t('components.leadForm.fields.school', { defaultValue: 'School / University' })}
                            placeholder={String(t('components.leadForm.fields.schoolPlaceholder', {
                              defaultValue: 'e.g., Charles University, CTU in Prague...',
                            }))}
                            helperText={t('components.leadForm.fields.schoolHelper', {
                              defaultValue: 'Select from popular Czech universities or type your own.',
                            })}
                          />
                        )}
                      />
                    </Box>
                  )}

                  {/* City in Czechia */}
                  <Box>
                    <Autocomplete
                      id="czechCity"
                      options={CZECH_CITIES}
                      value={czechCity || null}
                      onChange={(_e, val) => setCzechCity(val || '')}
                      freeSolo
                      onInputChange={(_e, val) => setCzechCity(val)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          onChange={(e) => setCzechCity(e.target.value)}
                          label={t('components.leadForm.fields.czechCity', { defaultValue: 'City or Current Location' })}
                          placeholder={String(t('components.leadForm.fields.czechCityPlaceholder', { defaultValue: 'e.g. Prague, Brno...' }))}
                        />
                      )}
                    />
                  </Box>
                </Box>
              )}

              {/* STEP 2: COVERAGE TIMING */}
              {activeStep === 2 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {t('components.leadForm.steps.coverageTiming', { defaultValue: 'Insurance Timing' })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {t('components.leadForm.fields.startDateHelper', {
                      defaultValue: 'Coverage typically begins on your visa start date or travel date.',
                    })}
                  </Typography>

                  <Grid container spacing={2.5}>
                    {/* Start Date & Quick Presets */}
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label={t('components.leadForm.fields.startDate', { defaultValue: 'Requested Start Date' })}
                        value={startDate}
                        onChange={(newVal) => setStartDate(newVal && newVal.isValid() ? newVal : null)}
                        format="YYYY-MM-DD"
                        minDate={dayjs().subtract(1, 'month')}
                        maxDate={dayjs().add(2, 'year')}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            required: true,
                            id: 'startDate',
                            name: 'startDate',
                            inputProps: {
                              'data-testid': 'startDate-input',
                              onChange: (e: any) => {
                                const v = e.target?.value;
                                if (v) {
                                  const p = dayjs(v);
                                  if (p.isValid()) setStartDate(p);
                                }
                              },
                              onInput: (e: any) => {
                                const v = e.target?.value;
                                if (v) {
                                  const p = dayjs(v);
                                  if (p.isValid()) setStartDate(p);
                                }
                              },
                            },
                          },
                        }}
                      />

                      {/* Quick Date Presets */}
                      <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.8 }}>
                        <Chip
                          label={t('components.leadForm.fields.quickToday', { defaultValue: 'Today' })}
                          size="small"
                          onClick={() => setStartDate(dayjs())}
                          clickable
                        />
                        <Chip
                          label={t('components.leadForm.fields.quickNextMonth', { defaultValue: '1st of Next Month' })}
                          size="small"
                          onClick={() => setStartDate(dayjs().add(1, 'month').startOf('month'))}
                          clickable
                        />
                        <Chip
                          label={t('components.leadForm.fields.quickNextSemester', { defaultValue: 'Next Semester (Sep 1)' })}
                          size="small"
                          onClick={() => {
                            const thisYear = dayjs().year();
                            const sep1 = dayjs(`${thisYear}-09-01`);
                            setStartDate(sep1.isBefore(dayjs()) ? dayjs(`${thisYear + 1}-09-01`) : sep1);
                          }}
                          clickable
                        />
                      </Stack>
                    </Grid>

                    {/* Coverage Duration Presets */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                        {t('components.leadForm.fields.duration', { defaultValue: 'Coverage Duration' })}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {(['3', '6', '12', '24', 'custom'] as const).map((preset) => {
                          const selected = durationPreset === preset;
                          const isPopular = preset === '12';
                          return (
                            <Paper
                              key={preset}
                              onClick={() => setDurationPreset(preset)}
                              variant="outlined"
                              sx={{
                                px: 2,
                                py: 1,
                                cursor: 'pointer',
                                borderRadius: '10px',
                                textAlign: 'center',
                                position: 'relative',
                                backgroundColor: selected ? 'primary.main' : 'transparent',
                                color: selected ? '#ffffff' : 'text.primary',
                                borderColor: selected ? 'primary.main' : 'divider',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                },
                              }}
                            >
                              {preset === 'custom' ? (
                                t('components.leadForm.fields.durationPresetCustom', { defaultValue: 'Custom' })
                              ) : (
                                <>
                                  {preset} {t('common.months', { defaultValue: 'Months' })}
                                  {isPopular && (
                                    <Chip
                                      label={t('components.leadForm.fields.recommendedTag', { defaultValue: 'Recommended' })}
                                      size="small"
                                      sx={{
                                        display: 'block',
                                        height: 16,
                                        fontSize: '0.65rem',
                                        mt: 0.5,
                                        backgroundColor: selected ? 'rgba(255,255,255,0.25)' : 'rgba(79, 70, 229, 0.1)',
                                        color: selected ? '#fff' : 'primary.main',
                                      }}
                                    />
                                  )}
                                </>
                              )}
                            </Paper>
                          );
                        })}
                      </Stack>

                      {durationPreset === 'custom' && (
                        <TextField
                          type="number"
                          size="small"
                          label={t('components.leadForm.fields.durationMonths', { count: customMonths, defaultValue: 'Months' })}
                          value={customMonths}
                          onChange={(e) => setCustomMonths(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          sx={{ mt: 2, width: 140 }}
                        />
                      )}
                    </Grid>

                    {/* Dynamic Coverage Dates Banner */}
                    {coverageWindow && (
                      <Grid item xs={12}>
                        <Paper
                          sx={{
                            p: 2,
                            borderRadius: '12px',
                            backgroundColor: 'rgba(79, 70, 229, 0.04)',
                            border: '1px dashed rgba(79, 70, 229, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                          }}
                        >
                          <CalendarTodayOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {t('components.leadForm.fields.coveragePreview', {
                              from: coverageWindow.startFormatted,
                              to: coverageWindow.endFormatted,
                              months: coverageWindow.months,
                              defaultValue: `Expected coverage: ${coverageWindow.startFormatted} to ${coverageWindow.endFormatted} (${coverageWindow.months} months)`,
                            })}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    {/* Optional Current Insurance Expiry */}
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label={t('components.leadForm.fields.currentInsuranceExpiry', {
                          defaultValue: 'Current Policy Expiry (Optional)',
                        })}
                        value={currentInsuranceExpiry}
                        onChange={(newVal) => setCurrentInsuranceExpiry(newVal && newVal.isValid() ? newVal : null)}
                        format="YYYY-MM-DD"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            id: 'currentInsuranceExpiry',
                            name: 'currentInsuranceExpiry',
                            inputProps: {
                              'data-testid': 'currentInsuranceExpiry-input',
                              onChange: (e: any) => {
                                const v = e.target?.value;
                                if (v) {
                                  const p = dayjs(v);
                                  if (p.isValid()) setCurrentInsuranceExpiry(p);
                                }
                              },
                            },
                            helperText: t('components.leadForm.fields.currentInsuranceExpiryHelper', {
                              defaultValue: 'If extending your visa in CZ, enter your current expiration date.',
                            }),
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* STEP 3: CONTACT & DOCUMENTS */}
              {activeStep === 3 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {t('components.leadForm.steps.contactAndDocs', { defaultValue: 'Contact & Documents' })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {t('components.leadForm.fields.emailHelper', {
                      defaultValue: 'Your reference confirmation and broker correspondence will be sent here.',
                    })}
                  </Typography>

                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        type="email"
                        id="email"
                        name="email"
                        label={t('components.leadForm.fields.email', { defaultValue: 'Email Address' })}
                        placeholder={String(t('components.leadForm.fields.emailPlaceholder', { defaultValue: 'your.name@example.com' }))}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="phone"
                        name="phone"
                        label={t('components.leadForm.fields.phone', { defaultValue: 'Phone Number' })}
                        placeholder={String(t('components.leadForm.fields.phonePlaceholder', { defaultValue: 'e.g. +420 123 456 789' }))}
                        helperText={t('components.leadForm.fields.phoneHelper', {
                          defaultValue: 'Include country dial code (e.g., +420 for CZ, +86 for CN).',
                        })}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        id="wechatId"
                        name="wechatId"
                        label={t('components.leadForm.fields.wechatId', { defaultValue: 'WeChat ID (Optional)' })}
                        placeholder={String(t('components.leadForm.fields.wechatIdPlaceholder', { defaultValue: 'Enter WeChat ID' }))}
                        helperText={t('components.leadForm.fields.wechatIdHelper', {
                          defaultValue: 'Helpful for instant bilingual communication with our team.',
                        })}
                        value={wechatId}
                        onChange={(e) => setWechatId(e.target.value)}
                      />
                    </Grid>

                    {/* Preferred Contact Method */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                        {t('components.leadForm.fields.preferredContact', { defaultValue: 'Preferred Contact Channel' })}
                      </Typography>
                      <ToggleButtonGroup
                        value={preferredContact}
                        exclusive
                        onChange={(_e, val) => {
                          if (val) setPreferredContact(val);
                        }}
                        size="small"
                        sx={{ flexWrap: 'wrap', gap: 1 }}
                      >
                        <ToggleButton value="email" sx={{ px: 2, borderRadius: '8px !important' }}>
                          {t('components.leadForm.fields.contactEmail', { defaultValue: 'Email' })}
                        </ToggleButton>
                        <ToggleButton value="phone" sx={{ px: 2, borderRadius: '8px !important' }}>
                          {t('components.leadForm.fields.contactPhone', { defaultValue: 'Phone' })}
                        </ToggleButton>
                        <ToggleButton value="wechat" sx={{ px: 2, borderRadius: '8px !important' }}>
                          {t('components.leadForm.fields.contactWechat', { defaultValue: 'WeChat' })}
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Grid>

                    {/* Preferred Communication Language */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                        {t('components.leadForm.fields.preferredLanguage', { defaultValue: 'Preferred Communication Language' })}
                      </Typography>
                      <ToggleButtonGroup
                        value={preferredLanguage}
                        exclusive
                        onChange={(_e, val) => {
                          if (val) setPreferredLanguage(val);
                        }}
                        size="small"
                        sx={{ flexWrap: 'wrap', gap: 1 }}
                      >
                        <ToggleButton value="en" sx={{ px: 2, borderRadius: '8px !important' }}>
                          {t('components.leadForm.fields.langEn', { defaultValue: 'English' })}
                        </ToggleButton>
                        <ToggleButton value="zh" sx={{ px: 2, borderRadius: '8px !important' }}>
                          {t('components.leadForm.fields.langZh', { defaultValue: '中文 (Chinese)' })}
                        </ToggleButton>
                        <ToggleButton value="cs" sx={{ px: 2, borderRadius: '8px !important' }}>
                          {t('components.leadForm.fields.langCs', { defaultValue: 'Čeština' })}
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Grid>

                    {/* Special Notes / Health considerations */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        id="specialNotes"
                        name="specialNotes"
                        label={t('components.leadForm.fields.notes', { defaultValue: 'Special Notes or Health Requirements (Optional)' })}
                        placeholder={String(t('components.leadForm.fields.notesPlaceholder', {
                          defaultValue: 'e.g., Need OAMP certificate urgently, specific university requirements, etc.',
                        }))}
                        value={specialNotes}
                        onChange={(e) => setSpecialNotes(e.target.value)}
                      />
                    </Grid>

                    {/* Document Intake Policy Driven Cards */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {t('components.leadForm.fields.documentsTitle', { defaultValue: 'Identity & Study Verification Documents' })}
                      </Typography>

                      {portalConfig?.document_intake_policy === 'DISABLED' || !portalConfig?.document_intake_policy ? (
                        <Alert severity="info" icon={<InfoOutlined />} sx={{ borderRadius: '12px', mt: 1 }}>
                          {t('components.leadForm.fields.documentsDisabledNote', {
                            defaultValue:
                              'Document upload is currently not required at initial enquiry stage. Our broker partner will verify details directly when finalizing your official policy.',
                          })}
                        </Alert>
                      ) : (
                        <Box sx={{ mt: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            {t('components.leadForm.fields.documentsSubtitle', {
                              defaultValue:
                                'Upload clear photos or scans. Files are encrypted in flight and at rest with AES-256-GCM.',
                            })}
                          </Typography>

                          <Grid container spacing={2}>
                            {/* Passport Card */}
                            <Grid item xs={12} sm={6}>
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 2,
                                  borderRadius: '12px',
                                  textAlign: 'center',
                                  backgroundColor: 'rgba(79, 70, 229, 0.02)',
                                }}
                              >
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                                  {t('components.leadForm.fields.passportDoc', { defaultValue: 'Passport ID Page' })}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                                  {t('components.leadForm.fields.passportDocDesc', { defaultValue: 'Bio-data page photo or PDF' })}
                                </Typography>

                                {uploadedDocs.find((d) => d.document_type === 'PASSPORT') ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    <Chip
                                      icon={<CheckCircleOutline />}
                                      label={uploadedDocs.find((d) => d.document_type === 'PASSPORT')?.original_filename}
                                      color="success"
                                      variant="outlined"
                                      onDelete={() => {
                                        const doc = uploadedDocs.find((d) => d.document_type === 'PASSPORT');
                                        if (doc) handleRemoveDoc(doc.id);
                                      }}
                                    />
                                  </Box>
                                ) : (
                                  <Button
                                    variant="outlined"
                                    component="label"
                                    size="small"
                                    disabled={uploadingPassport}
                                    startIcon={uploadingPassport ? <CircularProgress size={16} /> : <CloudUploadOutlined />}
                                    sx={{ borderRadius: '8px', textTransform: 'none' }}
                                  >
                                    {uploadingPassport
                                      ? t('components.leadForm.fields.uploadingAction', { defaultValue: 'Encrypting...' })
                                      : t('components.leadForm.fields.uploadAction', { defaultValue: 'Upload Passport' })}
                                    <input
                                      type="file"
                                      hidden
                                      accept="image/*,application/pdf"
                                      onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                          handleFileUpload(e.target.files[0], 'PASSPORT');
                                        }
                                      }}
                                    />
                                  </Button>
                                )}
                              </Paper>
                            </Grid>

                            {/* Study Proof Card */}
                            <Grid item xs={12} sm={6}>
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 2,
                                  borderRadius: '12px',
                                  textAlign: 'center',
                                  backgroundColor: 'rgba(79, 70, 229, 0.02)',
                                }}
                              >
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                                  {t('components.leadForm.fields.studyProofDoc', { defaultValue: 'Proof of Study / Acceptance' })}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                                  {t('components.leadForm.fields.studyProofDocDesc', { defaultValue: 'Confirmation letter or student ID' })}
                                </Typography>

                                {uploadedDocs.find((d) => d.document_type === 'STUDY_CONFIRMATION') ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    <Chip
                                      icon={<CheckCircleOutline />}
                                      label={uploadedDocs.find((d) => d.document_type === 'STUDY_CONFIRMATION')?.original_filename}
                                      color="success"
                                      variant="outlined"
                                      onDelete={() => {
                                        const doc = uploadedDocs.find((d) => d.document_type === 'STUDY_CONFIRMATION');
                                        if (doc) handleRemoveDoc(doc.id);
                                      }}
                                    />
                                  </Box>
                                ) : (
                                  <Button
                                    variant="outlined"
                                    component="label"
                                    size="small"
                                    disabled={uploadingStudyProof}
                                    startIcon={uploadingStudyProof ? <CircularProgress size={16} /> : <CloudUploadOutlined />}
                                    sx={{ borderRadius: '8px', textTransform: 'none' }}
                                  >
                                    {uploadingStudyProof
                                      ? t('components.leadForm.fields.uploadingAction', { defaultValue: 'Encrypting...' })
                                      : t('components.leadForm.fields.uploadAction', { defaultValue: 'Upload Study Proof' })}
                                    <input
                                      type="file"
                                      hidden
                                      accept="image/*,application/pdf"
                                      onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                          handleFileUpload(e.target.files[0], 'STUDY_CONFIRMATION');
                                        }
                                      }}
                                    />
                                  </Button>
                                )}
                              </Paper>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* STEP 4: REVIEW & SUBMIT */}
              {activeStep === 4 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {t('components.leadForm.review.title', { defaultValue: 'Review Your Enquiry Details' })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {t('components.leadForm.review.subtitle', {
                      defaultValue: 'Please verify your details before submission. You can click Edit on any section to modify.',
                    })}
                  </Typography>

                  <Stack spacing={2.5}>
                    {/* Section 1: Basic Info */}
                    <Paper variant="outlined" sx={{ p: 2.2, borderRadius: '14px' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {t('components.leadForm.review.basicInfoSection', { defaultValue: '1. Personal Information' })}
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<EditOutlined />}
                          onClick={() => setActiveStep(0)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          {t('components.leadForm.review.editSection', { defaultValue: 'Edit' })}
                        </Button>
                      </Box>
                      <Grid container spacing={1}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">
                            {t('components.leadForm.review.fullName', { defaultValue: 'Full Name' })}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {firstName} {lastName}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">
                            {t('components.leadForm.review.dob', { defaultValue: 'Date of Birth' })}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {dateOfBirth?.format('YYYY-MM-DD')} {derivedAge !== null && `(${derivedAge} y/o)`}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">
                            {t('components.leadForm.review.nationality', { defaultValue: 'Nationality' })}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {nationality}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="caption" color="text.secondary">
                            {t('components.leadForm.review.gender', { defaultValue: 'Gender' })}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                            {gender.replace(/_/g, ' ')}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Section 2: Stay & Status */}
                    <Paper variant="outlined" sx={{ p: 2.2, borderRadius: '14px' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {t('components.leadForm.review.staySection', { defaultValue: '2. Stay & Educational Institution' })}
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<EditOutlined />}
                          onClick={() => setActiveStep(1)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          {t('components.leadForm.review.editSection', { defaultValue: 'Edit' })}
                        </Button>
                      </Box>
                      <Grid container spacing={1}>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            {t('components.leadForm.review.stayType', { defaultValue: 'Stay Type' })}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                            {stayType}
                          </Typography>
                        </Grid>
                        {stayType === 'student' && (
                          <Grid item xs={6} sm={4}>
                            <Typography variant="caption" color="text.secondary">
                              {t('components.leadForm.review.institution', { defaultValue: 'University / School' })}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {school || '-'}
                            </Typography>
                          </Grid>
                        )}
                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            {t('components.leadForm.review.city', { defaultValue: 'Location' })}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {czechCity || '-'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Section 3: Timing */}
                    <Paper variant="outlined" sx={{ p: 2.2, borderRadius: '14px' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {t('components.leadForm.review.timingSection', { defaultValue: '3. Insurance Duration & Timing' })}
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<EditOutlined />}
                          onClick={() => setActiveStep(2)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          {t('components.leadForm.review.editSection', { defaultValue: 'Edit' })}
                        </Button>
                      </Box>
                      <Grid container spacing={1}>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            {t('components.leadForm.review.startDate', { defaultValue: 'Start Date' })}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {startDate?.format('YYYY-MM-DD')}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            {t('components.leadForm.review.duration', { defaultValue: 'Duration' })}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {effectiveMonths} {t('common.months', { defaultValue: 'Months' })}
                          </Typography>
                        </Grid>
                        {coverageWindow && (
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" color="text.secondary">
                              {t('components.leadForm.review.coverageWindow', { defaultValue: 'Coverage Window' })}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {coverageWindow.startFormatted} ~ {coverageWindow.endFormatted}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>

                    {/* Section 4: Contact */}
                    <Paper variant="outlined" sx={{ p: 2.2, borderRadius: '14px' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {t('components.leadForm.review.contactSection', { defaultValue: '4. Contact Channels' })}
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<EditOutlined />}
                          onClick={() => setActiveStep(3)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          {t('components.leadForm.review.editSection', { defaultValue: 'Edit' })}
                        </Button>
                      </Box>
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            {t('components.leadForm.review.email', { defaultValue: 'Email' })}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {email}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            {t('components.leadForm.review.phone', { defaultValue: 'Phone' })}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {phone || '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            {t('components.leadForm.review.wechat', { defaultValue: 'WeChat' })}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {wechatId || '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            {t('components.leadForm.review.preferredMethod', { defaultValue: 'Preferred Channel' })}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                            {preferredContact}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <Typography variant="caption" color="text.secondary">
                            {t('components.leadForm.review.preferredLang', { defaultValue: 'Preferred Language' })}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                            {preferredLanguage}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Section 5: Documents (if any) */}
                    {uploadedDocs.length > 0 && (
                      <Paper variant="outlined" sx={{ p: 2.2, borderRadius: '14px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {t('components.leadForm.review.documentsSection', { defaultValue: '5. Attached Documents' })}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<EditOutlined />}
                            onClick={() => setActiveStep(3)}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                          >
                            {t('components.leadForm.review.editSection', { defaultValue: 'Edit' })}
                          </Button>
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                          {uploadedDocs.map((doc) => (
                            <Chip
                              key={doc.id}
                              icon={<CheckCircleOutline />}
                              label={`${doc.document_type}: ${doc.original_filename}`}
                              size="small"
                              variant="outlined"
                              color="success"
                            />
                          ))}
                        </Stack>
                      </Paper>
                    )}

                    {/* Consent Checkbox */}
                    <Box sx={{ pt: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={handoffConsent}
                            onChange={(e) => setHandoffConsent(e.target.checked)}
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ lineHeight: 1.4, fontWeight: 500 }}>
                            {t('components.leadForm.fields.consentHandoff', {
                              defaultValue:
                                'I agree that HKTSE s.r.o. may forward my insurance enquiry and parameters to licensed partner broker České pojištění a.s. pursuant to Act No. 170/2018 Coll. to prepare official insurance offers.',
                            })}
                          </Typography>
                        }
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pl: 4, mt: 0.5 }}>
                        {t('components.leadForm.fields.privacyNotice', {
                          defaultValue: 'Your data is protected under GDPR. We never share details with unauthorized third parties.',
                        })}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}

              {/* Form Navigation Action Buttons */}
              <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  disabled={activeStep === 0 || submitting}
                  onClick={handleBack}
                  startIcon={<ArrowBackOutlined />}
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, px: 2.5 }}
                >
                  {t('navigation.back', { defaultValue: 'Back' })}
                </Button>

                {activeStep < 4 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<ArrowForwardOutlined />}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 3.5,
                      boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)',
                    }}
                  >
                    {t('navigation.next', { defaultValue: 'Next Step' })}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={submitting || !handoffConsent}
                    startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <AssignmentTurnedInOutlined />}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 700,
                      px: 4,
                      backgroundColor: '#10B981',
                      '&:hover': {
                        backgroundColor: '#059669',
                      },
                      boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    {submitting
                      ? t('components.leadForm.review.submitting', { defaultValue: 'Submitting Securely...' })
                      : t('components.leadForm.review.submitEnquiry', { defaultValue: 'Submit Insurance Request' })}
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Card>
    </LocalizationProvider>
  );
};

export default LeadInquiryForm;
