import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import { HomeOutlined } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
      <Paper elevation={2} sx={{ p: 6 }}>
        <Typography variant="h1" sx={{ fontSize: '6rem', color: 'text.secondary', mb: 2 }}>
          404
        </Typography>
        <Typography variant="h4" gutterBottom>
          {t('pages.notFound.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {t('pages.notFound.subtitle')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<HomeOutlined />}
          onClick={handleGoHome}
          sx={{ mt: 2 }}
        >
          {t('pages.notFound.goHome')}
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFoundPage;