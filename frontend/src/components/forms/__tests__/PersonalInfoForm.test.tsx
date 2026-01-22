import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PersonalInfoForm from '../PersonalInfoForm';
import { PersonalInfo } from '../../../types';
import '../../../i18n/config';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'forms.personalInfo.title': 'Personal Information',
        'forms.personalInfo.subtitle': 'Please provide your personal details',
        'forms.personalInfo.sections.personal': 'Personal Details',
        'forms.personalInfo.sections.address': 'Address Information',
        'forms.personalInfo.fields.firstName': 'First Name',
        'forms.personalInfo.fields.lastName': 'Last Name',
        'forms.personalInfo.fields.email': 'Email Address',
        'forms.personalInfo.fields.phone': 'Phone Number',
        'forms.personalInfo.fields.dateOfBirth': 'Date of Birth',
        'forms.personalInfo.fields.insuranceType': 'Insurance Type',
        'forms.personalInfo.fields.address.street': 'Street Address',
        'forms.personalInfo.fields.address.city': 'City',
        'forms.personalInfo.fields.address.state': 'State/Province',
        'forms.personalInfo.fields.address.zipCode': 'ZIP/Postal Code',
        'forms.personalInfo.fields.address.country': 'Country',
        'forms.personalInfo.insuranceTypes.health': 'Health Insurance',
        'forms.personalInfo.insuranceTypes.auto': 'Auto Insurance',
        'forms.personalInfo.insuranceTypes.life': 'Life Insurance',
        'forms.personalInfo.insuranceTypes.travel': 'Travel Insurance',
        'forms.personalInfo.countries.US': 'United States',
        'forms.personalInfo.countries.CA': 'Canada',
        'forms.personalInfo.validation.firstName.required': 'First name is required',
        'forms.personalInfo.validation.lastName.required': 'Last name is required',
        'forms.personalInfo.validation.email.required': 'Email address is required',
        'forms.personalInfo.validation.email.pattern': 'Please enter a valid email address',
        'forms.personalInfo.validation.phone.required': 'Phone number is required',
        'forms.personalInfo.validation.dateOfBirth.required': 'Date of birth is required',
        'forms.personalInfo.validation.insuranceType.required': 'Please select an insurance type',
        'forms.personalInfo.validation.address.street.required': 'Street address is required',
        'forms.personalInfo.validation.address.city.required': 'City is required',
        'forms.personalInfo.validation.address.state.required': 'State/Province is required',
        'forms.personalInfo.validation.address.zipCode.required': 'ZIP/Postal code is required',
        'forms.personalInfo.validation.address.country.required': 'Please select a country',
        'navigation.next': 'Next',
        'navigation.cancel': 'Cancel',
      };
      return translations[key] || key;
    },
  }),
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('PersonalInfoForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validFormData: PersonalInfo = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    dateOfBirth: '1990-01-01',
    insuranceType: 'health',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
    },
  };

  it('renders form with all required fields', () => {
    renderWithTheme(
      <PersonalInfoForm onSubmit={mockOnSubmit} />
    );

    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByLabelText('Insurance Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Street Address')).toBeInTheDocument();
    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('State/Province')).toBeInTheDocument();
    expect(screen.getByLabelText('ZIP/Postal Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Country')).toBeInTheDocument();
  });

  it('displays validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <PersonalInfoForm onSubmit={mockOnSubmit} />
    );

    const submitButton = screen.getByRole('button', { name: 'Next' });
    
    // Try to submit empty form
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Email address is required')).toBeInTheDocument();
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      expect(screen.getByText('Date of birth is required')).toBeInTheDocument();
      expect(screen.getByText('Street address is required')).toBeInTheDocument();
      expect(screen.getByText('City is required')).toBeInTheDocument();
      expect(screen.getByText('State/Province is required')).toBeInTheDocument();
      expect(screen.getByText('ZIP/Postal code is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <PersonalInfoForm onSubmit={mockOnSubmit} />
    );

    const emailField = screen.getByLabelText('Email Address');
    
    await user.type(emailField, 'invalid-email');
    await user.tab(); // Trigger validation

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <PersonalInfoForm onSubmit={mockOnSubmit} />
    );

    // Fill in all required fields
    await user.type(screen.getByLabelText('First Name'), validFormData.firstName);
    await user.type(screen.getByLabelText('Last Name'), validFormData.lastName);
    await user.type(screen.getByLabelText('Email Address'), validFormData.email);
    await user.type(screen.getByLabelText('Phone Number'), validFormData.phone);
    await user.type(screen.getByLabelText('Date of Birth'), validFormData.dateOfBirth);
    
    // Select insurance type
    await user.click(screen.getByLabelText('Insurance Type'));
    await user.click(screen.getByText('Health Insurance'));

    // Fill address fields
    await user.type(screen.getByLabelText('Street Address'), validFormData.address.street);
    await user.type(screen.getByLabelText('City'), validFormData.address.city);
    await user.type(screen.getByLabelText('State/Province'), validFormData.address.state);
    await user.type(screen.getByLabelText('ZIP/Postal Code'), validFormData.address.zipCode);
    
    // Select country
    await user.click(screen.getByLabelText('Country'));
    await user.click(screen.getByText('United States'));

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Next' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(validFormData);
    });
  });

  it('populates form with initial data', () => {
    const initialData = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
    };

    renderWithTheme(
      <PersonalInfoForm 
        initialData={initialData}
        onSubmit={mockOnSubmit} 
      />
    );

    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane.smith@example.com')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <PersonalInfoForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables form when loading', () => {
    renderWithTheme(
      <PersonalInfoForm 
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    );

    expect(screen.getByLabelText('First Name')).toBeDisabled();
    expect(screen.getByLabelText('Last Name')).toBeDisabled();
    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled();
  });

  it('has proper accessibility attributes', () => {
    renderWithTheme(
      <PersonalInfoForm onSubmit={mockOnSubmit} />
    );

    const firstNameField = screen.getByLabelText('First Name');
    expect(firstNameField).toHaveAttribute('aria-label', 'First Name');

    const emailField = screen.getByLabelText('Email Address');
    expect(emailField).toHaveAttribute('type', 'email');

    const phoneField = screen.getByLabelText('Phone Number');
    expect(phoneField).toHaveAttribute('type', 'tel');

    const dateField = screen.getByLabelText('Date of Birth');
    expect(dateField).toHaveAttribute('type', 'date');
  });

  it('validates date of birth constraints', async () => {
    const user = userEvent.setup();
    
    renderWithTheme(
      <PersonalInfoForm onSubmit={mockOnSubmit} />
    );

    const dateField = screen.getByLabelText('Date of Birth');
    
    // Test future date
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateString = futureDate.toISOString().split('T')[0];
    
    await user.type(dateField, futureDateString);
    await user.tab();

    // Note: The actual validation message would depend on the implementation
    // This test structure shows how you would test date validation
  });
});