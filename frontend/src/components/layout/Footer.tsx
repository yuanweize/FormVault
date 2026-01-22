import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: theme.palette.grey[100],
        py: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} {t('app.title')}. {t('footer.allRightsReserved')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link
              href="#"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              {t('footer.privacy')}
            </Link>
            <Link
              href="#"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              {t('footer.terms')}
            </Link>
            <Link
              href="#"
              variant="body2"
              color="text.secondary"
              underline="hover"
            >
              {t('footer.support')}
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;