// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock axios to avoid ES module issues
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    defaults: {
      baseURL: 'http://localhost:8000/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    },
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
  })),
  default: {
    create: jest.fn(() => ({
      defaults: {
        baseURL: 'http://localhost:8000/api/v1',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      },
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
    })),
  },
}));

// Mock axios-mock-adapter
jest.mock('axios-mock-adapter', () => {
  return jest.fn().mockImplementation(() => ({
    onGet: jest.fn().mockReturnThis(),
    onPost: jest.fn().mockReturnThis(),
    onPut: jest.fn().mockReturnThis(),
    onDelete: jest.fn().mockReturnThis(),
    reply: jest.fn().mockReturnThis(),
    replyOnce: jest.fn().mockReturnThis(),
    networkError: jest.fn().mockReturnThis(),
    timeout: jest.fn().mockReturnThis(),
    reset: jest.fn(),
    restore: jest.fn(),
    history: {
      get: [],
      post: [],
      put: [],
      delete: [],
    },
  }));
});

// Mock environment variables
process.env.REACT_APP_API_BASE_URL = 'http://localhost:8000';

// Mock react-i18next globally
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Return expected text for specific keys to match test expectations
      const translations: Record<string, string> = {
        'app.title': 'FormVault',
        'app.shortTitle': 'FormVault',
        'app.subtitle': 'Secure Insurance Application Portal',
        'pages.home.title': 'Secure Insurance Application Portal',
        'pages.success.title': 'Application Submitted!',

        'stepper.personalInfo': 'Personal Information',
        'stepper.review': 'Review & Submit',
        'stepper.fileUpload': 'Document Upload',
        'stepper.success': 'Complete',

        'forms.personalInfo.title': 'Personal Information',
        'forms.personalInfo.subtitle': 'Please provide your personal details',
        'forms.personalInfo.sections.personal': 'Personal Details',
        'forms.personalInfo.sections.address': 'Address Information',

        // Form fields
        'forms.personalInfo.fields.firstName': 'First Name',
        'forms.personalInfo.fields.lastName': 'Last Name',
        'forms.personalInfo.fields.email': 'Email Address',
        'forms.personalInfo.fields.phone': 'Phone Number',
        'forms.personalInfo.fields.address': 'Address',
        'forms.personalInfo.fields.insuranceType': 'Insurance Type',
        'forms.personalInfo.fields.dateOfBirth': 'Date of Birth',

        'forms.personalInfo.firstName.label': 'First Name',
        'forms.personalInfo.lastName.label': 'Last Name',
        'forms.personalInfo.email.label': 'Email Address',
        'forms.personalInfo.phone.label': 'Phone Number',
        'forms.personalInfo.address.label': 'Address',
        'forms.personalInfo.insuranceType.label': 'Insurance Type',

        'fileUpload.dragAndDrop': 'Drag and drop files here',
        'fileUpload.selectFile': 'Select File',
        'fileUpload.studentId': 'Student ID',
        'fileUpload.passport': 'Passport',
        'fileUpload.uploading': 'Uploading...',
        'fileUpload.orClickToSelect': 'or click to select',

        // Validation messages
        'forms.personalInfo.validation.firstName.required': 'First name is required',
        'forms.personalInfo.validation.lastName.required': 'Last name is required',
        'forms.personalInfo.validation.email.required': 'Email is required',
        'forms.personalInfo.validation.phone.required': 'Phone is required',
        'forms.personalInfo.validation.dateOfBirth.required': 'Date of birth is required',
        'forms.personalInfo.validation.insuranceType.required': 'Insurance type is required',
      };
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: () => new Promise(() => { }),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));