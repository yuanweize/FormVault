import React, { useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, ThemeProvider, CssBaseline, useMediaQuery } from '@mui/material';
import { ApplicationWorkflowProvider } from './contexts/ApplicationWorkflowContext';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import HomePage from './pages/HomePage';
import PersonalInfoPage from './pages/PersonalInfoPage';
import FileUploadPage from './pages/FileUploadPage';
import ReviewPage from './pages/ReviewPage';
import SuccessPage from './pages/SuccessPage';
import NotFoundPage from './pages/NotFoundPage';
import { getAppTheme } from './theme';

const App: React.FC = () => {
  // Auto-detect system preference
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Memoize theme to prevent unnecessary re-renders
  const theme = useMemo(() => getAppTheme(prefersDarkMode ? 'dark' : 'light'), [prefersDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <ApplicationWorkflowProvider>
          <Layout>
            <Container
              maxWidth="lg"
              sx={{
                py: { xs: 2, sm: 3, md: 4 },
                px: { xs: 1, sm: 2, md: 3 },
              }}
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/personal-info" element={<PersonalInfoPage />} />
                <Route path="/file-upload" element={<FileUploadPage />} />
                <Route path="/review" element={<ReviewPage />} />
                <Route path="/success" element={<SuccessPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Container>
          </Layout>
        </ApplicationWorkflowProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;