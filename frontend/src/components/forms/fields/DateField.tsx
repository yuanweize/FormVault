import React from 'react';
import { TextField } from '@mui/material';
import { Controller, Control, FieldError, RegisterOptions } from 'react-hook-form';
import { PersonalInfo } from '../../../types';

interface DateFieldProps {
  name: keyof PersonalInfo;
  control: Control<PersonalInfo>;
  label: string;
  error?: FieldError;
  disabled?: boolean;
  rules?: RegisterOptions<PersonalInfo>;
}

const DateField: React.FC<DateFieldProps> = ({
  name,
  control,
  label,
  error,
  disabled = false,
  rules,
}) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          type="date"
          label={label}
          error={!!error}
          helperText={error?.message}
          disabled={disabled}
          InputLabelProps={{
            shrink: true,
          }}
          inputProps={{
            'aria-label': label,
            'aria-describedby': error ? `${name}-error` : undefined,
            max: new Date().toISOString().split('T')[0], // Prevent future dates
          }}
        />
      )}
    />
  );
};

export { DateField };