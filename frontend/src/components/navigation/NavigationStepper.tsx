import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const NavigationStepper: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const steps = [
    { path: '/personal-info', label: t('stepper.personalInfo') },
    { path: '/file-upload', label: t('stepper.fileUpload') },
    { path: '/review', label: t('stepper.review') },
    { path: '/success', label: t('stepper.success') },
  ];

  const getActiveStep = () => {
    const currentPath = location.pathname;
    const stepIndex = steps.findIndex(step => step.path === currentPath);
    return stepIndex >= 0 ? stepIndex : -1;
  };

  const activeStep = getActiveStep();

  // Don't show stepper on home page or 404 page
  if (location.pathname === '/' || activeStep === -1) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', py: 1 }}>
      <Stepper
        activeStep={activeStep}
        alternativeLabel={isMobile}
        orientation={isMobile ? 'horizontal' : 'horizontal'}
        sx={{
          '& .MuiStepLabel-root': {
            color: 'white',
          },
          '& .MuiStepLabel-label': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-active': {
              color: 'white',
              fontWeight: 'bold',
            },
            '&.Mui-completed': {
              color: 'rgba(255, 255, 255, 0.9)',
            },
          },
          '& .MuiStepIcon-root': {
            color: 'rgba(255, 255, 255, 0.3)',
            '&.Mui-active': {
              color: 'white',
            },
            '&.Mui-completed': {
              color: theme.palette.secondary.main,
            },
          },
        }}
      >
        {steps.map((step, index) => (
          <Step key={step.path}>
            <StepLabel>
              {isMobile && step.label.length > 10
                ? step.label.substring(0, 8) + '...'
                : step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default NavigationStepper;