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
import { PersonalInfo, InsuranceType } from '../../types';
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

  return (
    <Paper elevation={2} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        {t('forms.personalInfo.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        {t('forms.personalInfo.subtitle')}
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onFormSubmit)} noValidate>
        <Grid container spacing={3}>
          {/* Personal Details Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              {t('forms.personalInfo.sections.personal')}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="firstName"
              control={control}
              rules={{
                required: t('forms.personalInfo.validation.firstName.required'),
                minLength: {
                  value: 2,
                  message: t('forms.personalInfo.validation.firstName.minLength'),
                },
                maxLength: {
                  value: 50,
                  message: t('forms.personalInfo.validation.firstName.maxLength'),
                },
                pattern: {
                  value: /^[a-zA-Z\s\-']+$/,
                  message: t('forms.personalInfo.validation.firstName.pattern'),
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('forms.personalInfo.fields.firstName')}
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  disabled={isLoading}
                  inputProps={{
                    'aria-label': t('forms.personalInfo.fields.firstName'),
                    'aria-describedby': errors.firstName ? 'firstName-error' : undefined,
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="lastName"
              control={control}
              rules={{
                required: t('forms.personalInfo.validation.lastName.required'),
                minLength: {
                  value: 2,
                  message: t('forms.personalInfo.validation.lastName.minLength'),
                },
                maxLength: {
                  value: 50,
                  message: t('forms.personalInfo.validation.lastName.maxLength'),
                },
                pattern: {
                  value: /^[a-zA-Z\s\-']+$/,
                  message: t('forms.personalInfo.validation.lastName.pattern'),
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label={t('forms.personalInfo.fields.lastName')}
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  disabled={isLoading}
                  inputProps={{
                    'aria-label': t('forms.personalInfo.fields.lastName'),
                    'aria-describedby': errors.lastName ? 'lastName-error' : undefined,
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="email"
              control={control}
              rules={{
                required: t('forms.personalInfo.validation.email.required'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('forms.personalInfo.validation.email.pattern'),
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="email"
                  label={t('forms.personalInfo.fields.email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={isLoading}
                  inputProps={{
                    'aria-label': t('forms.personalInfo.fields.email'),
                    'aria-describedby': errors.email ? 'email-error' : undefined,
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="phone"
              control={control}
              rules={{
                required: t('forms.personalInfo.validation.phone.required'),
                pattern: {
                  value: /^[\+]?[1-9][\d]{0,15}$/,
                  message: t('forms.personalInfo.validation.phone.pattern'),
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="tel"
                  label={t('forms.personalInfo.fields.phone')}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  disabled={isLoading}
                  inputProps={{
                    'aria-label': t('forms.personalInfo.fields.phone'),
                    'aria-describedby': errors.phone ? 'phone-error' : undefined,
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <DateField
              name="dateOfBirth"
              control={control}
              label={t('forms.personalInfo.fields.dateOfBirth')}
              error={errors.dateOfBirth}
              disabled={isLoading}
              rules={{
                required: t('forms.personalInfo.validation.dateOfBirth.required'),
                validate: (value: string) => {
                  const date = new Date(value);
                  const today = new Date();
                  const age = today.getFullYear() - date.getFullYear();
                  
                  if (date > today) {
                    return t('forms.personalInfo.validation.dateOfBirth.future');
                  }
                  
                  if (age < 18) {
                    return t('forms.personalInfo.validation.dateOfBirth.minAge');
                  }
                  
                  if (age > 120) {
                    return t('forms.personalInfo.validation.dateOfBirth.maxAge');
                  }
                  
                  return true;
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.insuranceType} disabled={isLoading}>
              <InputLabel id="insurance-type-label">
                {t('forms.personalInfo.fields.insuranceType')}
              </InputLabel>
              <Controller
                name="insuranceType"
                control={control}
                rules={{
                  required: t('forms.personalInfo.validation.insuranceType.required'),
                }}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="insurance-type-label"
                    label={t('forms.personalInfo.fields.insuranceType')}
                    inputProps={{
                      'aria-label': t('forms.personalInfo.fields.insuranceType'),
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

          {/* Address Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              {t('forms.personalInfo.sections.address')}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <AddressField
              control={control}
              errors={errors.address}
              disabled={isLoading}
            />
          </Grid>

          {/* Form Actions */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={isLoading}
                  sx={{ minWidth: 120 }}
                >
                  {t('navigation.cancel')}
                </Button>
              )}
              
              <Button
                type="submit"
                variant="contained"
                disabled={!isValid || isLoading}
                sx={{ minWidth: 120, ml: 'auto' }}
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