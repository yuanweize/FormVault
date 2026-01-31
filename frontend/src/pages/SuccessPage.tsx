/**
 * Success Page Component
 * 
 * Displays confirmation of successful application submission
 * with reference number and next steps information.
 */

import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  useTheme,
  Fade,
  Zoom,
} from '@mui/material';
import {
  CheckCircle,
  Email,
  Print,
  Home,
  Schedule,
  Info,
  ContentCopy,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useApplicationWorkflowContext } from '../contexts/ApplicationWorkflowContext';
import { WorkflowProgressIndicator } from '../components/workflow/WorkflowProgressIndicator';
import { FileUploadForm } from '../components/forms/FileUploadForm';

export function SuccessPage() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { state, resetWorkflow } = useApplicationWorkflowContext();

  const { referenceNumber, personalInfo } = state;

  useEffect(() => {
    // If no reference number (e.g. direct access), redirect to home
    if (!referenceNumber) {
      navigate('/', { replace: true });
    }
  }, [referenceNumber, navigate]);

  const handleGoHome = () => {
    resetWorkflow();
    navigate('/');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReference = async () => {
    if (referenceNumber) {
      try {
        await navigator.clipboard.writeText(referenceNumber);
        // Could add a toast notification here
      } catch (error) {
        console.error('Failed to copy reference number:', error);
      }
    }
  };

  const getInsuranceTypeLabel = (type: string) => {
    return t(`forms.personalInfo.insuranceType.options.${type}`);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Progress Indicator */}
      <Box sx={{ mb: 4 }}>
        <WorkflowProgressIndicator />
      </Box>

      {/* Success Animation */}
      <Zoom in timeout={1000}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CheckCircle
            sx={{
              fontSize: 80,
              color: theme.palette.success.main,
              mb: 2,
            }}
          />
          <Typography variant="h3" component="h1" gutterBottom color="success.main">
            {t('pages.success.title')}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {t('pages.success.subtitle')}
          </Typography>
        </Box>
      </Zoom>

      <Fade in timeout={1500}>
        <Box>
          {/* Reference Number Card */}
          <Card sx={{ mb: 3, border: `2px solid ${theme.palette.success.main}` }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                {t('pages.success.referenceNumber')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: theme.palette.success.main,
                    letterSpacing: 2,
                  }}
                >
                  {referenceNumber}
                </Typography>
                <Button
                  size="small"
                  startIcon={<ContentCopy />}
                  onClick={handleCopyReference}
                  sx={{ ml: 2 }}
                >
                  {t('common.copy')}
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t('pages.success.referenceNumberNote')}
              </Typography>
            </CardContent>
          </Card>

          {/* Application Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('pages.success.applicationSummary')}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('forms.personalInfo.name.label')}
                </Typography>
                <Typography variant="body1">
                  {personalInfo.firstName} {personalInfo.lastName}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('forms.personalInfo.email.label')}
                </Typography>
                <Typography variant="body1">
                  {personalInfo.email}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('forms.personalInfo.insuranceType.label')}
                </Typography>
                <Chip
                  label={personalInfo.insuranceType ? getInsuranceTypeLabel(personalInfo.insuranceType) : ''}
                  color="primary"
                  size="small"
                />
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('pages.success.submissionDate')}
                </Typography>
                <Typography variant="body1">
                  {new Date().toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Info sx={{ mr: 1 }} />
                {t('pages.success.nextSteps.title')}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <List>
                <ListItem>
                  <ListItemIcon>
                    <Email color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('pages.success.nextSteps.emailConfirmation')}
                    secondary={t('pages.success.nextSteps.emailConfirmationNote')}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Schedule color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('pages.success.nextSteps.processing')}
                    secondary={t('pages.success.nextSteps.processingNote')}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={t('pages.success.nextSteps.followUp')}
                    secondary={t('pages.success.nextSteps.followUpNote')}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {t('pages.success.importantInfo')}
            </Typography>
          </Alert>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Home />}
              onClick={handleGoHome}
            >
              {t('pages.success.actions.goHome')}
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<Print />}
              onClick={handlePrint}
            >
              {t('pages.success.actions.print')}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
}

export default SuccessPage;