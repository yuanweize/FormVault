/**
 * File Upload Page Component
 * 
 * This page handles file uploads for student ID and passport documents
 * with workflow integration and progress tracking.
 */

import React, { useEffect } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FileUploadForm } from '../components/forms/FileUploadForm';
import { WorkflowProgressIndicator } from '../components/workflow/WorkflowProgressIndicator';
import { WorkflowNavigation } from '../components/workflow/WorkflowNavigation';
import { useApplicationWorkflowContext } from '../contexts/ApplicationWorkflowContext';
import { useFileUpload } from '../hooks/useFiles';
import { FileType, UploadedFile } from '../types';

export function FileUploadPage() {
  const { t } = useTranslation();
  const { 
    state, 
    setUploadedFile, 
    removeUploadedFile, 
    completeStep, 
    goToNextStep 
  } = useApplicationWorkflowContext();

  const studentIdUpload = useFileUpload();
  const passportUpload = useFileUpload();

  const { uploadedFiles } = state;
  const hasRequiredFiles = uploadedFiles.studentId && uploadedFiles.passport;

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

  const handleNext = async (): Promise<boolean> => {
    if (!hasRequiredFiles) {
      return false;
    }
    
    // Mark this step as completed
    completeStep('file-upload');
    
    // Navigate to next step
    goToNextStep();
    
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
            {t('pages.fileUpload.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('pages.fileUpload.subtitle')}
          </Typography>
        </Box>

        {/* Upload Instructions */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {t('pages.fileUpload.instructions')}
          </Typography>
        </Alert>

        {/* File Upload Forms */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('forms.fileUpload.studentId.label')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('forms.fileUpload.studentId.description')}
                </Typography>
                <FileUploadForm
                  fileType="student_id"
                  onFileUpload={handleFileUpload}
                  onFileRemove={handleFileRemove}
                  uploadedFile={uploadedFiles.studentId}
                  isUploading={studentIdUpload.uploading}
                  uploadProgress={studentIdUpload.progress}
                  error={studentIdUpload.error}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('forms.fileUpload.passport.label')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('forms.fileUpload.passport.description')}
                </Typography>
                <FileUploadForm
                  fileType="passport"
                  onFileUpload={handleFileUpload}
                  onFileRemove={handleFileRemove}
                  uploadedFile={uploadedFiles.passport}
                  isUploading={passportUpload.uploading}
                  uploadProgress={passportUpload.progress}
                  error={passportUpload.error}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Completion Status */}
        {hasRequiredFiles && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2">
              {t('pages.fileUpload.allFilesUploaded')}
            </Typography>
          </Alert>
        )}

        {/* Navigation */}
        <Box sx={{ mt: 4 }}>
          <WorkflowNavigation
            onNext={handleNext}
            nextLabel={hasRequiredFiles ? t('pages.fileUpload.proceedToReview') : undefined}
          />
        </Box>
      </Box>
    </Container>
  );
}

export default FileUploadPage;