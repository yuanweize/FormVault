import React, { useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Button,
  Typography,
  Alert,
  Paper,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import FileUpload, { UploadedFile } from './FileUpload';

interface FileUploadFormProps {
  initialFiles?: {
    studentId?: UploadedFile;
    passport?: UploadedFile;
  };
  onFileUpload?: (file: File, fileType: 'student_id' | 'passport') => Promise<UploadedFile | null>;
  onFileRemove?: (fileType: 'student_id' | 'passport') => void;
  onSubmit?: (files: { studentId?: UploadedFile; passport?: UploadedFile }) => void;
}

export const FileUploadForm: React.FC<FileUploadFormProps> = ({
  initialFiles,
  onFileUpload,
  onFileRemove,
  onSubmit,
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

  // Handlers for Student ID
  const createStudentIdUploadHandler = useCallback(async (file: File): Promise<UploadedFile> => {
    if (onFileUpload) {
      const result = await onFileUpload(file, 'student_id');
      if (result) return result;
      throw new Error('Upload failed');
    }
    throw new Error('No upload handler');
  }, [onFileUpload]);

  const handleStudentIdSuccess = useCallback((file: UploadedFile) => {
    setStudentIdFile(file);
    setErrors(prev => prev.filter(e => !e.toLowerCase().includes('student')));
  }, []);

  const handleStudentIdRemove = useCallback(() => {
    setStudentIdFile(null);
    if (onFileRemove) onFileRemove('student_id');
  }, [onFileRemove]);

  // Handlers for Passport
  const createPassportUploadHandler = useCallback(async (file: File): Promise<UploadedFile> => {
    if (onFileUpload) {
      const result = await onFileUpload(file, 'passport');
      if (result) return result;
      throw new Error('Upload failed');
    }
    throw new Error('No upload handler');
  }, [onFileUpload]);

  const handlePassportSuccess = useCallback((file: UploadedFile) => {
    setPassportFile(file);
    setErrors(prev => prev.filter(e => !e.toLowerCase().includes('passport')));
  }, []);

  const handlePassportRemove = useCallback(() => {
    setPassportFile(null);
    if (onFileRemove) onFileRemove('passport');
  }, [onFileRemove]);

  // Navigation / Submit
  const handleBack = useCallback(() => {
    navigate('/personal-info');
  }, [navigate]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setErrors([]);

    if (!studentIdFile || !passportFile) {
      setErrors([t('fileUpload.errors.allFilesRequired') || 'Please upload both files.']);
      setIsSubmitting(false);
      return;
    }

    try {
      if (onSubmit) {
        await onSubmit({ studentId: studentIdFile, passport: passportFile });
      }
      // Always navigate on success (or let parent handle it via onSubmit promise)
      // Here we assume if no error, we proceed
      navigate('/review');
    } catch (err) {
      setErrors(['Submission failed. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  }, [studentIdFile, passportFile, onSubmit, navigate, t]);

  const canSubmit = studentIdFile && passportFile;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        {t('fileUpload.title')}
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph align="center" sx={{ mb: 4 }}>
        {t('fileUpload.description')}
      </Typography>

      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {t('fileUpload.errors.title')}
          </Typography>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Student ID Column */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {t('forms.fileUpload.studentId.label')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('forms.fileUpload.studentId.description')}
            </Typography>
            <FileUpload
              fileType="student_id"
              onUploadSuccess={handleStudentIdSuccess}
              onUploadError={(msg) => setErrors(p => [...p, msg])}
              onFileRemove={handleStudentIdRemove}
              uploadedFile={studentIdFile}
              customUploadHandler={onFileUpload ? createStudentIdUploadHandler : undefined}
            />
          </Paper>
        </Grid>

        {/* Passport Column */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {t('forms.fileUpload.passport.label')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('forms.fileUpload.passport.description')}
            </Typography>
            <FileUpload
              fileType="passport"
              onUploadSuccess={handlePassportSuccess}
              onUploadError={(msg) => setErrors(p => [...p, msg])}
              onFileRemove={handlePassportRemove}
              uploadedFile={passportFile}
              customUploadHandler={onFileUpload ? createPassportUploadHandler : undefined}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          size="large"
        >
          {t('common.back')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          size="large"
          sx={{ minWidth: 150 }}
        >
          {isSubmitting ? t('common.submitting') : t('common.continue')}
        </Button>
      </Box>
    </Box>
  );
};