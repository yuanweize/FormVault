module.exports = {
  useTranslation: () => ({
    t: (key, options = {}) => {
      const translations = {
        'app.title': 'FormVault',
        'pages.home.title': 'Welcome to FormVault',
        'pages.home.subtitle': 'Complete your insurance application securely and efficiently',
        'pages.home.getStarted': 'Get Started',
        'pages.home.features.secure': 'Secure & Encrypted',
        'pages.home.features.secureDesc': 'Your data is protected with industry-standard encryption',
        'pages.home.features.multilingual': 'Multi-language Support',
        'pages.home.features.multilingualDesc': 'Available in English, Chinese, and Spanish',
        'pages.home.features.mobile': 'Mobile Friendly',
        'pages.home.features.mobileDesc': 'Complete your application on any device',
        'pages.personalInfo.title': 'Personal Information',
        'pages.personalInfo.subtitle': 'Please provide your personal details',
        'pages.fileUpload.title': 'Document Upload',
        'pages.fileUpload.subtitle': 'Upload your required documents',
        'pages.review.title': 'Review & Submit',
        'pages.review.subtitle': 'Please review your information before submitting',
        'pages.success.title': 'Application Submitted',
        'pages.success.subtitle': 'Your application has been successfully submitted',
        'pages.notFound.title': 'Page Not Found',
        'pages.notFound.subtitle': 'The page you\'re looking for doesn\'t exist',
        'pages.notFound.goHome': 'Go Home',
        'footer.allRightsReserved': 'All rights reserved.',
        'footer.privacy': 'Privacy Policy',
        'footer.terms': 'Terms of Service',
        'footer.support': 'Support',
        'stepper.personalInfo': 'Personal Information',
        'stepper.fileUpload': 'File Upload',
        'stepper.review': 'Review',
        'stepper.success': 'Success',
        'fileUpload.title': 'Document Upload',
        'fileUpload.description': 'Please upload your required documents. You can upload either a student ID or passport, or both.',
        'fileUpload.studentId': 'Student ID',
        'fileUpload.passport': 'Passport',
        'fileUpload.dragAndDrop': 'Drag and drop your file here',
        'fileUpload.orClickToSelect': 'or click to select a file',
        'fileUpload.selectFile': 'Select File',
        'fileUpload.takePhoto': 'Take Photo',
        'fileUpload.uploading': 'Uploading...',
        'fileUpload.preview': 'File Preview',
        'fileUpload.remove': 'Remove',
        'fileUpload.requirements': 'Supported formats: JPEG, PNG, PDF. Maximum file size: 5MB per file.',
        'fileUpload.supportedFormats': 'Supported formats: {{formats}}. Max size: {{maxSize}}MB',
        'fileUpload.errors.title': 'Please fix the following errors:',
        'fileUpload.errors.fileTooLarge': 'File is too large. Maximum size is {{maxSize}}MB',
        'fileUpload.errors.invalidFormat': 'Invalid file format. Supported formats: {{formats}}',
        'fileUpload.errors.uploadFailed': 'Upload failed. Please try again.',
        'fileUpload.errors.noFilesUploaded': 'Please upload at least one document',
        'fileUpload.errors.submitFailed': 'Failed to submit files. Please try again.',
        'common.back': 'Back',
        'common.continue': 'Continue',
        'common.submit': 'Submit',
        'common.submitting': 'Submitting...',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'common.edit': 'Edit',
        'common.delete': 'Delete',
        'common.confirm': 'Confirm',
        'common.loading': 'Loading...',
      };
      let translation = translations[key] || key;
      
      // Handle interpolation
      if (options && typeof options === 'object') {
        Object.keys(options).forEach(optionKey => {
          const regex = new RegExp(`{{${optionKey}}}`, 'g');
          translation = translation.replace(regex, options[optionKey]);
        });
      }
      
      return translation;
    },
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
  I18nextProvider: ({ children }) => children,
};