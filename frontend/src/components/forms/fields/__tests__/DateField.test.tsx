import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { DateField } from '../DateField';
import { PersonalInfo } from '../../../../types';

const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ disabled?: boolean; initialValue?: string }> = ({ 
  disabled = false, 
  initialValue = '' 
}) => {
  const { control, formState: { errors } } = useForm<PersonalInfo>({
    mode: 'onChange',
    defaultValues: {
      dateOfBirth: initialValue,
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <DateField
        name="dateOfBirth"
        control={control}
        label="Date of Birth"
        error={errors.dateOfBirth}
        disabled={disabled}
        rules={{
          required: 'Date of birth is required',
        }}
      />
    </ThemeProvider>
  );
};

describe('DateField', () => {
  it('renders date input field', () => {
    render(<TestWrapper />);

    const dateField = screen.getByLabelText('Date of Birth');
    expect(dateField).toBeInTheDocument();
    expect(dateField).toHaveAttribute('type', 'date');
  });

  it('allows user to input date', async () => {
    const user = userEvent.setup();
    
    render(<TestWrapper />);

    const dateField = screen.getByLabelText('Date of Birth');
    await user.type(dateField, '1990-01-01');

    expect(dateField).toHaveValue('1990-01-01');
  });

  it('displays initial value when provided', () => {
    render(<TestWrapper initialValue="1985-12-25" />);

    const dateField = screen.getByLabelText('Date of Birth');
    expect(dateField).toHaveValue('1985-12-25');
  });

  it('disables field when disabled prop is true', () => {
    render(<TestWrapper disabled={true} />);

    const dateField = screen.getByLabelText('Date of Birth');
    expect(dateField).toBeDisabled();
  });

  it('has proper accessibility attributes', () => {
    render(<TestWrapper />);

    const dateField = screen.getByLabelText('Date of Birth');
    expect(dateField).toHaveAttribute('aria-label', 'Date of Birth');
    expect(dateField).toHaveAttribute('max'); // Should have max date set to today
  });

  it('sets max date to today to prevent future dates', () => {
    render(<TestWrapper />);

    const dateField = screen.getByLabelText('Date of Birth');
    const today = new Date().toISOString().split('T')[0];
    expect(dateField).toHaveAttribute('max', today);
  });
});