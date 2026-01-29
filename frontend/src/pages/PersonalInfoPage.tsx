import React, { useEffect } from 'react';
import { Box, Typography, Container } from '@mui/material';
import { useTranslation } from 'react-i18next';
import PersonalInfoForm from '../components/forms/PersonalInfoForm';
import { WorkflowProgressIndicator } from '../components/workflow/WorkflowProgressIndicator';
import { WorkflowNavigation } from '../components/workflow/WorkflowNavigation';
import { useApplicationWorkflowContext } from '../contexts/ApplicationWorkflowContext';
import { PersonalInfo } from '../types';

const PersonalInfoPage: React.FC = () => {
  const { t } = useTranslation();
  const { state, updatePersonalInfo, completeStep, goToNextStep } = useApplicationWorkflowContext();

  // Initialize form with existing data
  useEffect(() => {
    // If we have existing data, the form will be populated automatically
  }, []);

  // Local state to handle navigation after state update
  const [shouldAdvance, setShouldAdvance] = React.useState(false);

  // Handle navigation when step is completed
  React.useEffect(() => {
    if (shouldAdvance && state.completedSteps.includes('personal-info')) {
      goToNextStep();
      setShouldAdvance(false);
    }
  }, [state.completedSteps, shouldAdvance, goToNextStep]);

  const handleSubmit = async (data: PersonalInfo) => {
    // Update the workflow context with the form data
    updatePersonalInfo(data);

    // Mark this step as completed
    completeStep('personal-info');

    // Trigger navigation in useEffect
    setShouldAdvance(true);
  };

  const handleNext = async (): Promise<boolean> => {
    // This will be handled by the form submission
    return true;
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Progress Indicator */}
        <WorkflowProgressIndicator sx={{ mb: 4 }} />

        {/* Page Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('pages.personalInfo.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('pages.personalInfo.subtitle')}
          </Typography>
        </Box>

        {/* Personal Information Form */}
        <PersonalInfoForm
          initialData={state.personalInfo}
          onSubmit={handleSubmit}
          isLoading={state.submissionStatus === 'saving'}
        />

        {/* Navigation */}
        <Box sx={{ mt: 4 }}>
          <WorkflowNavigation
            onNext={handleNext}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default PersonalInfoPage;