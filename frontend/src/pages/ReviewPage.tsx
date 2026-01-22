/**
 * Review Page Component
 * 
 * Allows users to review their application data before proceeding
 * to the final confirmation step. Provides editing capabilities.
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Divider,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  HealthAndSafety,
  AttachFile,
  Edit,
  CheckCircle,
  Warning,
  Delete,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useApplicationWorkflowContext } from '../contexts/ApplicationWorkflowContext';
import { WorkflowProgressIndicator } from '../components/workflow/WorkflowProgressIndicator';
import { WorkflowNavigation } from '../components/workflow/WorkflowNavigation';
import { fileService } from '../services/fileService';

export function ReviewPage() {
  const { t } = useTranslation();
  const { 
    state, 
    goToStep, 
    completeStep, 
    removeUploadedFile,
    saveAsDraft 
  } = useApplicationWorkflowContext();

  const { personalInfo, uploadedFiles } = state;

  // Validation checks
  const hasRequiredPersonalInfo = personalInfo.firstName && 
    personalInfo.lastName && 
    personalInfo.email && 
    personalInfo.phone &&
    personalInfo.address?.street &&
    personalInfo.address?.city &&
    personalInfo.address?.state &&
    personalInfo.address?.zipCode &&
    personalInfo.dateOfBirth &&
    personalInfo.insuranceType;

  const hasRequiredFiles = uploadedFiles.studentId && uploadedFiles.passport;
  const canProceed = hasRequiredPersonalInfo && hasRequiredFiles;

  const handleNext = async (): Promise<boolean> => {
    if (!canProceed) {
      return false;
    }
    
    // Save as draft before proceeding
    await saveAsDraft();
    completeStep('review');
    return true;
  };

  const handleEditPersonalInfo = () => {
    goToStep('personal-info');
  };

  const handleEditFiles = () => {
    goToStep('file-upload');
  };

  const handleRemoveFile = (fileType: 'studentId' | 'passport') => {
    removeUploadedFile(fileType);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getInsuranceTypeLabel = (type: string) => {
    return t(`forms.personalInfo.insuranceType.options.${type}`);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Progress Indicator */}
      <WorkflowProgressIndicator sx={{ mb: 4 }} />

      {/* Page Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('pages.review.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('pages.review.subtitle')}
        </Typography>
      </Box>

      {/* Validation Alerts */}
      {!canProceed && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {t('pages.review.incompleteWarning')}
          </Typography>
          <List dense>
            {!hasRequiredPersonalInfo && (
              <ListItem>
                <ListItemIcon>
                  <Warning fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('pages.review.missingPersonalInfo')} />
              </ListItem>
            )}
            {!hasRequiredFiles && (
              <ListItem>
                <ListItemIcon>
                  <Warning fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('pages.review.missingFiles')} />
              </ListItem>
            )}
          </List>
        </Alert>
      )}

      {/* Application Review */}
      <Grid container spacing={3}>
        {/* Personal Information Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Person sx={{ mr: 1 }} />
                  {t('pages.review.sections.personalInfo')}
                  {hasRequiredPersonalInfo && (
                    <CheckCircle color="success" sx={{ ml: 1 }} fontSize="small" />
                  )}
                </Typography>
                <Button
                  startIcon={<Edit />}
                  onClick={handleEditPersonalInfo}
                  size="small"
                >
                  {t('common.edit')}
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {hasRequiredPersonalInfo ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('forms.personalInfo.firstName.label')}
                      </Typography>
                      <Typography variant="body1">{personalInfo.firstName}</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('forms.personalInfo.lastName.label')}
                      </Typography>
                      <Typography variant="body1">{personalInfo.lastName}</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Email sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('forms.personalInfo.email.label')}
                        </Typography>
                        <Typography variant="body1">{personalInfo.email}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Phone sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('forms.personalInfo.phone.label')}
                        </Typography>
                        <Typography variant="body1">{personalInfo.phone}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
                      <LocationOn sx={{ mr: 1, fontSize: 16, color: 'text.secondary', mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('forms.personalInfo.address.label')}
                        </Typography>
                        <Typography variant="body1">
                          {personalInfo.address?.street}<br />
                          {personalInfo.address?.city}, {personalInfo.address?.state} {personalInfo.address?.zipCode}<br />
                          {personalInfo.address?.country}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <CalendarToday sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('forms.personalInfo.dateOfBirth.label')}
                        </Typography>
                        <Typography variant="body1">
                          {personalInfo.dateOfBirth ? formatDate(personalInfo.dateOfBirth) : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <HealthAndSafety sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('forms.personalInfo.insuranceType.label')}
                        </Typography>
                        <Chip
                          label={personalInfo.insuranceType ? getInsuranceTypeLabel(personalInfo.insuranceType) : ''}
                          color="primary"
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="warning">
                  <Typography variant="body2">
                    {t('pages.review.personalInfoIncomplete')}
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Files Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <AttachFile sx={{ mr: 1 }} />
                  {t('pages.review.sections.uploadedFiles')}
                  {hasRequiredFiles && (
                    <CheckCircle color="success" sx={{ ml: 1 }} fontSize="small" />
                  )}
                </Typography>
                <Button
                  startIcon={<Edit />}
                  onClick={handleEditFiles}
                  size="small"
                >
                  {t('common.edit')}
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('forms.fileUpload.studentId.label')}
                    </Typography>
                    {uploadedFiles.studentId ? (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <Box sx={{ mr: 1 }}>
                              {fileService.getFileTypeIcon(uploadedFiles.studentId.mimeType)}
                            </Box>
                            <Box>
                              <Typography variant="body1" noWrap>
                                {uploadedFiles.studentId.originalName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {fileService.formatFileSize(uploadedFiles.studentId.size)}
                              </Typography>
                            </Box>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveFile('studentId')}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ) : (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          {t('pages.review.fileNotUploaded')}
                        </Typography>
                      </Alert>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('forms.fileUpload.passport.label')}
                    </Typography>
                    {uploadedFiles.passport ? (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <Box sx={{ mr: 1 }}>
                              {fileService.getFileTypeIcon(uploadedFiles.passport.mimeType)}
                            </Box>
                            <Box>
                              <Typography variant="body1" noWrap>
                                {uploadedFiles.passport.originalName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {fileService.formatFileSize(uploadedFiles.passport.size)}
                              </Typography>
                            </Box>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveFile('passport')}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ) : (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          {t('pages.review.fileNotUploaded')}
                        </Typography>
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ready to Proceed */}
      {canProceed && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            {t('pages.review.readyToProceed')}
          </Typography>
        </Alert>
      )}

      {/* Navigation */}
      <Box sx={{ mt: 4 }}>
        <WorkflowNavigation
          onNext={handleNext}
          nextLabel={canProceed ? t('pages.review.proceedToConfirmation') : undefined}
        />
      </Box>
    </Box>
  );
}

export default ReviewPage;