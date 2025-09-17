import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../common/LanguageSelector';
import NavigationStepper from '../navigation/NavigationStepper';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          component="div"
          sx={{ flexGrow: 1, fontWeight: 'bold' }}
        >
          {t('app.title')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LanguageSelector />
        </Box>
      </Toolbar>
      <Box sx={{ px: 2, pb: 1 }}>
        <NavigationStepper />
      </Box>
    </AppBar>
  );
};

export default Header;