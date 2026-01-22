import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Stepper,
  Step,
  StepLabel,
  Box,
  useTheme,
  useMediaQuery,
  MobileStepper,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const NavigationStepper: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isVerySmall = useMediaQuery(theme.breakpoints.down(400));

  const steps = [
    { path: '/personal-info', label: t('stepper.personalInfo'), shortLabel: t('stepper.personalInfoShort', { defaultValue: 'Info' }) },
    { path: '/file-upload', label: t('stepper.fileUpload'), shortLabel: t('stepper.fileUploadShort', { defaultValue: 'Files' }) },
    { path: '/review', label: t('stepper.review'), shortLabel: t('stepper.reviewShort', { defaultValue: 'Review' }) },
    { path: '/success', label: t('stepper.success'), shortLabel: t('stepper.successShort', { defaultValue: 'Done' }) },
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

  // Use MobileStepper for very small screens
  if (isVerySmall) {
    return (
      <Box sx={{ width: '100%', py: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          mb: 1,
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 'bold',
            }}
          >
            {t('stepper.step')} {activeStep + 1} {t('stepper.of')} {steps.length}: {steps[activeStep]?.shortLabel}
          </Typography>
        </Box>
        <MobileStepper
          variant="progress"
          steps={steps.length}
          position="static"
          activeStep={activeStep}
          sx={{
            backgroundColor: 'transparent',
            '& .MuiLinearProgress-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: theme.palette.secondary.main,
              },
            },
          }}
          nextButton={<div />}
          backButton={<div />}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 1 }}>
      <Stepper
        activeStep={activeStep}
        alternativeLabel={isMobile}
        orientation="horizontal"
        sx={{
          '& .MuiStepLabel-root': {
            color: 'white',
          },
          '& .MuiStepLabel-label': {
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
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
            fontSize: { xs: '1.2rem', sm: '1.5rem' },
            '&.Mui-active': {
              color: 'white',
            },
            '&.Mui-completed': {
              color: theme.palette.secondary.main,
            },
          },
          '& .MuiStepConnector-line': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
          },
        }}
      >
        {steps.map((step, index) => (
          <Step key={step.path}>
            <StepLabel>
              {isMobile ? step.shortLabel : step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default NavigationStepper;