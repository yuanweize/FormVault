/**
 * Workflow Navigation Component
 * 
 * Provides navigation controls for the application submission workflow
 * with context-aware button states and actions.
 */

import React from 'react';
import {
  Box,
  Button,
  Stack,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Save,
  Send,
  Home
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useApplicationWorkflowContext, WorkflowStep } from '../../contexts/ApplicationWorkflowContext';

interface WorkflowNavigationProps {
  onNext?: () => Promise<boolean> | boolean;
  onPrevious?: () => void;
  onSave?: () => Promise<void> | void;
  nextLabel?: string;
  previousLabel?: string;
  saveLabel?: string;
  showSave?: boolean;
  className?: string;
}

const STEP_ORDER: WorkflowStep[] = ['personal-info', 'file-upload', 'review', 'confirmation', 'success'];

export function WorkflowNavigation({
  onNext,
  onPrevious,
  onSave,
  nextLabel,
  previousLabel,
  saveLabel,
  showSave = true,
  className,
}: WorkflowNavigationProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const {
    state,
    goToNextStep,
    goToPreviousStep,
    saveAsDraft,
    submitApplication,
    clearError,
  } = useApplicationWorkflowContext();

  const currentStepIndex = STEP_ORDER.indexOf(state.currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEP_ORDER.length - 1;
  const isSuccessStep = state.currentStep === 'success';
  const isConfirmationStep = state.currentStep === 'confirmation';

  const isLoading = state.submissionStatus === 'saving' || state.submissionStatus === 'submitting';
  const hasError = state.submissionStatus === 'error' && state.error;

  const handleNext = async () => {
    clearError();

    try {
      // Call custom onNext handler if provided
      if (onNext) {
        const canProceed = await onNext();
        if (!canProceed) {
          return;
        }
      }

      // Handle confirmation step submission
      if (isConfirmationStep) {
        await submitApplication();
      } else {
        // Navigate to next step
        goToNextStep();
      }
    } catch (error) {
      console.error('Error in handleNext:', error);
      // Use the context's error handling instead of local setError
      if (error instanceof Error) {
        // @ts-ignore: Dispatch error through context
        setError(error.message);
      } else {
        // @ts-ignore: Dispatch error through context
        setError(t('errors.general'));
      }
    }
  };

  const handlePrevious = () => {
    clearError();

    if (onPrevious) {
      onPrevious();
    } else {
      goToPreviousStep();
    }
  };

  const handleSave = async () => {
    clearError();

    try {
      if (onSave) {
        await onSave();
      } else {
        await saveAsDraft();
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const getNextButtonLabel = () => {
    if (nextLabel) return nextLabel;

    switch (state.currentStep) {
      case 'confirmation':
        return t('workflow.navigation.submit');
      case 'success':
        return t('workflow.navigation.goHome');
      default:
        return t('workflow.navigation.next');
    }
  };

  const getNextButtonIcon = () => {
    switch (state.currentStep) {
      case 'confirmation':
        return <Send />;
      case 'success':
        return <Home />;
      default:
        return <ArrowForward />;
    }
  };

  const getPreviousButtonLabel = () => {
    return previousLabel || t('workflow.navigation.previous');
  };

  const getSaveButtonLabel = () => {
    return saveLabel || t('workflow.navigation.saveAsDraft');
  };

  if (isSuccessStep) {
    return (
      <Box className={className}>
        {hasError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {state.error}
          </Alert>
        )}

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            startIcon={<Home />}
            onClick={handleGoHome}
            fullWidth={isMobile}
          >
            {t('workflow.navigation.goHome')}
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box className={className}>
      {hasError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      )}

      <Stack
        direction={isMobile ? 'column' : 'row'}
        spacing={2}
        justifyContent="space-between"
        alignItems={isMobile ? 'stretch' : 'center'}
      >
        {/* Previous button */}
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handlePrevious}
          disabled={isFirstStep || isLoading}
          fullWidth={isMobile}
          sx={{ order: isMobile ? 2 : 1 }}
        >
          {getPreviousButtonLabel()}
        </Button>

        {/* Save button */}
        {showSave && !isConfirmationStep && (
          <Button
            variant="text"
            startIcon={isLoading && state.submissionStatus === 'saving' ? (
              <CircularProgress size={16} />
            ) : (
              <Save />
            )}
            onClick={handleSave}
            disabled={isLoading || !state.isDirty}
            sx={{
              order: isMobile ? 3 : 2,
              minWidth: isMobile ? 'auto' : 120,
            }}
            fullWidth={isMobile}
          >
            {getSaveButtonLabel()}
          </Button>
        )}

        {/* Next/Submit button */}
        <Button
          variant="contained"
          endIcon={isLoading && state.submissionStatus === 'submitting' ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            getNextButtonIcon()
          )}
          onClick={isSuccessStep ? handleGoHome : handleNext}
          disabled={isLoading}
          color={isConfirmationStep ? 'success' : 'primary'}
          fullWidth={isMobile}
          sx={{ order: isMobile ? 1 : 3 }}
        >
          {getNextButtonLabel()}
        </Button>
      </Stack>

      {/* Loading indicator */}
      {isLoading && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <CircularProgress size={24} />
          <Box sx={{ mt: 1 }}>
            {state.submissionStatus === 'saving' && t('workflow.navigation.saving')}
            {state.submissionStatus === 'submitting' && t('workflow.navigation.submitting')}
          </Box>
        </Box>
      )}

      {/* Dirty state indicator */}
      {state.isDirty && !isLoading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('workflow.navigation.unsavedChanges')}
        </Alert>
      )}
    </Box>
  );
}

export default WorkflowNavigation;