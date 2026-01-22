import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../common/LanguageSelector';
import NavigationStepper from '../navigation/NavigationStepper';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar 
        sx={{ 
          minHeight: { xs: '56px', sm: '64px' },
          px: { xs: 1, sm: 2 },
        }}
      >
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          component="div"
          sx={{ 
            flexGrow: 1, 
            fontWeight: 'bold',
            fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {isSmallMobile ? t('app.shortTitle', { defaultValue: 'FormVault' }) : t('app.title')}
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 1, sm: 2 },
        }}>
          <LanguageSelector />
        </Box>
      </Toolbar>
      <Box sx={{ 
        px: { xs: 1, sm: 2 }, 
        pb: 1,
        overflow: 'hidden',
      }}>
        <NavigationStepper />
      </Box>
    </AppBar>
  );
};

export default Header;