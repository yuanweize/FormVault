/**
 * Confirmation Page Component
 * 
 * Displays a summary of the application data and allows the user
 * to review and confirm their submission before final processing.
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  HealthAndSafety,
  AttachFile,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useApplicationWorkflowContext } from '../contexts/ApplicationWorkflowContext';
import { WorkflowProgressIndicator } from '../components/workflow/WorkflowProgressIndicator';
import { WorkflowNavigation } from '../components/workflow/WorkflowNavigation';
import { fileService } from '../services/fileService';

export function ConfirmationPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { state, completeStep } = useApplicationWorkflowContext();

  const { personalInfo, uploadedFiles, referenceNumber } = state;

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
  const canSubmit = hasRequiredPersonalInfo && hasRequiredFiles;

  const handleNext = async (): Promise<boolean> => {
    if (!canSubmit) {
      return false;
    }
    
    completeStep('confirmation');
    return true;
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
          {t('pages.confirmation.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('pages.confirmation.subtitle')}
        </Typography>
      </Box>

      {/* Validation Alerts */}
      {!canSubmit && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {t('pages.confirmation.incompleteWarning')}
          </Typography>
          <List dense>
            {!hasRequiredPersonalInfo && (
              <ListItem>
                <ListItemIcon>
                  <Warning fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('pages.confirmation.missingPersonalInfo')} />
              </ListItem>
            )}
            {!hasRequiredFiles && (
              <ListItem>
                <ListItemIcon>
                  <Warning fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={t('pages.confirmation.missingFiles')} />
              </ListItem>
            )}
          </List>
        </Alert>
      )}

      {/* Application Summary */}
      <Grid container spacing={3}>
        {/* Personal Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Person sx={{ mr: 1 }} />
                {t('pages.confirmation.sections.personalInfo')}
                {hasRequiredPersonalInfo && (
                  <CheckCircle color="success" sx={{ ml: 1 }} fontSize="small" />
                )}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('forms.personalInfo.firstName.label')}
                    </Typography>
                    <Typography variant="body1">
                      {personalInfo.firstName || t('common.notProvided')}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('forms.personalInfo.lastName.label')}
                    </Typography>
                    <Typography variant="body1">
                      {personalInfo.lastName || t('common.notProvided')}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Email sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('forms.personalInfo.email.label')}
                      </Typography>
                      <Typography variant="body1">
                        {personalInfo.email || t('common.notProvided')}
                      </Typography>
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
                      <Typography variant="body1">
                        {personalInfo.phone || t('common.notProvided')}
                      </Typography>
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
                        {personalInfo.address ? (
                          <>
                            {personalInfo.address.street}<br />
                            {personalInfo.address.city}, {personalInfo.address.state} {personalInfo.address.zipCode}<br />
                            {personalInfo.address.country}
                          </>
                        ) : (
                          t('common.notProvided')
                        )}
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
                        {personalInfo.dateOfBirth ? formatDate(personalInfo.dateOfBirth) : t('common.notProvided')}
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
                        label={personalInfo.insuranceType ? getInsuranceTypeLabel(personalInfo.insuranceType) : t('common.notProvided')}
                        color={personalInfo.insuranceType ? 'primary' : 'default'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Uploaded Files */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachFile sx={{ mr: 1 }} />
                {t('pages.confirmation.sections.uploadedFiles')}
                {hasRequiredFiles && (
                  <CheckCircle color="success" sx={{ ml: 1 }} fontSize="small" />
                )}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('forms.fileUpload.studentId.label')}
                    </Typography>
                    {uploadedFiles.studentId ? (
                      <Box>
                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                          {fileService.getFileTypeIcon(uploadedFiles.studentId.mimeType)}
                          <Box sx={{ ml: 1 }}>
                            {uploadedFiles.studentId.originalName}
                          </Box>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fileService.formatFileSize(uploadedFiles.studentId.size)}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        {t('common.notUploaded')}
                      </Typography>
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
                        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                          {fileService.getFileTypeIcon(uploadedFiles.passport.mimeType)}
                          <Box sx={{ ml: 1 }}>
                            {uploadedFiles.passport.originalName}
                          </Box>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fileService.formatFileSize(uploadedFiles.passport.size)}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        {t('common.notUploaded')}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Application Details */}
        {referenceNumber && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('pages.confirmation.sections.applicationDetails')}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('pages.confirmation.referenceNumber')}
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {referenceNumber}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Submission Notice */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          {t('pages.confirmation.submissionNotice')}
        </Typography>
      </Alert>

      {/* Navigation */}
      <Box sx={{ mt: 4 }}>
        <WorkflowNavigation
          onNext={handleNext}
          showSave={false}
        />
      </Box>
    </Box>
  );
}

export default ConfirmationPage;