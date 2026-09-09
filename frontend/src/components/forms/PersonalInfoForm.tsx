import React from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { PersonalInfo, InsuranceType, Address } from '../../types';
import { AddressField } from './fields/AddressField';
import { DateField } from './fields/DateField';

interface PersonalInfoFormProps {
  initialData?: Partial<PersonalInfo>;
  onSubmit: (data: PersonalInfo) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    setValue,
  } = useForm<PersonalInfo>({
    mode: 'onChange',
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: {
        street: initialData?.address?.street || '',
        city: initialData?.address?.city || '',
        state: initialData?.address?.state || '',
        zipCode: initialData?.address?.zipCode || '',
        country: initialData?.address?.country || '',
      },
      dateOfBirth: initialData?.dateOfBirth || '',
      insuranceType: initialData?.insuranceType || 'health',
      gender: initialData?.gender || 'male',
      nationality: initialData?.nationality || '',
      placeOfBirth: initialData?.placeOfBirth || '',
      passportNumber: initialData?.passportNumber || '',
      passportExpiryDate: initialData?.passportExpiryDate || '',
      insuranceCommencementDate: initialData?.insuranceCommencementDate || '',
      insuranceDurationMonths: initialData?.insuranceDurationMonths || 12,
      typeOfStay: initialData?.typeOfStay || 'student',
    },
  });

  const insuranceTypes: { value: InsuranceType; label: string }[] = [
    { value: 'health', label: t('forms.personalInfo.insuranceTypes.health') },
    { value: 'auto', label: t('forms.personalInfo.insuranceTypes.auto') },
    { value: 'life', label: t('forms.personalInfo.insuranceTypes.life') },
    { value: 'travel', label: t('forms.personalInfo.insuranceTypes.travel') },
  ];

  const onFormSubmit = (data: PersonalInfo) => {
    onSubmit(data);
  };

  const onError = (errors: any) => {
    console.error('Form Validation Failed:', errors);
    // Find first error and scroll to it
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      // Try to find element by name attribute (standard Mui TextField)
      const element = document.querySelector(`[name="${firstErrorKey}"]`);
      if (element) {
        if (typeof element.scrollIntoView === 'function') {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (typeof (element as HTMLElement).focus === 'function') {
          (element as HTMLElement).focus();
        }
      }
    }
  };

  return (
    <Paper
      elevation={3} // Better elevation for premium feel
      sx={{
        p: { xs: 2, sm: 3, md: 5 }, // More padding
        mx: { xs: 0, sm: 'auto' },
        maxWidth: '100%',
        borderRadius: 3, // Rounder corners
      }}
    >
      <Typography
        variant="h4" // Larger title
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 700,
          fontSize: { xs: '1.5rem', sm: '2rem' },
          textAlign: { xs: 'center', sm: 'left' },
          color: 'primary.main',
        }}
      >
        {t('forms.personalInfo.title')}
      </Typography>
      <Typography
        variant="body1" // Larger body text
        color="text.secondary"
        paragraph
        sx={{
          textAlign: { xs: 'center', sm: 'left' },
          mb: { xs: 3, sm: 4 },
        }}
      >
        {t('forms.personalInfo.subtitle')}
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onFormSubmit, onError)} noValidate>
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Personal Details Section */}
          <Grid item xs={12}>
            <Typography
              variant="h6"
              component="h2"
              gutterBottom
              sx={{
                mt: { xs: 1, sm: 2 },
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
              }}
            >
              {t('forms.personalInfo.sections.personal')}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="firstName"
              control={control}
              rules={{
                required: t('forms.personalInfo.validation.firstName.required') as string,
                minLength: {
                  value: 2,
                  message: t('forms.personalInfo.validation.firstName.minLength') as string,
                },
                maxLength: {
                  value: 50,
                  message: t('forms.personalInfo.validation.firstName.maxLength') as string,
                },
                pattern: {
                  value: /^[\p{L}\s\-']+$/u,
                  message: t('forms.personalInfo.validation.firstName.pattern') as string,
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="medium"
                  label={t('forms.personalInfo.fields.firstName')}
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  disabled={isLoading}
                  inputProps={{
                    'data-testid': 'first-name-input',
                    'aria-label': t('forms.personalInfo.fields.firstName') as string,
                    'aria-describedby': errors.firstName ? 'firstName-error' : undefined,
                  }}
                  FormHelperTextProps={{
                    id: 'firstName-error',
                    role: 'alert',
                    'aria-live': 'polite',
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="lastName"
              control={control}
              rules={{
                required: t('forms.personalInfo.validation.lastName.required') as string,
                minLength: {
                  value: 2,
                  message: t('forms.personalInfo.validation.lastName.minLength') as string,
                },
                maxLength: {
                  value: 50,
                  message: t('forms.personalInfo.validation.lastName.maxLength') as string,
                },
                pattern: {
                  value: /^[\p{L}\s\-']+$/u,
                  message: t('forms.personalInfo.validation.lastName.pattern') as string,
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="medium"
                  label={t('forms.personalInfo.fields.lastName')}
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  disabled={isLoading}
                  inputProps={{
                    'data-testid': 'last-name-input',
                    'aria-label': t('forms.personalInfo.fields.lastName') as string,
                    'aria-describedby': errors.lastName ? 'lastName-error' : undefined,
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="email"
              control={control}
              rules={{
                required: t('forms.personalInfo.validation.email.required') as string,
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('forms.personalInfo.validation.email.pattern') as string,
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="medium"
                  type="email"
                  label={t('forms.personalInfo.fields.email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={isLoading}
                  inputProps={{
                    'data-testid': 'email-input',
                    'aria-label': t('forms.personalInfo.fields.email') as string,
                    'aria-describedby': errors.email ? 'email-error' : undefined,
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="phone"
              control={control}
              rules={{
                required: t('forms.personalInfo.validation.phone.required') as string,
                pattern: {
                  value: /^[\+]?[1-9][\d]{0,15}$/,
                  message: t('forms.personalInfo.validation.phone.pattern') as string,
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="medium"
                  type="tel"
                  label={t('forms.personalInfo.fields.phone')}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  disabled={isLoading}
                  inputProps={{
                    'data-testid': 'phone-input',
                    'aria-label': t('forms.personalInfo.fields.phone') as string,
                    'aria-describedby': errors.phone ? 'phone-error' : undefined,
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DateField
              name="dateOfBirth"
              control={control}
              label={t('forms.personalInfo.fields.dateOfBirth')}
              error={errors.dateOfBirth}
              disabled={isLoading}
              rules={{
                required: t('forms.personalInfo.validation.dateOfBirth.required') as string,
                validate: (value: any) => {
                  if (typeof value !== 'string') return true;
                  const date = new Date(value);
                  const today = new Date();
                  const age = today.getFullYear() - date.getFullYear();

                  if (date > today) {
                    return t('forms.personalInfo.validation.dateOfBirth.future') as string;
                  }

                  if (age < 18) {
                    return t('forms.personalInfo.validation.dateOfBirth.minAge') as string;
                  }

                  if (age > 120) {
                    return t('forms.personalInfo.validation.dateOfBirth.maxAge') as string;
                  }

                  return true;
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errors.insuranceType} disabled={isLoading} size="medium">
              <InputLabel id="insurance-type-label">
                {t('forms.personalInfo.fields.insuranceType')}
              </InputLabel>
              <Controller
                name="insuranceType"
                control={control}
                rules={{
                  required: t('forms.personalInfo.validation.insuranceType.required') as string,
                }}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="insurance-type-label"
                    label={t('forms.personalInfo.fields.insuranceType') as string}
                    data-testid="insurance-type-select"
                    inputProps={{
                      'aria-label': t('forms.personalInfo.fields.insuranceType') as string,
                      'aria-describedby': errors.insuranceType ? 'insuranceType-error' : undefined,
                    }}
                  >
                    {insuranceTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.insuranceType && (
                <FormHelperText id="insuranceType-error">
                  {errors.insuranceType.message}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Czech Underwriting & Policy Details Section */}
          <Grid item xs={12}>
            <Typography
              variant="h6"
              component="h2"
              gutterBottom
              sx={{
                mt: { xs: 2, sm: 3 },
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <span>{t('forms.personalInfo.sections.underwriting', { defaultValue: 'Underwriting & Policy Specifications (Czech Registry Data)' })}</span>
            </Typography>
          </Grid>

          {/* Gender Field */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="medium" disabled={isLoading}>
              <InputLabel id="gender-select-label">
                {t('forms.personalInfo.fields.gender', { defaultValue: 'Gender' })}
              </InputLabel>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="gender-select-label"
                    label={t('forms.personalInfo.fields.gender', { defaultValue: 'Gender' })}
                  >
                    <MenuItem value="male">{t('forms.personalInfo.genderOptions.male', { defaultValue: 'Male (Muž)' })}</MenuItem>
                    <MenuItem value="female">{t('forms.personalInfo.genderOptions.female', { defaultValue: 'Female (Žena)' })}</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </Grid>

          {/* Nationality Field */}
          <Grid item xs={12} md={4}>
            <Controller
              name="nationality"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="medium"
                  label={t('forms.personalInfo.fields.nationality', { defaultValue: 'Nationality / Citizenship' })}
                  placeholder={String(t('forms.personalInfo.placeholders.nationality', { defaultValue: 'e.g. CHINA, UKRAINE, INDIA' }))}
                  disabled={isLoading}
                />
              )}
            />
          </Grid>

          {/* Place of Birth Field */}
          <Grid item xs={12} md={4}>
            <Controller
              name="placeOfBirth"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="medium"
                  label={t('forms.personalInfo.fields.placeOfBirth', { defaultValue: 'Place of Birth (City)' })}
                  placeholder={String(t('forms.personalInfo.placeholders.placeOfBirth', { defaultValue: 'e.g. Prague, Beijing, Kyiv' }))}
                  disabled={isLoading}
                />
              )}
            />
          </Grid>

          {/* Passport Number Field */}
          <Grid item xs={12} md={4}>
            <Controller
              name="passportNumber"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  size="medium"
                  label={t('forms.personalInfo.fields.passportNumber', { defaultValue: 'Passport Number' })}
                  placeholder={String(t('forms.personalInfo.placeholders.passportNumber', { defaultValue: 'e.g. EC1234567' }))}
                  disabled={isLoading}
                />
              )}
            />
          </Grid>

          {/* Type of Stay Field */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="medium" disabled={isLoading}>
              <InputLabel id="stay-select-label">
                {t('forms.personalInfo.fields.typeOfStay', { defaultValue: 'Type of Stay in CZ' })}
              </InputLabel>
              <Controller
                name="typeOfStay"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="stay-select-label"
                    label={t('forms.personalInfo.fields.typeOfStay', { defaultValue: 'Type of Stay in CZ' })}
                  >
                    <MenuItem value="student">{t('forms.personalInfo.stayOptions.student', { defaultValue: 'University Student' })}</MenuItem>
                    <MenuItem value="employment">{t('forms.personalInfo.stayOptions.employment', { defaultValue: 'Employment / Work Permit' })}</MenuItem>
                    <MenuItem value="business">{t('forms.personalInfo.stayOptions.business', { defaultValue: 'Trade License / Business' })}</MenuItem>
                    <MenuItem value="family">{t('forms.personalInfo.stayOptions.family', { defaultValue: 'Family Reunification' })}</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </Grid>

          {/* Duration of Insurance Months Field */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="medium" disabled={isLoading}>
              <InputLabel id="duration-select-label">
                {t('forms.personalInfo.fields.duration', { defaultValue: 'Insurance Duration' })}
              </InputLabel>
              <Controller
                name="insuranceDurationMonths"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="duration-select-label"
                    label={t('forms.personalInfo.fields.duration', { defaultValue: 'Insurance Duration' })}
                  >
                    <MenuItem value={6}>{t('forms.personalInfo.durationOptions.m6', { defaultValue: '6 Months' })}</MenuItem>
                    <MenuItem value={12}>{t('forms.personalInfo.durationOptions.m12', { defaultValue: '12 Months (1 Year)' })}</MenuItem>
                    <MenuItem value={24}>{t('forms.personalInfo.durationOptions.m24', { defaultValue: '24 Months (2 Years)' })}</MenuItem>
                    <MenuItem value={36}>{t('forms.personalInfo.durationOptions.m36', { defaultValue: '36 Months (3 Years)' })}</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
          </Grid>

          {/* Insurance Commencement Date */}
          <Grid item xs={12} md={6}>
            <Controller
              name="insuranceCommencementDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="date"
                  size="medium"
                  label={t('forms.personalInfo.fields.commencementDate', { defaultValue: 'Insurance Start Date (Počátek pojištění)' })}
                  InputLabelProps={{ shrink: true }}
                  disabled={isLoading}
                />
              )}
            />
          </Grid>

          {/* Passport Expiry Date */}
          <Grid item xs={12} md={6}>
            <Controller
              name="passportExpiryDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="date"
                  size="medium"
                  label={t('forms.personalInfo.fields.passportExpiry', { defaultValue: 'Passport Expiration Date' })}
                  InputLabelProps={{ shrink: true }}
                  disabled={isLoading}
                />
              )}
            />
          </Grid>

          {/* Address Section */}
          <Grid item xs={12} role="group" aria-labelledby="address-section-title">
            <Typography
              id="address-section-title"
              variant="h6"
              component="h2"
              gutterBottom
              sx={{
                mt: { xs: 2, sm: 3 },
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
              }}
            >
              {t('forms.personalInfo.sections.address')}
            </Typography>
            <AddressField
              control={control}
              setValue={setValue}
              errors={errors.address as any}
              disabled={isLoading}
            />
          </Grid>

          {/* Form Actions */}
          <Grid item xs={12}>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              gap: { xs: 2, sm: 0 },
              mt: { xs: 2, sm: 3 },
            }}>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={isLoading}
                  sx={{
                    minWidth: { xs: '100%', sm: 120 },
                    order: { xs: 2, sm: 1 },
                  }}
                >
                  {t('navigation.cancel')}
                </Button>
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{
                  minWidth: { xs: '100%', sm: 120 },
                  ml: { xs: 0, sm: 'auto' },
                  order: { xs: 1, sm: 2 },
                }}
              >
                {isLoading ? t('forms.personalInfo.submitting') : t('navigation.next')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default PersonalInfoForm;