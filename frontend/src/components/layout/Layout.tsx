import React from 'react';
import { Box, Container } from '@mui/material';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Header />
      <Container
        component="main"
        maxWidth="lg"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          py: { xs: 2, md: 4 },
          px: { xs: 2, md: 0 }, // minimal padding on mobile, none on desktop (Container handles margins)
        }}
      >
        {children}
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout;