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
    <Box sx={{ 
      maxWidth: 600, 
      mx: 'auto', 
      textAlign: 'center',
      px: { xs: 2, sm: 0 },
    }}>
      <Paper 
        elevation={2} 
        sx={{ 
          p: { xs: 4, sm: 6 },
          mx: { xs: 0, sm: 'auto' },
        }}
      >
        <Typography 
          variant="h1" 
          sx={{ 
            fontSize: { xs: '4rem', sm: '6rem' }, 
            color: 'text.secondary', 
            mb: 2,
          }}
        >
          404
        </Typography>
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
        >
          {t('pages.notFound.title')}
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          paragraph
          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          {t('pages.notFound.subtitle')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<HomeOutlined />}
          onClick={handleGoHome}
          sx={{ 
            mt: 2,
            minHeight: '48px',
            px: { xs: 3, sm: 2 },
          }}
        >
          {t('pages.notFound.goHome')}
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFoundPage;