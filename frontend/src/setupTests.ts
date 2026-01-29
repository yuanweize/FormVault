// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock canvas APIs used by components/tests to avoid JSDOM errors
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: [] })),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  })),
});

// Mock URL APIs used for file previews
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'blob:mock-preview'),
});
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// Mock matchMedia for MUI useMediaQuery
const createMatchMedia = (matches = false) =>
  jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));

const ensureMatchMedia = () => {
  const matcher = createMatchMedia(false);
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matcher,
  });
  Object.defineProperty(global, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matcher,
  });
};

ensureMatchMedia();

beforeEach(() => {
  ensureMatchMedia();
});

afterEach(() => {
  ensureMatchMedia();
});

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
    t: (key: string, options?: Record<string, any>) => {
      const translations: Record<string, string> = {
        'app.title': 'FormVault',
        'app.shortTitle': 'FormVault',
        'app.subtitle': 'Secure Insurance Application Portal',
        'pages.home.title': 'Secure Insurance Application Portal',
        'pages.success.title': 'Application Submitted!',

        'stepper.step': 'Step',
        'stepper.of': 'of',
        'stepper.personalInfoShort': 'Info',
        'stepper.fileUploadShort': 'Files',
        'stepper.reviewShort': 'Review',
        'stepper.successShort': 'Done',

        'workflow.progress': 'Step {{current}} of {{total}}',

        'workflow.steps.personalInfo.label': 'Personal Information',
        'workflow.steps.personalInfo.description': 'Enter your personal details',
        'workflow.steps.fileUpload.label': 'Document Upload',
        'workflow.steps.fileUpload.description': 'Upload required documents',
        'workflow.steps.review.label': 'Review',
        'workflow.steps.review.description': 'Review your application',
        'workflow.steps.confirmation.label': 'Confirmation',
        'workflow.steps.confirmation.description': 'Confirm submission',
        'workflow.steps.success.label': 'Success',
        'workflow.steps.success.description': 'Application submitted',

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

        'fileUpload.title': 'Document Upload',
        'fileUpload.description': 'Please upload your required documents',
        'fileUpload.dragAndDrop': 'Drag and drop your file here',
        'fileUpload.selectFile': 'Select File',
        'fileUpload.studentId': 'Student ID',
        'fileUpload.passport': 'Passport',
        'fileUpload.uploading': 'Uploading...',
        'fileUpload.orClickToSelect': 'or click to select a file',

        'fileUpload.supportedFormats': 'Supported formats: JPEG, PNG, PDF. Max size: 5MB',
        'fileUpload.requirements': 'Max file size: 5MB. Supported formats: JPEG, PNG, PDF',

        'fileUpload.errors.title': 'Upload Errors',
        'fileUpload.errors.noFilesUploaded': 'Please upload at least one file',
        'fileUpload.errors.submitFailed': 'File upload failed. Please try again.',
        'fileUpload.errors.uploadFailed': 'File upload failed. Please try again.',
        'fileUpload.errors.invalidFormat': 'Invalid file format. Supported formats: {{formats}}',
        'fileUpload.errors.fileTooLarge': 'File is too large. Max size: {{maxSize}}MB',

        'fileUpload.takePhoto': 'Take Photo',
        'fileUpload.preview': 'File Preview',
        'fileUpload.remove': 'Remove',

        'common.back': 'Back',
        'common.continue': 'Continue',
        'common.submitting': 'Submitting...',

        'workflow.navigation.next': 'Next',
        'workflow.navigation.submit': 'Submit Application',
        'workflow.navigation.goHome': 'Return to Home',
        'workflow.navigation.previous': 'Back',
        'workflow.navigation.saveAsDraft': 'Save as Draft',
        'workflow.navigation.saving': 'Saving...',
        'workflow.navigation.submitting': 'Submitting...',
        'workflow.navigation.unsavedChanges': 'You have unsaved changes',

        // Validation messages
        'forms.personalInfo.validation.firstName.required': 'First name is required',
        'forms.personalInfo.validation.firstName.minLength': 'First name must be at least 2 characters',
        'forms.personalInfo.validation.firstName.maxLength': 'First name must be less than 50 characters',
        'forms.personalInfo.validation.firstName.pattern': 'First name contains invalid characters',
        'forms.personalInfo.validation.lastName.required': 'Last name is required',
        'forms.personalInfo.validation.lastName.minLength': 'Last name must be at least 2 characters',
        'forms.personalInfo.validation.lastName.maxLength': 'Last name must be less than 50 characters',
        'forms.personalInfo.validation.lastName.pattern': 'Last name contains invalid characters',
        'forms.personalInfo.validation.email.required': 'Email is required',
        'forms.personalInfo.validation.email.pattern': 'Invalid email address',
        'forms.personalInfo.validation.phone.required': 'Phone is required',
        'forms.personalInfo.validation.phone.pattern': 'Invalid phone number',
        'forms.personalInfo.validation.dateOfBirth.required': 'Date of birth is required',
        'forms.personalInfo.validation.dateOfBirth.future': 'Date of birth cannot be in the future',
        'forms.personalInfo.validation.dateOfBirth.minAge': 'You must be at least 18 years old',
        'forms.personalInfo.validation.dateOfBirth.maxAge': 'Age cannot exceed 120 years',
        'forms.personalInfo.validation.insuranceType.required': 'Insurance type is required',
        'forms.personalInfo.validation.address.zipCode.required': 'Zip Code is required',
        'forms.personalInfo.validation.address.country.required': 'Country is required',

        'forms.personalInfo.insuranceTypes.health': 'Health Insurance',
        'forms.personalInfo.insuranceTypes.auto': 'Auto Insurance',
        'forms.personalInfo.insuranceTypes.life': 'Life Insurance',
        'forms.personalInfo.insuranceTypes.travel': 'Travel Insurance',

        'navigation.next': 'Next',
        'navigation.cancel': 'Cancel',
        'forms.personalInfo.submitting': 'Submitting...',

        'forms.personalInfo.fields.address.street': 'Street Address',
        'forms.personalInfo.fields.address.city': 'City',
        'forms.personalInfo.fields.address.state': 'State',
        'forms.personalInfo.fields.address.zipCode': 'Zip Code',
        'forms.personalInfo.fields.address.country': 'Country',

        'forms.personalInfo.countries.US': 'United States',
        'forms.personalInfo.countries.CA': 'Canada',
        'forms.personalInfo.countries.MX': 'Mexico',
        'forms.personalInfo.countries.CN': 'China',
        'forms.personalInfo.countries.ES': 'Spain',
        'forms.personalInfo.countries.FR': 'France',
        'forms.personalInfo.countries.DE': 'Germany',
        'forms.personalInfo.countries.GB': 'United Kingdom',
        'forms.personalInfo.countries.AU': 'Australia',
        'forms.personalInfo.countries.JP': 'Japan',

        // File Upload Pages
        'pages.fileUpload.title': 'Upload Documents',
        'pages.fileUpload.subtitle': 'Please upload your documents',
        'pages.fileUpload.instructions': 'Supported formats: PDF, JPG, PNG',
        'forms.fileUpload.studentId.label': 'Student ID',
        'forms.fileUpload.studentId.description': 'Upload your student ID',
        'forms.fileUpload.passport.label': 'Passport',
        'forms.fileUpload.passport.description': 'Upload your passport',
        'pages.fileUpload.allFilesUploaded': 'All files uploaded',
        'pages.fileUpload.next': 'Next',
        'pages.fileUpload.back': 'Back',
        'pages.fileUpload.submit': 'Submit',

      };

      let text = translations[key];

      // Fallback for keys that might be missing but are standard in components
      if (!text) {
        if (key.endsWith('.street')) return 'Street Address';
        if (key.endsWith('.city')) return 'City';
        if (key.endsWith('.state')) return 'State';
        if (key.endsWith('.zipCode')) return 'Zip Code';
        if (key.endsWith('.country')) return 'Country';
        text = key;
      }

      if (options) {
        Object.entries(options).forEach(([k, v]) => {
          text = text.replace(`{{${k}}}`, String(v));
        });
      }

      return text;
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