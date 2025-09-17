import React, { useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Button,
  Typography,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import FileUpload, { UploadedFile } from './FileUpload';

interface FileUploadFormProps {
  onSubmit?: (files: { studentId?: UploadedFile; passport?: UploadedFile }) => void;
  initialFiles?: {
    studentId?: UploadedFile;
    passport?: UploadedFile;
  };
}

export const FileUploadForm: React.FC<FileUploadFormProps> = ({
  onSubmit,
  initialFiles,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [studentIdFile, setStudentIdFile] = useState<UploadedFile | null>(
    initialFiles?.studentId || null
  );
  const [passportFile, setPassportFile] = useState<UploadedFile | null>(
    initialFiles?.passport || null
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStudentIdUpload = useCallback((file: UploadedFile) => {
    setStudentIdFile(file);
    setErrors(prev => prev.filter(error => !error.includes('student')));
  }, []);

  const handlePassportUpload = useCallback((file: UploadedFile) => {
    setPassportFile(file);
    setErrors(prev => prev.filter(error => !error.includes('passport')));
  }, []);

  const handleStudentIdError = useCallback((error: string) => {
    setErrors(prev => [...prev.filter(e => !e.includes('student')), `Student ID: ${error}`]);
  }, []);

  const handlePassportError = useCallback((error: string) => {
    setErrors(prev => [...prev.filter(e => !e.includes('passport')), `Passport: ${error}`]);
  }, []);

  const handleStudentIdRemove = useCallback((fileId: string) => {
    setStudentIdFile(null);
  }, []);

  const handlePassportRemove = useCallback((fileId: string) => {
    setPassportFile(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setErrors([]);

    try {
      // Validate that at least one file is uploaded
      if (!studentIdFile && !passportFile) {
        setErrors([t('fileUpload.errors.noFilesUploaded')]);
        return;
      }

      const files = {
        studentId: studentIdFile || undefined,
        passport: passportFile || undefined,
      };

      if (onSubmit) {
        await onSubmit(files);
      } else {
        // Default behavior: navigate to next step
        navigate('/review');
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : t('fileUpload.errors.submitFailed');
      setErrors([errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  }, [studentIdFile, passportFile, onSubmit, navigate, t]);

  const handleBack = useCallback(() => {
    navigate('/personal-info');
  }, [navigate]);

  const canSubmit = studentIdFile || passportFile;

  return (
    <Box maxWidth="md" mx="auto" p={3}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        {t('fileUpload.title')}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph align="center">
        {t('fileUpload.description')}
      </Typography>

      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            {t('fileUpload.errors.title')}
          </Typography>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <FileUpload
              fileType="student_id"
              onUploadSuccess={handleStudentIdUpload}
              onUploadError={handleStudentIdError}
              onFileRemove={handleStudentIdRemove}
              uploadedFile={studentIdFile}
              disabled={isSubmitting}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
            <FileUpload
              fileType="passport"
              onUploadSuccess={handlePassportUpload}
              onUploadError={handlePassportError}
              onFileRemove={handlePassportRemove}
              uploadedFile={passportFile}
              disabled={isSubmitting}
            />
          </Paper>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={isSubmitting}
          size="large"
        >
          {t('common.back')}
        </Button>
        
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          size="large"
        >
          {isSubmitting ? t('common.submitting') : t('common.continue')}
        </Button>
      </Box>

      <Box mt={3}>
        <Typography variant="body2" color="text.secondary" align="center">
          {t('fileUpload.requirements')}
        </Typography>
      </Box>
    </Box>
  );
};

export default FileUploadForm;