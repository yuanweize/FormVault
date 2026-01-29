/**
 * Workflow Progress Indicator Component
 * 
 * Displays the current progress through the application submission workflow
 * with visual indicators for completed, current, and upcoming steps.
 */

import React from 'react';
import { Box, Stepper, Step, StepLabel, StepContent, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Check, Person, CloudUpload, Visibility, Send, CheckCircle } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useApplicationWorkflowContext, WorkflowStep } from '../../contexts/ApplicationWorkflowContext';

// Step configuration
const STEP_CONFIG: Record<WorkflowStep, {
  label: string;
  description: string;
  icon: React.ComponentType;
}> = {
  'personal-info': {
    label: 'workflow.steps.personalInfo.label',
    description: 'workflow.steps.personalInfo.description',
    icon: Person,
  },
  'file-upload': {
    label: 'workflow.steps.fileUpload.label',
    description: 'workflow.steps.fileUpload.description',
    icon: CloudUpload,
  },
  'review': {
    label: 'workflow.steps.review.label',
    description: 'workflow.steps.review.description',
    icon: Visibility,
  },
  'confirmation': {
    label: 'workflow.steps.confirmation.label',
    description: 'workflow.steps.confirmation.description',
    icon: Send,
  },
  'success': {
    label: 'workflow.steps.success.label',
    description: 'workflow.steps.success.description',
    icon: CheckCircle,
  },
};

const STEP_ORDER: WorkflowStep[] = ['personal-info', 'file-upload', 'review', 'confirmation', 'success'];

interface WorkflowProgressIndicatorProps {
  variant?: 'horizontal' | 'vertical';
  showDescriptions?: boolean;
  className?: string;
}

export function WorkflowProgressIndicator({
  variant = 'horizontal',
  showDescriptions = false,
  className,
}: WorkflowProgressIndicatorProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { state, goToStep, canGoToStep, isStepCompleted } = useApplicationWorkflowContext();

  // Use vertical layout on mobile
  const orientation = isMobile ? 'vertical' : variant;
  const currentStepIndex = STEP_ORDER.indexOf(state.currentStep);

  const handleStepClick = (step: WorkflowStep) => {
    if (canGoToStep(step)) {
      goToStep(step);
    }
  };

  const getStepIcon = (step: WorkflowStep, stepIndex: number) => {
    const IconComponent = STEP_CONFIG[step].icon;
    const isCompleted = isStepCompleted(step);
    const isCurrent = step === state.currentStep;
    const isClickable = canGoToStep(step);

    if (isCompleted) {
      return (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: theme.palette.success.main,
            color: theme.palette.success.contrastText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isClickable ? 'pointer' : 'default',
          }}
          onClick={() => handleStepClick(step)}
        >
          <Check fontSize="small" />
        </Box>
      );
    }

    if (isCurrent) {
      return (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComponent fontSize="small" />
        </Box>
      );
    }

    return (
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: theme.palette.grey[300],
          color: theme.palette.grey[600],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isClickable ? 'pointer' : 'default',
          '&:hover': isClickable ? {
            backgroundColor: theme.palette.grey[400],
          } : {},
        }}
        onClick={() => isClickable && handleStepClick(step)}
      >
        <IconComponent fontSize="small" />
      </Box>
    );
  };

  if (orientation === 'vertical') {
    return (
      <Box className={className}>
        <Stepper activeStep={currentStepIndex} orientation="vertical">
          {STEP_ORDER.map((step, index) => {
            const config = STEP_CONFIG[step];
            const isCompleted = isStepCompleted(step);
            const isCurrent = step === state.currentStep;
            const isClickable = canGoToStep(step);

            return (
              <Step key={step} completed={isCompleted}>
                <StepLabel
                  StepIconComponent={() => getStepIcon(step, index)}
                  sx={{
                    cursor: isClickable ? 'pointer' : 'default',
                    '& .MuiStepLabel-label': {
                      color: isCurrent
                        ? theme.palette.primary.main
                        : isCompleted
                          ? theme.palette.success.main
                          : theme.palette.text.secondary,
                      fontWeight: isCurrent ? 600 : 400,
                    },
                  }}
                  onClick={() => isClickable && handleStepClick(step)}
                >
                  {t(config.label)}
                </StepLabel>
                {showDescriptions && (
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {t(config.description)}
                    </Typography>
                  </StepContent>
                )}
              </Step>
            );
          })}
        </Stepper>
      </Box>
    );
  }

  return (
    <Box className={className}>
      <Stepper activeStep={currentStepIndex} alternativeLabel>
        {STEP_ORDER.map((step, index) => {
          const config = STEP_CONFIG[step];
          const isCompleted = isStepCompleted(step);
          const isCurrent = step === state.currentStep;
          const isClickable = canGoToStep(step);

          return (
            <Step key={step} completed={isCompleted}>
              <StepLabel
                StepIconComponent={() => getStepIcon(step, index)}
                sx={{
                  cursor: isClickable ? 'pointer' : 'default',
                  '& .MuiStepLabel-label': {
                    color: isCurrent
                      ? theme.palette.primary.main
                      : isCompleted
                        ? theme.palette.success.main
                        : theme.palette.text.secondary,
                    fontWeight: isCurrent ? 600 : 400,
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                  },
                }}
                onClick={() => isClickable && handleStepClick(step)}
              >
                {t(config.label)}
                {showDescriptions && !isMobile && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    {t(config.description)}
                  </Typography>
                )}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>

      {/* Progress bar */}
      <Box sx={{ mt: 2, mb: 1 }}>
        <Box
          sx={{
            width: '100%',
            height: 4,
            backgroundColor: theme.palette.grey[300],
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: `${((currentStepIndex + 1) / STEP_ORDER.length) * 100}%`,
              height: '100%',
              backgroundColor: theme.palette.primary.main,
              transition: 'width 0.3s ease-in-out',
            }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {t('workflow.progress', {
            current: currentStepIndex + 1,
            total: STEP_ORDER.length
          })}
        </Typography>
      </Box>
    </Box>
  );
}

export default WorkflowProgressIndicator;