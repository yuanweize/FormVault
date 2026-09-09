/**
 * Workflow Progress Indicator Component
 * 
 * Displays the current progress through the application submission workflow
 * with modern InsurTech SaaS visual indicators for completed, current, and upcoming steps.
 */

import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  useTheme,
  useMediaQuery,
  SxProps,
  Theme,
} from '@mui/material';
import { Check, Person, CloudUpload, Visibility, Send, CheckCircle } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useApplicationWorkflowContext, WorkflowStep } from '../../contexts/ApplicationWorkflowContext';

// Step configuration
const STEP_CONFIG: Record<WorkflowStep, {
  label: string;
  description: string;
  icon: React.ElementType;
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
  sx?: SxProps<Theme>;
}

export function WorkflowProgressIndicator({
  variant = 'horizontal',
  showDescriptions = false,
  className,
  sx,
}: WorkflowProgressIndicatorProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
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
            width: 34,
            height: 34,
            borderRadius: '50%',
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
            cursor: isClickable ? 'pointer' : 'default',
            transition: 'transform 0.2s',
            '&:hover': isClickable ? { transform: 'scale(1.08)' } : {},
          }}
          onClick={() => handleStepClick(step)}
        >
          <Check sx={{ fontSize: 18 }} />
        </Box>
      );
    }

    if (isCurrent) {
      return (
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: isDark
              ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
              : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isDark
              ? '0 0 0 4px rgba(99, 102, 241, 0.3), 0 4px 12px rgba(99, 102, 241, 0.4)'
              : '0 0 0 4px rgba(79, 70, 229, 0.2), 0 4px 12px rgba(79, 70, 229, 0.35)',
          }}
        >
          <IconComponent sx={{ fontSize: 18 }} />
        </Box>
      );
    }

    return (
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)',
          color: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(15, 23, 42, 0.35)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(15, 23, 42, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isClickable ? 'pointer' : 'default',
          transition: 'all 0.2s',
          '&:hover': isClickable
            ? {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.1)',
                transform: 'scale(1.05)',
              }
            : {},
        }}
        onClick={() => isClickable && handleStepClick(step)}
      >
        <IconComponent sx={{ fontSize: 18 }} />
      </Box>
    );
  };

  return (
    <Box
      className={className}
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: '16px',
        backgroundColor: isDark ? 'rgba(17, 24, 39, 0.65)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(16px)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(15, 23, 42, 0.06)',
        boxShadow: isDark
          ? '0 8px 32px -4px rgba(0, 0, 0, 0.4)'
          : '0 4px 24px -2px rgba(15, 23, 42, 0.04)',
        mb: 4,
        ...sx,
      }}
    >
      {orientation === 'vertical' ? (
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
                      fontWeight: isCurrent ? 700 : 500,
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
      ) : (
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
                      fontWeight: isCurrent ? 700 : 500,
                      fontSize: '0.85rem',
                      mt: 1,
                    },
                  }}
                  onClick={() => isClickable && handleStepClick(step)}
                >
                  {t(config.label)}
                  {showDescriptions && (
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                      {t(config.description)}
                    </Typography>
                  )}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      )}

      {/* Modern Gradient Progress Bar */}
      <Box sx={{ mt: { xs: 2, sm: 2.5 }, pt: 1 }}>
        <Box
          sx={{
            width: '100%',
            height: 5,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: `${((currentStepIndex + 1) / STEP_ORDER.length) * 100}%`,
              height: '100%',
              background: isDark
                ? 'linear-gradient(90deg, #6366F1 0%, #10B981 100%)'
                : 'linear-gradient(90deg, #4F46E5 0%, #10B981 100%)',
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {t('workflow.progress', {
              current: currentStepIndex + 1,
              total: STEP_ORDER.length,
            })}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: isDark ? '#A5B4FC' : '#4F46E5',
            }}
          >
            {Math.round(((currentStepIndex + 1) / STEP_ORDER.length) * 100)}% Completed
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default WorkflowProgressIndicator;