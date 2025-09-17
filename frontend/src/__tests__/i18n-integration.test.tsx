import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/config';

const theme = createTheme();

// Simple test component that uses translations
const TestComponent: React.FC<{ translationKey: string }> = ({ translationKey }) => {
  return <div>{i18n.t(translationKey)}</div>;
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </ThemeProvider>
  );
};

describe('Internationalization Integration', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  describe('Basic Translation Functionality', () => {
    it('translates simple keys correctly in English', async () => {
      await i18n.changeLanguage('en');
      
      renderWithProviders(<TestComponent translationKey="app.title" />);
      expect(screen.getByText('FormVault')).toBeInTheDocument();
    });

    it('translates simple keys correctly in Chinese', async () => {
      await i18n.changeLanguage('zh');
      
      renderWithProviders(<TestComponent translationKey="pages.home.title" />);
      expect(screen.getByText('欢迎使用 FormVault')).toBeInTheDocument();
    });

    it('translates simple keys correctly in Spanish', async () => {
      await i18n.changeLanguage('es');
      
      renderWithProviders(<TestComponent translationKey="pages.home.title" />);
      expect(screen.getByText('Bienvenido a FormVault')).toBeInTheDocument();
    });
  });

  describe('Translation Completeness', () => {
    it('has key translations available in all supported languages', async () => {
      const languages = ['en', 'zh', 'es'];
      const keyTranslations = {
        'en': {
          'pages.home.title': 'Welcome to FormVault',
          'forms.personalInfo.fields.firstName': 'First Name',
          'fileUpload.studentId': 'Student ID',
          'common.submit': 'Submit',
          'stepper.personalInfo': 'Personal Information',
        },
        'zh': {
          'pages.home.title': '欢迎使用 FormVault',
          'forms.personalInfo.fields.firstName': '名字',
          'fileUpload.studentId': '学生证',
          'common.submit': '提交',
          'stepper.personalInfo': '个人信息',
        },
        'es': {
          'pages.home.title': 'Bienvenido a FormVault',
          'forms.personalInfo.fields.firstName': 'Nombre',
          'fileUpload.studentId': 'Identificación de Estudiante',
          'common.submit': 'Enviar',
          'stepper.personalInfo': 'Información Personal',
        },
      };

      for (const lang of languages) {
        await i18n.changeLanguage(lang);
        
        const expectedTranslations = keyTranslations[lang as keyof typeof keyTranslations];
        
        for (const [key, expectedValue] of Object.entries(expectedTranslations)) {
          const translation = i18n.t(key);
          expect(translation).toBe(expectedValue);
        }
      }
    });

    it('handles interpolation correctly in all languages', async () => {
      const testCases = [
        {
          lang: 'en',
          key: 'fileUpload.errors.fileTooLarge',
          params: { maxSize: 5 },
          expected: 'File is too large. Maximum size is 5MB',
        },
        {
          lang: 'zh',
          key: 'fileUpload.errors.fileTooLarge',
          params: { maxSize: 5 },
          expected: '文件过大。最大大小为5MB',
        },
        {
          lang: 'es',
          key: 'fileUpload.errors.fileTooLarge',
          params: { maxSize: 5 },
          expected: 'El archivo es demasiado grande. El tamaño máximo es 5MB',
        },
      ];

      for (const testCase of testCases) {
        await i18n.changeLanguage(testCase.lang);
        const result = i18n.t(testCase.key, testCase.params);
        expect(result).toBe(testCase.expected);
      }
    });
  });

  describe('Language Switching', () => {
    it('updates translations when language changes', async () => {
      const { rerender } = renderWithProviders(<TestComponent translationKey="pages.home.title" />);

      // Start with English
      await i18n.changeLanguage('en');
      rerender(<TestComponent translationKey="pages.home.title" />);
      expect(screen.getByText('Welcome to FormVault')).toBeInTheDocument();

      // Change to Chinese
      await i18n.changeLanguage('zh');
      rerender(<TestComponent translationKey="pages.home.title" />);
      expect(screen.getByText('欢迎使用 FormVault')).toBeInTheDocument();

      // Change to Spanish
      await i18n.changeLanguage('es');
      rerender(<TestComponent translationKey="pages.home.title" />);
      expect(screen.getByText('Bienvenido a FormVault')).toBeInTheDocument();
    });

    it('maintains language state across component remounts', async () => {
      await i18n.changeLanguage('zh');
      
      const { unmount } = renderWithProviders(<TestComponent translationKey="pages.home.title" />);
      expect(screen.getByText('欢迎使用 FormVault')).toBeInTheDocument();
      unmount();
      
      // Remount with same language
      renderWithProviders(<TestComponent translationKey="pages.home.title" />);
      expect(screen.getByText('欢迎使用 FormVault')).toBeInTheDocument();
    });
  });

  describe('Translation Structure Validation', () => {
    it('validates that all main sections exist in translation files', async () => {
      const languages = ['en', 'zh', 'es'];
      const requiredSections = [
        'app',
        'pages',
        'forms',
        'fileUpload',
        'common',
        'stepper',
        'navigation',
        'footer',
        'errors',
      ];

      for (const lang of languages) {
        await i18n.changeLanguage(lang);
        
        for (const section of requiredSections) {
          expect(i18n.exists(section)).toBe(true);
        }
      }
    });

    it('validates that critical form fields are translated', async () => {
      const languages = ['en', 'zh', 'es'];
      const criticalFields = [
        'forms.personalInfo.fields.firstName',
        'forms.personalInfo.fields.lastName',
        'forms.personalInfo.fields.email',
        'forms.personalInfo.fields.phone',
        'forms.personalInfo.validation.firstName.required',
        'forms.personalInfo.validation.email.required',
      ];

      for (const lang of languages) {
        await i18n.changeLanguage(lang);
        
        for (const field of criticalFields) {
          const translation = i18n.t(field);
          expect(translation).toBeTruthy();
          expect(translation).not.toBe(field); // Should not return the key itself
        }
      }
    });
  });
});