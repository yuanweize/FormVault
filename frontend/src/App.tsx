import React, { useMemo, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ApplicationWorkflowProvider } from './contexts/ApplicationWorkflowContext';
import { ThemeModeProvider, useThemeMode } from './contexts/ThemeModeContext';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import HomePage from './pages/HomePage';
import PersonalInfoPage from './pages/PersonalInfoPage';
import FileUploadPage from './pages/FileUploadPage';
import ReviewPage from './pages/ReviewPage';
import ConfirmationPage from './pages/ConfirmationPage';
import SuccessPage from './pages/SuccessPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import SupportPage from './pages/SupportPage';
import CookieConsentBanner from './components/common/CookieConsentBanner';
import { apiClient } from './services/api';
import { getAppTheme } from './theme';

const AppContent: React.FC = () => {
  const { mode } = useThemeMode();
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  useEffect(() => {
    // Dynamically load portal branding and crisp configuration from backend
    const initPortalBranding = async () => {
      try {
        const response = await apiClient.get('/portal/config');
        const data = response.data;
        if (data) {
          if (data.site_title) {
            document.title = data.site_title;
          }
          if (data.site_icon_url) {
            const iconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
            if (iconLink) {
              iconLink.href = data.site_icon_url;
            }
          }
          // Auto-load Crisp live customer support chat widget if configured in backend settings
          if (data.crisp_website_id) {
            (window as any).$crisp = (window as any).$crisp || [];
            (window as any).CRISP_WEBSITE_ID = data.crisp_website_id;

            if (!document.querySelector('script[src*="client.crisp.chat"]')) {
              const script = document.createElement('script');
              script.src = 'https://client.crisp.chat/l.js';
              script.async = true;
              document.head.appendChild(script);
            }

            // Configure Crisp widget position: 'left' -> reverse true, 'right' -> reverse false
            const isLeft = data.crisp_position === 'left';
            (window as any).$crisp.push(['set', 'position:reverse', [isLeft]]);

            // Configure custom theme color if set
            if (data.crisp_custom_color) {
              (window as any).$crisp.push(['set', 'color:theme', [data.crisp_custom_color]]);
            }

            // Ensure floating chat bubble is visible on portal
            (window as any).$crisp.push(['do', 'chat:show']);
          }
        }
      } catch (err) {
        // Fallback gracefully on local defaults
      }
    };

    initPortalBranding();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <ApplicationWorkflowProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/personal-info" element={<PersonalInfoPage />} />
              <Route path="/file-upload" element={<FileUploadPage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/confirmation" element={<ConfirmationPage />} />
              <Route path="/success" element={<SuccessPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <CookieConsentBanner />
          </Layout>
        </ApplicationWorkflowProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeModeProvider>
      <AppContent />
    </ThemeModeProvider>
  );
};

export default App;