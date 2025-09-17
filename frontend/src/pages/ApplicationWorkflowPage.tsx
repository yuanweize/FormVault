/**
 * Application Workflow Page Component
 * 
 * Main workflow page that handles routing between different steps
 * of the application submission process.
 */

import React from 'react';
import { Box } from '@mui/material';
import { useApplicationWorkflowContext, WorkflowStep } from '../contexts/ApplicationWorkflowContext';
import PersonalInfoPage from './PersonalInfoPage';
import FileUploadPage from './FileUploadPage';
import ReviewPage from './ReviewPage';
import ConfirmationPage from './ConfirmationPage';
import SuccessPage from './SuccessPage';

const STEP_COMPONENTS: Record<WorkflowStep, React.ComponentType> = {
  'personal-info': PersonalInfoPage,
  'file-upload': FileUploadPage,
  'review': ReviewPage,
  'confirmation': ConfirmationPage,
  'success': SuccessPage,
};

export function ApplicationWorkflowPage() {
  const { state } = useApplicationWorkflowContext();
  
  const StepComponent = STEP_COMPONENTS[state.currentStep];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <StepComponent />
    </Box>
  );
}

export default ApplicationWorkflowPage;