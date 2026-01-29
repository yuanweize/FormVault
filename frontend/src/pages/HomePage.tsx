import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Container,
} from '@mui/material';
import {
  SecurityOutlined,
  LanguageOutlined,
  PhoneAndroidOutlined,
  ArrowForwardOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/personal-info');
  };

  const features = [
    {
      icon: <SecurityOutlined sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: t('pages.home.features.secure'),
      description: t('pages.home.features.secureDesc'),
    },
    {
      icon: <LanguageOutlined sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: t('pages.home.features.multilingual'),
      description: t('pages.home.features.multilingualDesc'),
    },
    {
      icon: <PhoneAndroidOutlined sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: t('pages.home.features.mobile'),
      description: t('pages.home.features.mobileDesc'),
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          textAlign: 'center',
          py: { xs: 4, md: 8 },
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '2rem', md: '3rem' },
            mb: 2,
          }}
        >
          {t('pages.home.title')}
        </Typography>
        <Typography
          variant="h5"
          color="text.secondary"
          paragraph
          sx={{
            fontSize: { xs: '1.1rem', md: '1.5rem' },
            mb: 4,
          }}
        >
          {t('pages.home.subtitle')}
        </Typography>
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForwardOutlined />}
          onClick={handleGetStarted}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            mb: 6,
          }}
        >
          {t('pages.home.getStarted')}
        </Button>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 2,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default HomePage;