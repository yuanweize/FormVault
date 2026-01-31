/**
 * File Upload Page Component
 * 
 * This page handles single instance of FileUploadForm which manages both
 * Student ID and Passport uploads.
 */

import React, { useEffect } from 'react';
import { Box, Container, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FileUploadForm } from '../components/forms/FileUploadForm';
import { WorkflowProgressIndicator } from '../components/workflow/WorkflowProgressIndicator';
import { useApplicationWorkflowContext } from '../contexts/ApplicationWorkflowContext';
import { useFileUpload } from '../hooks/useFiles';
import { FileType, UploadedFile } from '../types';

export function FileUploadPage() {
  const { t } = useTranslation();
  const {
    state,
    setUploadedFile,
    removeUploadedFile,
    goToNextStep,
    completeStep
  } = useApplicationWorkflowContext();

  const studentIdUpload = useFileUpload();
  const passportUpload = useFileUpload();

  const { uploadedFiles } = state;

  // Utilize useEffect to handle navigation after state update
  useEffect(() => {
    if (state.currentStep === 'file-upload' && state.completedSteps.includes('file-upload')) {
      // goToNextStep(); // Triggered by submit, but if we reload and are complete, maybe validation?
      // Actually handled by submitting
    }
  }, [state.currentStep, state.completedSteps, goToNextStep]);

  const handleFileUpload = async (file: File, fileType: FileType): Promise<UploadedFile | null> => {
    const upload = fileType === 'student_id' ? studentIdUpload : passportUpload;
    const result = await upload.upload(file, fileType, state.applicationId);

    if (result) {
      setUploadedFile(fileType === 'student_id' ? 'studentId' : 'passport', result);
    }

    return result;
  };

  const handleFileRemove = (fileType: FileType) => {
    removeUploadedFile(fileType === 'student_id' ? 'studentId' : 'passport');
  };

  const handleFormSubmit = async (files: { studentId?: UploadedFile; passport?: UploadedFile }) => {
    completeStep('file-upload');
    goToNextStep();
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Progress Indicator */}
        <WorkflowProgressIndicator sx={{ mb: 4 }} />

        {/* Single Form Instance handling both files */}
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <FileUploadForm
            initialFiles={uploadedFiles}
            onFileUpload={handleFileUpload}
            onFileRemove={handleFileRemove}
            onSubmit={handleFormSubmit}
          />
        </Paper>
      </Box>
    </Container>
  );
}

export default FileUploadPage;