import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Paper,
  Divider,
  Stepper,
  Step,
  StepLabel,
  RadioGroup,
  Radio,
  FormLabel,
  useTheme,
  Link as MuiLink,
} from '@mui/material';
import {
  SendOutlined,
  CheckCircleOutline,
  ContentCopyOutlined,
  SchoolOutlined,
  ShieldOutlined,
  ArrowForwardOutlined,
  ArrowBackOutlined,
  PersonOutline,
  ContactMailOutlined,
  AssignmentTurnedInOutlined,
  InfoOutlined,
  ChatBubbleOutline,
  CalendarTodayOutlined,
  PublicOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  applicationService,
  LeadInquiryRequest,
  LeadInquiryResponse,
} from '../../services/applicationService';

interface LeadInquiryFormProps {
  onSuccess?: (response: LeadInquiryResponse) => void;
  id?: string;
}

export const LeadInquiryForm: React.FC<LeadInquiryFormProps> = ({
  onSuccess,
  id = 'inquiry-form',
}) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  // Active Stepper Step: 0 = About You, 1 = Stay & Needs, 2 = Contact, 3 = Review & Consent
  const [activeStep, setActiveStep] = useState(0);

  // Step 1: About You
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');
  const [nationality, setNationality] = useState('Chinese');

  // Step 2: Stay & Insurance Needs
  const [isStudent, setIsStudent] = useState(true);
  const [schoolOrUniversity, setSchoolOrUniversity] = useState('');
  const [typeOfStay, setTypeOfStay] = useState('student');
  const [startDate, setStartDate] = useState('');
  const [durationPreset, setDurationPreset] = useState<'3' | '6' | '12' | '24' | 'custom'>('12');
  const [customDurationMonths, setCustomDurationMonths] = useState<number>(12);
  const [currentLocation, setCurrentLocation] = useState('');
  const [generalNeed, setGeneralNeed] = useState('Comprehensive Foreigners Health Insurance');
  const [specialNotes, setSpecialNotes] = useState('');

  // Step 3: Contact Details & Chinese Student Preferences
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [wechatId, setWechatId] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState<'email' | 'wechat' | 'phone'>('email');
  const [preferredLanguage, setPreferredLanguage] = useState<'zh' | 'en' | 'cs'>(
    (i18n.language?.startsWith('zh') ? 'zh' : i18n.language?.startsWith('cs') ? 'cs' : 'en') as 'zh' | 'en' | 'cs'
  );

  // Step 4: Consent & Marketing Attribution
  const [handoffConsent, setHandoffConsent] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // State Management: Validation, Submission & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<LeadInquiryResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Capture Marketing Attribution from URL Query on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('utm_source')) setUtmSource(params.get('utm_source') || '');
      if (params.get('utm_medium')) setUtmMedium(params.get('utm_medium') || '');
      if (params.get('utm_campaign')) setUtmCampaign(params.get('utm_campaign') || '');
      if (params.get('utm_term')) setUtmTerm(params.get('utm_term') || '');
      if (params.get('utm_content')) setUtmContent(params.get('utm_content') || '');
      const ref = params.get('referral_code') || params.get('ref') || '';
      if (ref) setReferralCode(ref);
    }
  }, []);

  // Calculate age accurately from date of birth
  const calculateAge = (dobString: string): number | null => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 && age <= 120 ? age : null;
  };

  const derivedAge = calculateAge(dateOfBirth);

  const getDerivedAgeBand = (age: number | null): string => {
    if (age === null) return '';
    if (age <= 17) return 'Child (0–17)';
    if (age >= 18 && age <= 26) return 'Student / Youth Discount Band (18–26)';
    if (age >= 27 && age <= 49) return 'Adult Standard (27–49)';
    return 'Senior / Mature (50+)';
  };

  const derivedAgeBand = getDerivedAgeBand(derivedAge);
  const effectiveDurationMonths =
    durationPreset === 'custom' ? Number(customDurationMonths) || 12 : Number(durationPreset);

  // Step Validation logic
  const validateStep = (step: number): boolean => {
    setStepError(null);
    if (step === 0) {
      if (!firstName.trim() || !lastName.trim()) {
        setStepError(
          t('components.leadForm.errors.nameRequired', {
            defaultValue: 'Please provide both your First Name and Last Name.',
          })
        );
        return false;
      }
      if (!dateOfBirth.trim() || derivedAge === null) {
        setStepError(
          t('components.leadForm.errors.dobRequired', {
            defaultValue: 'Please provide a valid Date of Birth for age verification.',
          })
        );
        return false;
      }
      if (!nationality.trim()) {
        setStepError(
          t('components.leadForm.errors.nationalityRequired', {
            defaultValue: 'Please enter your nationality.',
          })
        );
        return false;
      }
      return true;
    }

    if (step === 1) {
      if (!typeOfStay) {
        setStepError(
          t('components.leadForm.errors.stayTypeRequired', {
            defaultValue: 'Please select your type of stay in Czechia.',
          })
        );
        return false;
      }
      if (!startDate) {
        setStepError(
          t('components.leadForm.errors.startDateRequired', {
            defaultValue: 'Please specify the requested insurance commencement date.',
          })
        );
        return false;
      }
      if (effectiveDurationMonths <= 0) {
        setStepError(
          t('components.leadForm.errors.durationRequired', {
            defaultValue: 'Please enter a valid coverage duration in months.',
          })
        );
        return false;
      }
      return true;
    }

    if (step === 2) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim() || !emailRegex.test(email.trim())) {
        setStepError(
          t('components.leadForm.errors.validEmailRequired', {
            defaultValue: 'Please enter a valid email address.',
          })
        );
        return false;
      }
      if (!phone.trim() && !wechatId.trim()) {
        setStepError(
          t('components.leadForm.errors.phoneOrWechatRequired', {
            defaultValue: 'Please provide at least one contact channel (Phone number or WeChat ID).',
          })
        );
        return false;
      }
      if (preferredContactMethod === 'wechat' && !wechatId.trim()) {
        setStepError(
          t('components.leadForm.errors.wechatRequiredForPreferred', {
            defaultValue: 'You selected WeChat as your preferred contact method. Please provide your WeChat ID.',
          })
        );
        return false;
      }
      if (preferredContactMethod === 'phone' && !phone.trim()) {
        setStepError(
          t('components.leadForm.errors.phoneRequiredForPreferred', {
            defaultValue: 'You selected Phone as your preferred contact method. Please provide your Phone number.',
          })
        );
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStepError(null);
    setActiveStep((prev) => prev - 1);
  };

  // One-shot submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);

    if (!handoffConsent) {
      setStepError(
        t('components.leadForm.errors.consentRequired', {
          defaultValue:
            'You must agree that HKTSE s.r.o. may forward your enquiry to České pojištění a.s. to proceed.',
        })
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: LeadInquiryRequest = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        date_of_birth: dateOfBirth.trim(),
        gender: gender || undefined,
        nationality: nationality.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        wechat: wechatId.trim() || undefined,
        wechat_id: wechatId.trim() || undefined,
        preferred_contact_method: preferredContactMethod,
        preferred_language: preferredLanguage,
        student_status: isStudent,
        school_or_university: isStudent ? schoolOrUniversity.trim() || undefined : undefined,
        study_status: isStudent ? 'active' : undefined,
        type_of_stay: typeOfStay,
        requested_start_date: startDate || undefined,
        requested_duration_months: effectiveDurationMonths,
        current_location: currentLocation.trim() || undefined,
        general_insurance_need: generalNeed,
        special_notes: specialNotes.trim() || undefined,
        free_text_note: specialNotes.trim() || undefined,
        handoff_consent: true,
        handoff_consent_text_version: 'v2.0',
        utm_source: utmSource || undefined,
        utm_medium: utmMedium || undefined,
        utm_campaign: utmCampaign || undefined,
        utm_term: utmTerm || undefined,
        utm_content: utmContent || undefined,
        referral_code: referralCode || undefined,
        referrer_url: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
        landing_page: typeof window !== 'undefined' ? window.location.pathname || '/' : '/',
      };

      const res = await applicationService.submitInquiry(payload);
      setSuccessResult(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        t('components.leadForm.errors.submissionFailed', {
          defaultValue: 'Submission failed. Please check your network connection and try again.',
        });
      setStepError(msg);
    } finally {
      setIsSubmitting(false);
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
    setDateOfBirth('');
    setGender('prefer_not_to_say');
    setNationality('Chinese');
    setIsStudent(true);
    setSchoolOrUniversity('');
    setTypeOfStay('student');
    setStartDate('');
    setDurationPreset('12');
    setCustomDurationMonths(12);
    setCurrentLocation('');
    setSpecialNotes('');
    setEmail('');
    setPhone('');
    setWechatId('');
    setPreferredContactMethod('email');
    setHandoffConsent(false);
    setStepError(null);
  };

  const stepLabels = [
    t('components.leadForm.steps.aboutYou', { defaultValue: 'About You' }),
    t('components.leadForm.steps.stayAndNeeds', { defaultValue: 'Stay & Needs' }),
    t('components.leadForm.steps.contact', { defaultValue: 'Contact' }),
    t('components.leadForm.steps.reviewAndConsent', { defaultValue: 'Review & Submit' }),
  ];

  return (
    <Card
      id={id}
      sx={{
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
          p: { xs: 2.5, sm: 4.5 },
          background:
            theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.04) 0%, rgba(248, 250, 252, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)',
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
              backgroundColor: 'rgba(79, 70, 229, 0.1)',
              color: 'primary.main',
              borderRadius: '8px',
            }}
          />
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, fontSize: { xs: '1.65rem', sm: '2.1rem' } }}
          >
            {t('components.leadForm.title', { defaultValue: 'International Student Insurance Enquiry' })}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 660, mx: 'auto', mt: 1, fontSize: '0.95rem' }}
          >
            {t('components.leadForm.subtitle', {
              defaultValue:
                'Fill your information once. We structure your dossier and forward it directly to licensed broker České pojištění a.s. for personalized quotes and visa certificates.',
            })}
          </Typography>
        </Box>

        {/* Stepper Indicator */}
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
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        {/* Success View */}
        {successResult ? (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4.5 },
              borderRadius: '20px',
              backgroundColor:
                theme.palette.mode === 'light' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.12)',
              border: '1.5px solid rgba(16, 185, 129, 0.35)',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <CheckCircleOutline sx={{ fontSize: 40 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1 }}>
              {t('components.leadForm.success.heading', {
                defaultValue: 'Insurance Enquiry Received Successfully!',
              })}
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 600, mx: 'auto', mb: 3, lineHeight: 1.6 }}
            >
              {successResult.message ||
                t('components.leadForm.success.desc', {
                  defaultValue:
                    'Your structured dossier has been registered. České pojištění a.s. will handle the official insurance options and reach out to you via your preferred channel.',
                })}
            </Typography>

            {/* Reference Number Box */}
            <Paper
              variant="outlined"
              sx={{
                maxWidth: 440,
                mx: 'auto',
                p: 2,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
                backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(30, 41, 59, 0.8)',
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                  {t('components.leadForm.success.refLabel', { defaultValue: 'Tracking Reference Number' })}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'monospace', color: 'primary.main' }}>
                  {successResult.reference_number}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopyOutlined />}
                onClick={handleCopyRef}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {copied
                  ? t('common.copied', { defaultValue: 'Copied!' })
                  : t('common.copy', { defaultValue: 'Copy' })}
              </Button>
            </Paper>

            {/* Structured Next Steps */}
            <Box
              sx={{
                maxWidth: 540,
                mx: 'auto',
                textAlign: 'left',
                p: 2.5,
                borderRadius: '12px',
                backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                mb: 3.5,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <InfoOutlined fontSize="small" color="primary" />
                {t('components.leadForm.success.nextStepsTitle', { defaultValue: 'What Happens Next?' })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.5 }}>
                1. <strong>{t('components.leadForm.success.step1', { defaultValue: 'Structured Handoff:' })}</strong>{' '}
                {t('components.leadForm.success.step1Desc', {
                  defaultValue:
                    'Your complete dossier is securely transferred to ČNB-licensed intermediary České pojištění a.s.',
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.5 }}>
                2. <strong>{t('components.leadForm.success.step2', { defaultValue: 'Direct Contact:' })}</strong>{' '}
                {t('components.leadForm.success.step2Desc', {
                  defaultValue:
                    'An insurance specialist will contact you via your preferred communication channel (WeChat/Email/Phone) with matching options.',
                })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                3. <strong>{t('components.leadForm.success.step3', { defaultValue: 'No Re-entry:' })}</strong>{' '}
                {t('components.leadForm.success.step3Desc', {
                  defaultValue:
                    'Your identity and duration are already saved. If additional documents (e.g. passport copy) are required later, they will simply be appended.',
                })}
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={handleReset}
              sx={{ px: 4, py: 1.2, borderRadius: '10px', fontWeight: 700 }}
            >
              {t('components.leadForm.success.submitAnother', { defaultValue: 'Submit Another Enquiry' })}
            </Button>
          </Paper>
        ) : (
          /* Multi-Step Intake Form */
          <Box component="form" onSubmit={handleSubmit}>
            {stepError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                {stepError}
              </Alert>
            )}

            {/* STEP 1: ABOUT YOU */}
            {activeStep === 0 && (
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {t('components.leadForm.step1.heading', { defaultValue: 'Step 1 — Identity Information' })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('components.leadForm.step1.subheading', {
                      defaultValue:
                        'Please provide your legal name and date of birth as shown on your passport.',
                    })}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    id="inquiry-first-name-input"
                    label={String(t('components.leadForm.fields.firstName', { defaultValue: 'First Name (名)' }))}
                    placeholder="e.g. San"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    id="inquiry-last-name-input"
                    label={String(t('components.leadForm.fields.lastName', { defaultValue: 'Last Name (姓)' }))}
                    placeholder="e.g. Zhang"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </Grid>

                {/* Exact Date of Birth with live age derivation */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    id="inquiry-dob-input"
                    label={String(t('components.leadForm.fields.dateOfBirth', { defaultValue: 'Date of Birth (出生日期)' }))}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ max: new Date().toISOString().split('T')[0], min: '1920-01-01' }}
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    disabled={isSubmitting}
                    helperText={
                      derivedAge !== null
                        ? t('components.leadForm.fields.ageCalculated', {
                            defaultValue: 'Age: {{age}}周岁 • {{category}}',
                            age: derivedAge,
                            category: derivedAgeBand,
                          })
                        : t('components.leadForm.fields.dobHelp', {
                            defaultValue: 'Exact DOB is used to calculate partner age eligibility and youth discounts.',
                          })
                    }
                  />
                  {derivedAge !== null && (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        color={derivedAge >= 18 && derivedAge <= 26 ? 'success' : 'primary'}
                        icon={<CalendarTodayOutlined sx={{ fontSize: 14 }} />}
                        label={`Age: ${derivedAge} • ${derivedAgeBand}`}
                        sx={{ fontWeight: 600, fontSize: '0.78rem' }}
                      />
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="gender-label">
                      {t('components.leadForm.fields.gender', { defaultValue: 'Gender (性别)' })}
                    </InputLabel>
                    <Select
                      labelId="gender-label"
                      id="inquiry-gender-select"
                      label={String(t('components.leadForm.fields.gender', { defaultValue: 'Gender (性别)' }))}
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <MenuItem value="male">{t('common.genderMale', { defaultValue: 'Male (男)' })}</MenuItem>
                      <MenuItem value="female">{t('common.genderFemale', { defaultValue: 'Female (女)' })}</MenuItem>
                      <MenuItem value="other">{t('common.genderOther', { defaultValue: 'Other (其他)' })}</MenuItem>
                      <MenuItem value="prefer_not_to_say">
                        {t('common.genderPreferNot', { defaultValue: 'Prefer not to say (暂不透露)' })}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    id="inquiry-nationality-input"
                    label={String(t('components.leadForm.fields.nationality', { defaultValue: 'Nationality (国籍)' }))}
                    placeholder="e.g. Chinese / China"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    disabled={isSubmitting}
                  />
                </Grid>
              </Grid>
            )}

            {/* STEP 2: STAY & INSURANCE NEEDS */}
            {activeStep === 1 && (
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {t('components.leadForm.step2.heading', { defaultValue: 'Step 2 — Situation & Insurance Needs' })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('components.leadForm.step2.subheading', {
                      defaultValue:
                        'Tell us about your visa status and insurance period in the Czech Republic.',
                    })}
                  </Typography>
                </Grid>

                {/* Are you a student? */}
                <Grid item xs={12} sm={6}>
                  <FormControl component="fieldset" fullWidth>
                    <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 0.5 }}>
                      {t('components.leadForm.fields.studentQuestion', { defaultValue: 'Are you a student in Czechia? (是否为留学生)' })}
                    </FormLabel>
                    <RadioGroup
                      row
                      value={isStudent ? 'yes' : 'no'}
                      onChange={(e) => setIsStudent(e.target.value === 'yes')}
                    >
                      <FormControlLabel value="yes" control={<Radio color="primary" />} label="Yes (留学生)" />
                      <FormControlLabel value="no" control={<Radio color="primary" />} label="No (非学生/工作/其他)" />
                    </RadioGroup>
                  </FormControl>
                </Grid>

                {/* Conditional School/University */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="inquiry-school-input"
                    label={String(
                      t('components.leadForm.fields.school', {
                        defaultValue: isStudent
                          ? 'School / University (就读院校，选填)'
                          : 'Company / Organization (单位/机构，选填)',
                      })
                    )}
                    placeholder={isStudent ? 'e.g. CTU in Prague / Charles University / VŠE' : 'e.g. Prague IT'}
                    value={schoolOrUniversity}
                    onChange={(e) => setSchoolOrUniversity(e.target.value)}
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="stay-type-select-label">
                      {t('components.leadForm.fields.typeOfStay', { defaultValue: 'Type of Stay (居留类型)' })}
                    </InputLabel>
                    <Select
                      labelId="stay-type-select-label"
                      id="inquiry-stay-type-select"
                      label={String(t('components.leadForm.fields.typeOfStay', { defaultValue: 'Type of Stay (居留类型)' }))}
                      value={typeOfStay}
                      onChange={(e) => setTypeOfStay(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <MenuItem value="student">{t('components.leadForm.stay.student', { defaultValue: 'Student Visa / Residence (留学生)' })}</MenuItem>
                      <MenuItem value="employee">{t('components.leadForm.stay.employee', { defaultValue: 'Employee Card / Work (工作居留)' })}</MenuItem>
                      <MenuItem value="family">{t('components.leadForm.stay.family', { defaultValue: 'Family Reunification (家庭团聚)' })}</MenuItem>
                      <MenuItem value="other">{t('components.leadForm.stay.other', { defaultValue: 'Other / Long-term Travel (其他居留)' })}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    id="inquiry-start-date-input"
                    label={String(t('components.leadForm.fields.startDate', { defaultValue: 'Requested Start Date (起保日期)' }))}
                    InputLabelProps={{ shrink: true }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="duration-preset-label">
                      {t('components.leadForm.fields.duration', { defaultValue: 'Coverage Duration (申请保期)' })}
                    </InputLabel>
                    <Select
                      labelId="duration-preset-label"
                      id="inquiry-duration-preset-select"
                      label={String(t('components.leadForm.fields.duration', { defaultValue: 'Coverage Duration (申请保期)' }))}
                      value={durationPreset}
                      onChange={(e) => setDurationPreset(e.target.value as any)}
                      disabled={isSubmitting}
                    >
                      <MenuItem value="12">12 {t('common.months', { defaultValue: 'months (1 year - OAMP Standard)' })}</MenuItem>
                      <MenuItem value="24">24 {t('common.months', { defaultValue: 'months (2 years - Extended Visa)' })}</MenuItem>
                      <MenuItem value="6">6 {t('common.months', { defaultValue: 'months (1 semester)' })}</MenuItem>
                      <MenuItem value="3">3 {t('common.months', { defaultValue: 'months (Short-term stay)' })}</MenuItem>
                      <MenuItem value="custom">{t('common.custom', { defaultValue: 'Custom duration (自定义月数)' })}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {durationPreset === 'custom' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      id="inquiry-custom-duration-input"
                      label={String(t('components.leadForm.fields.customMonths', { defaultValue: 'Number of Months (月数)' }))}
                      inputProps={{ min: 1, max: 60 }}
                      value={customDurationMonths}
                      onChange={(e) => setCustomDurationMonths(Number(e.target.value))}
                      disabled={isSubmitting}
                    />
                  </Grid>
                )}

                <Grid item xs={12} sm={durationPreset === 'custom' ? 12 : 6}>
                  <TextField
                    fullWidth
                    id="inquiry-location-input"
                    label={String(t('components.leadForm.fields.location', { defaultValue: 'Czech City / Location (捷克所在城市，选填)' }))}
                    placeholder="e.g. Prague / Brno / Ostrava"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    id="inquiry-notes-input"
                    label={String(t('components.leadForm.fields.specialNotes', { defaultValue: 'Special Notes / Visa Timeline (备注/递签安排，选填)' }))}
                    placeholder="e.g. Visa appointment is scheduled for next Monday, need confirmation certificate ASAP..."
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    disabled={isSubmitting}
                  />
                </Grid>
              </Grid>
            )}

            {/* STEP 3: CONTACT & CHINESE STUDENT PREFERENCES */}
            {activeStep === 2 && (
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {t('components.leadForm.step3.heading', { defaultValue: 'Step 3 — Contact & Communication Preferences' })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('components.leadForm.step3.subheading', {
                      defaultValue:
                        'We support direct communication via WeChat or Phone to assist international students smoothly.',
                    })}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="email"
                    id="inquiry-email-input"
                    label={String(t('components.leadForm.fields.email', { defaultValue: 'Email Address (电子邮箱)' }))}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="inquiry-phone-input"
                    label={String(t('components.leadForm.fields.phone', { defaultValue: 'Phone Number (电话号码)' }))}
                    placeholder="+420 123 456 789 or +86 138..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting}
                    helperText={t('components.leadForm.fields.phoneHelp', { defaultValue: 'Include country code (+420 or +86)' })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="inquiry-wechat-input"
                    label={String(t('components.leadForm.fields.wechat', { defaultValue: 'WeChat ID (微信号，留学生推荐)' }))}
                    placeholder="e.g. your_wechat_id"
                    value={wechatId}
                    onChange={(e) => setWechatId(e.target.value)}
                    disabled={isSubmitting}
                    helperText={t('components.leadForm.fields.wechatHelp', {
                      defaultValue: 'Recommended for Chinese students for fast document coordination.',
                    })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="preferred-contact-label">
                      {t('components.leadForm.fields.preferredContact', { defaultValue: 'Preferred Contact Method (首选联系方式)' })}
                    </InputLabel>
                    <Select
                      labelId="preferred-contact-label"
                      id="inquiry-preferred-contact-select"
                      label={String(t('components.leadForm.fields.preferredContact', { defaultValue: 'Preferred Contact Method (首选联系方式)' }))}
                      value={preferredContactMethod}
                      onChange={(e) => setPreferredContactMethod(e.target.value as any)}
                      disabled={isSubmitting}
                    >
                      <MenuItem value="email">{t('common.contactEmail', { defaultValue: 'Email (电子邮箱)' })}</MenuItem>
                      <MenuItem value="wechat">{t('common.contactWechat', { defaultValue: 'WeChat (微信)' })}</MenuItem>
                      <MenuItem value="phone">{t('common.contactPhone', { defaultValue: 'Phone / WhatsApp (电话)' })}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="preferred-lang-label">
                      {t('components.leadForm.fields.preferredLanguage', { defaultValue: 'Preferred Language (沟通语言)' })}
                    </InputLabel>
                    <Select
                      labelId="preferred-lang-label"
                      id="inquiry-preferred-lang-select"
                      label={String(t('components.leadForm.fields.preferredLanguage', { defaultValue: 'Preferred Language (沟通语言)' }))}
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value as any)}
                      disabled={isSubmitting}
                    >
                      <MenuItem value="zh">中文 (Chinese Assistance)</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="cs">Čeština (Czech)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}

            {/* STEP 4: REVIEW & CONSENT (ONE SUBMISSION) */}
            {activeStep === 3 && (
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {t('components.leadForm.step4.heading', { defaultValue: 'Step 4 — Review Dossier & Authorize Referral' })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('components.leadForm.step4.subheading', {
                      defaultValue:
                        'Please verify your submitted parameters. After your confirmation, your structured enquiry will be forwarded to České pojištění a.s.',
                    })}
                  </Typography>
                </Box>

                {/* Structured Summary Paper */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: '16px',
                    backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : 'rgba(30, 41, 59, 0.7)',
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {t('components.leadForm.review.applicant', { defaultValue: 'APPLICANT IDENTITY' })}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {firstName} {lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        DOB: {dateOfBirth} (Age: {derivedAge} • {derivedAgeBand})
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Nationality: {nationality} • Gender: {gender}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {t('components.leadForm.review.stayAndInsurance', { defaultValue: 'INSURANCE REQUEST' })}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {isStudent ? `Student (${schoolOrUniversity || 'University'})` : 'Non-Student Stay'} • {typeOfStay}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Start Date: {startDate} • Duration: {effectiveDurationMonths} months
                      </Typography>
                      {currentLocation && (
                        <Typography variant="body2" color="text.secondary">
                          Location: {currentLocation}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {t('components.leadForm.review.contactChannel', { defaultValue: 'CONTACT & PREFERENCES' })}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                        Email: {email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Phone: {phone || 'Not provided'} • WeChat: {wechatId || 'Not provided'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Preferred: {preferredContactMethod.toUpperCase()} • Language: {preferredLanguage.toUpperCase()}
                      </Typography>
                    </Grid>

                    {(utmSource || referralCode) && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          {t('components.leadForm.review.attribution', { defaultValue: 'MARKETING ATTRIBUTION' })}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {utmSource && (
                            <Chip
                              size="small"
                              label={`Source: ${utmSource}${utmCampaign ? ` / ${utmCampaign}` : ''}`}
                              sx={{ mr: 1, mb: 0.5 }}
                            />
                          )}
                          {referralCode && (
                            <Chip size="small" color="primary" label={`Ref: ${referralCode}`} sx={{ mb: 0.5 }} />
                          )}
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>

                {/* Single, Clear Consent Checkbox */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: '16px',
                    backgroundColor:
                      theme.palette.mode === 'light' ? 'rgba(79, 70, 229, 0.03)' : 'rgba(79, 70, 229, 0.08)',
                    borderColor: handoffConsent ? 'primary.main' : 'divider',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        id="inquiry-consent-checkbox"
                        checked={handoffConsent}
                        onChange={(e) => setHandoffConsent(e.target.checked)}
                        color="primary"
                        disabled={isSubmitting}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontSize: '0.88rem', lineHeight: 1.6, fontWeight: 500 }}>
                        {t('components.leadForm.consentNotice', {
                          defaultValue:
                            'I agree that HKTSE s.r.o. may forward my insurance enquiry and contact details to České pojištění a.s. so that they can handle my request and provide the relevant insurance information.',
                        })}
                      </Typography>
                    }
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, pl: 4 }}>
                    {t('components.leadForm.consentSubtext', {
                      defaultValue:
                        'Your personal data is collected solely to structure your enquiry and enable České pojištění a.s. to prepare insurance options. You can read our ',
                    })}
                    <MuiLink href="/privacy" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 600 }}>
                      {t('common.privacyPolicy', { defaultValue: 'Privacy Notice' })}
                    </MuiLink>{' '}
                    {t('common.and', { defaultValue: 'and' })}{' '}
                    <MuiLink href="/terms" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 600 }}>
                      {t('common.termsOfService', { defaultValue: 'Terms of Service' })}
                    </MuiLink>
                    .
                  </Typography>
                </Paper>
              </Stack>
            )}

            {/* Step Navigation Button Row */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {activeStep > 0 ? (
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  startIcon={<ArrowBackOutlined />}
                  sx={{ px: 3, py: 1.2, borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                >
                  {t('navigation.back', { defaultValue: 'Back' })}
                </Button>
              ) : (
                <Box />
              )}

              {activeStep < 3 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  endIcon={<ArrowForwardOutlined />}
                  sx={{
                    px: 4,
                    py: 1.2,
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                  }}
                >
                  {t('navigation.next', { defaultValue: 'Next Step' })}
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting || !handoffConsent}
                  startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendOutlined />}
                  sx={{
                    px: 4.5,
                    py: 1.4,
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(79, 70, 229, 0.35)',
                    textTransform: 'none',
                  }}
                >
                  {isSubmitting
                    ? t('components.leadForm.submitting', { defaultValue: 'Submitting Enquiry...' })
                    : t('components.leadForm.submitEnquiry', { defaultValue: 'Submit Insurance Request (提交需求)' })}
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default LeadInquiryForm;
