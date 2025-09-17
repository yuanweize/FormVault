import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AddressField } from '../AddressField';
import { PersonalInfo } from '../../../../types';
import '../../../../i18n/config';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'forms.personalInfo.fields.address.street': 'Street Address',
        'forms.personalInfo.fields.address.city': 'City',
        'forms.personalInfo.fields.address.state': 'State/Province',
        'forms.personalInfo.fields.address.zipCode': 'ZIP/Postal Code',
        'forms.personalInfo.fields.address.country': 'Country',
        'forms.personalInfo.countries.US': 'United States',
        'forms.personalInfo.countries.CA': 'Canada',
        'forms.personalInfo.countries.MX': 'Mexico',
        'forms.personalInfo.validation.address.street.required': 'Street address is required',
        'forms.personalInfo.validation.address.city.required': 'City is required',
        'forms.personalInfo.validation.address.state.required': 'State/Province is required',
        'forms.personalInfo.validation.address.zipCode.required': 'ZIP/Postal code is required',
        'forms.personalInfo.validation.address.country.required': 'Please select a country',
      };
      return translations[key] || key;
    },
  }),
}));

const theme = createTheme();

// Test wrapper component
const TestWrapper: React.FC<{ disabled?: boolean }> = ({ disabled = false }) => {
  const { control, formState: { errors } } = useForm<PersonalInfo>({
    mode: 'onChange',
    defaultValues: {
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <AddressField
        control={control}
        errors={errors.address}
        disabled={disabled}
      />
    </ThemeProvider>
  );
};

describe('AddressField', () => {
  it('renders all address fields', () => {
    render(<TestWrapper />);

    expect(screen.getByLabelText('Street Address')).toBeInTheDocument();
    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('State/Province')).toBeInTheDocument();
    expect(screen.getByLabelText('ZIP/Postal Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Country')).toBeInTheDocument();
  });

  it('allows user to input address information', async () => {
    const user = userEvent.setup();
    
    render(<TestWrapper />);

    const streetField = screen.getByLabelText('Street Address');
    const cityField = screen.getByLabelText('City');
    const stateField = screen.getByLabelText('State/Province');
    const zipField = screen.getByLabelText('ZIP/Postal Code');

    await user.type(streetField, '123 Main Street');
    await user.type(cityField, 'New York');
    await user.type(stateField, 'NY');
    await user.type(zipField, '10001');

    expect(streetField).toHaveValue('123 Main Street');
    expect(cityField).toHaveValue('New York');
    expect(stateField).toHaveValue('NY');
    expect(zipField).toHaveValue('10001');
  });

  it('allows user to select country from dropdown', async () => {
    const user = userEvent.setup();
    
    render(<TestWrapper />);

    const countrySelect = screen.getByLabelText('Country');
    await user.click(countrySelect);

    // Check that country options are available
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('Canada')).toBeInTheDocument();
    expect(screen.getByText('Mexico')).toBeInTheDocument();

    // Select a country
    await user.click(screen.getByText('United States'));
    
    // The select should now show the selected value
    expect(countrySelect).toHaveValue('US');
  });

  it('disables all fields when disabled prop is true', () => {
    render(<TestWrapper disabled={true} />);

    expect(screen.getByLabelText('Street Address')).toBeDisabled();
    expect(screen.getByLabelText('City')).toBeDisabled();
    expect(screen.getByLabelText('State/Province')).toBeDisabled();
    expect(screen.getByLabelText('ZIP/Postal Code')).toBeDisabled();
    expect(screen.getByLabelText('Country')).toBeDisabled();
  });

  it('has proper accessibility attributes', () => {
    render(<TestWrapper />);

    const streetField = screen.getByLabelText('Street Address');
    expect(streetField).toHaveAttribute('aria-label', 'Street Address');

    const cityField = screen.getByLabelText('City');
    expect(cityField).toHaveAttribute('aria-label', 'City');

    const countrySelect = screen.getByLabelText('Country');
    expect(countrySelect).toHaveAttribute('aria-label', 'Country');
  });
});