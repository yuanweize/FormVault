import React from 'react';
import { Grid, TextField, MenuItem, FormControl, InputLabel, Select, FormHelperText } from '@mui/material';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { PersonalInfo, Address } from '../../../types';

interface AddressFieldProps {
  control: Control<PersonalInfo>;
  errors?: FieldErrors<Address>;
  disabled?: boolean;
}

const AddressField: React.FC<AddressFieldProps> = ({ control, errors, disabled = false }) => {
  const { t } = useTranslation();

  const countries = [
    { value: 'US', label: t('forms.personalInfo.countries.US') },
    { value: 'CA', label: t('forms.personalInfo.countries.CA') },
    { value: 'MX', label: t('forms.personalInfo.countries.MX') },
    { value: 'CN', label: t('forms.personalInfo.countries.CN') },
    { value: 'ES', label: t('forms.personalInfo.countries.ES') },
    { value: 'FR', label: t('forms.personalInfo.countries.FR') },
    { value: 'DE', label: t('forms.personalInfo.countries.DE') },
    { value: 'GB', label: t('forms.personalInfo.countries.GB') },
    { value: 'AU', label: t('forms.personalInfo.countries.AU') },
    { value: 'JP', label: t('forms.personalInfo.countries.JP') },
  ];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Controller
          name="address.street"
          control={control}
          rules={{
            required: t('forms.personalInfo.validation.address.street.required'),
            minLength: {
              value: 5,
              message: t('forms.personalInfo.validation.address.street.minLength'),
            },
            maxLength: {
              value: 100,
              message: t('forms.personalInfo.validation.address.street.maxLength'),
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('forms.personalInfo.fields.address.street')}
              error={!!errors?.street}
              helperText={errors?.street?.message}
              disabled={disabled}
              inputProps={{
                'aria-label': t('forms.personalInfo.fields.address.street'),
                'aria-describedby': errors?.street ? 'street-error' : undefined,
              }}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Controller
          name="address.city"
          control={control}
          rules={{
            required: t('forms.personalInfo.validation.address.city.required'),
            minLength: {
              value: 2,
              message: t('forms.personalInfo.validation.address.city.minLength'),
            },
            maxLength: {
              value: 50,
              message: t('forms.personalInfo.validation.address.city.maxLength'),
            },
            pattern: {
              value: /^[a-zA-Z\s\-']+$/,
              message: t('forms.personalInfo.validation.address.city.pattern'),
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('forms.personalInfo.fields.address.city')}
              error={!!errors?.city}
              helperText={errors?.city?.message}
              disabled={disabled}
              inputProps={{
                'aria-label': t('forms.personalInfo.fields.address.city'),
                'aria-describedby': errors?.city ? 'city-error' : undefined,
              }}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Controller
          name="address.state"
          control={control}
          rules={{
            required: t('forms.personalInfo.validation.address.state.required'),
            minLength: {
              value: 2,
              message: t('forms.personalInfo.validation.address.state.minLength'),
            },
            maxLength: {
              value: 50,
              message: t('forms.personalInfo.validation.address.state.maxLength'),
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('forms.personalInfo.fields.address.state')}
              error={!!errors?.state}
              helperText={errors?.state?.message}
              disabled={disabled}
              inputProps={{
                'aria-label': t('forms.personalInfo.fields.address.state'),
                'aria-describedby': errors?.state ? 'state-error' : undefined,
              }}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Controller
          name="address.zipCode"
          control={control}
          rules={{
            required: t('forms.personalInfo.validation.address.zipCode.required'),
            pattern: {
              value: /^[A-Za-z0-9\s\-]{3,10}$/,
              message: t('forms.personalInfo.validation.address.zipCode.pattern'),
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label={t('forms.personalInfo.fields.address.zipCode')}
              error={!!errors?.zipCode}
              helperText={errors?.zipCode?.message}
              disabled={disabled}
              inputProps={{
                'aria-label': t('forms.personalInfo.fields.address.zipCode'),
                'aria-describedby': errors?.zipCode ? 'zipCode-error' : undefined,
              }}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors?.country} disabled={disabled}>
          <InputLabel id="country-label">
            {t('forms.personalInfo.fields.address.country')}
          </InputLabel>
          <Controller
            name="address.country"
            control={control}
            rules={{
              required: t('forms.personalInfo.validation.address.country.required'),
            }}
            render={({ field }) => (
              <Select
                {...field}
                labelId="country-label"
                label={t('forms.personalInfo.fields.address.country')}
                data-testid="country-select"
                inputProps={{
                  'aria-label': t('forms.personalInfo.fields.address.country'),
                  'aria-describedby': errors?.country ? 'country-error' : undefined,
                }}
              >
                {countries.map((country) => (
                  <MenuItem key={country.value} value={country.value}>
                    {country.label}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
          {errors?.country && (
            <FormHelperText id="country-error">
              {errors.country.message}
            </FormHelperText>
          )}
        </FormControl>
      </Grid>
    </Grid>
  );
};

export { AddressField };