import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  PhotoCamera,
  InsertDriveFile,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export interface UploadedFile {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  previewUrl?: string;
}

export interface FileUploadProps {
  fileType: 'student_id' | 'passport';
  maxSize?: number; // in bytes, default 5MB
  acceptedFormats?: string[];
  onUploadSuccess: (fileInfo: UploadedFile) => void;
  onUploadError: (error: string) => void;
  onFileRemove?: (fileId: string) => void;
  uploadedFile?: UploadedFile | null;
  disabled?: boolean;
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'application/pdf'];

export const FileUpload: React.FC<FileUploadProps> = ({
  fileType,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
  onUploadSuccess,
  onUploadError,
  onFileRemove,
  uploadedFile,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return t('fileUpload.errors.fileTooLarge', { 
        maxSize: Math.round(maxSize / (1024 * 1024)) 
      });
    }
    
    if (!acceptedFormats.includes(file.type)) {
      return t('fileUpload.errors.invalidFormat', {
        formats: acceptedFormats.map(format => format.split('/')[1]).join(', ')
      });
    }
    
    return null;
  }, [maxSize, acceptedFormats, t]);

  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_type', fileType);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // TODO: Replace with actual API call
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(t('fileUpload.errors.uploadFailed'));
      }

      const result = await response.json();
      
      const uploadedFileInfo: UploadedFile = {
        id: result.file_id,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date(),
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      };

      onUploadSuccess(uploadedFileInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('fileUpload.errors.uploadFailed');
      setError(errorMessage);
      onUploadError(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [fileType, onUploadSuccess, onUploadError, t]);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      onUploadError(validationError);
      return;
    }

    await uploadFile(file);
  }, [validateFile, uploadFile, onUploadError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    handleFileSelect(e.dataTransfer.files);
  }, [disabled, handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  const handleRemoveFile = useCallback(() => {
    if (uploadedFile && onFileRemove) {
      if (uploadedFile.previewUrl) {
        URL.revokeObjectURL(uploadedFile.previewUrl);
      }
      onFileRemove(uploadedFile.id);
    }
  }, [uploadedFile, onFileRemove]);

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const openCameraDialog = useCallback(() => {
    if (!disabled && cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  }, [disabled]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeLabel = () => {
    return fileType === 'student_id' 
      ? t('fileUpload.studentId') 
      : t('fileUpload.passport');
  };

  if (uploadedFile) {
    return (
      <Card sx={{ 
        maxWidth: { xs: '100%', sm: 400 }, 
        margin: 'auto',
        mx: { xs: 0, sm: 'auto' },
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box 
            display="flex" 
            alignItems="center" 
            gap={2}
            flexDirection={{ xs: 'column', sm: 'row' }}
            textAlign={{ xs: 'center', sm: 'left' }}
          >
            <CheckCircle color="success" sx={{ fontSize: { xs: '2rem', sm: '1.5rem' } }} />
            <Box flex={1}>
              <Typography 
                variant="h6" 
                component="div"
                sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                {getFileTypeLabel()}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  wordBreak: 'break-word',
                  fontSize: { xs: '0.875rem', sm: '0.875rem' },
                }}
              >
                {uploadedFile.originalName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(uploadedFile.size)}
              </Typography>
            </Box>
          </Box>
          
          {uploadedFile.previewUrl && (
            <Box mt={2}>
              <img
                src={uploadedFile.previewUrl}
                alt={t('fileUpload.preview')}
                style={{
                  width: '100%',
                  maxHeight: 200,
                  objectFit: 'contain',
                  borderRadius: 4,
                }}
              />
            </Box>
          )}
        </CardContent>
        
        <CardActions sx={{ justifyContent: { xs: 'center', sm: 'flex-start' } }}>
          <Button
            size="small"
            color="error"
            startIcon={<Delete />}
            onClick={handleRemoveFile}
            disabled={disabled}
            sx={{ 
              minHeight: '44px',
              px: { xs: 3, sm: 2 },
            }}
          >
            {t('fileUpload.remove')}
          </Button>
        </CardActions>
      </Card>
    );
  }

  return (
    <Box>
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{ 
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
          textAlign: { xs: 'center', sm: 'left' },
        }}
      >
        {getFileTypeLabel()}
      </Typography>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            fontSize: { xs: '0.875rem', sm: '0.875rem' },
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        sx={{
          border: 2,
          borderStyle: 'dashed',
          borderColor: isDragOver ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: { xs: 3, sm: 4 },
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: isDragOver ? 'action.hover' : 'background.paper',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease-in-out',
          minHeight: { xs: '200px', sm: 'auto' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          '&:hover': {
            borderColor: disabled ? 'grey.300' : 'primary.main',
            backgroundColor: disabled ? 'background.paper' : 'action.hover',
          },
        }}
      >
        <CloudUpload sx={{ 
          fontSize: { xs: 40, sm: 48 }, 
          color: 'text.secondary', 
          mb: 2 
        }} />
        
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
        >
          {t('fileUpload.dragAndDrop')}
        </Typography>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          gutterBottom
          sx={{ fontSize: { xs: '0.875rem', sm: '0.875rem' } }}
        >
          {t('fileUpload.orClickToSelect')}
        </Typography>
        
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.75rem' },
            textAlign: 'center',
            px: 1,
          }}
        >
          {t('fileUpload.supportedFormats', {
            formats: acceptedFormats.map(format => format.split('/')[1]).join(', '),
            maxSize: Math.round(maxSize / (1024 * 1024))
          })}
        </Typography>
      </Box>

      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2} 
        justifyContent="center" 
        mt={2}
      >
        <Button
          variant="outlined"
          startIcon={<InsertDriveFile />}
          onClick={openFileDialog}
          disabled={disabled || isUploading}
          sx={{ 
            minHeight: '48px',
            flex: { xs: 1, sm: 'none' },
          }}
        >
          {t('fileUpload.selectFile')}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<PhotoCamera />}
          onClick={openCameraDialog}
          disabled={disabled || isUploading}
          sx={{ 
            minHeight: '48px',
            flex: { xs: 1, sm: 'none' },
          }}
        >
          {t('fileUpload.takePhoto')}
        </Button>
      </Box>

      {isUploading && (
        <Box mt={2}>
          <Typography variant="body2" gutterBottom>
            {t('fileUpload.uploading')}
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
    </Box>
  );
};

export default FileUpload;