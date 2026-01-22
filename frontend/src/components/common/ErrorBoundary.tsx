import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Alert,
} from '@mui/material';
import { RefreshOutlined, HomeOutlined } from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container 
          maxWidth="md" 
          sx={{ 
            py: { xs: 4, sm: 6, md: 8 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              p: { xs: 3, sm: 4 }, 
              textAlign: 'center',
              mx: { xs: 0, sm: 'auto' },
            }}
          >
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
              >
                Oops! Something went wrong
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                We're sorry, but an unexpected error occurred. Please try refreshing the page or return to the home page.
              </Typography>
            </Alert>

            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2, 
              justifyContent: 'center', 
              mt: 3,
            }}>
              <Button
                variant="contained"
                startIcon={<RefreshOutlined />}
                onClick={this.handleReload}
                sx={{ 
                  minHeight: '48px',
                  flex: { xs: 1, sm: 'none' },
                }}
              >
                Refresh Page
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeOutlined />}
                onClick={this.handleGoHome}
                sx={{ 
                  minHeight: '48px',
                  flex: { xs: 1, sm: 'none' },
                }}
              >
                Go Home
              </Button>
            </Box>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mt: 4, textAlign: 'left' }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                >
                  Error Details (Development Only):
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </Box>
              </Box>
            )}
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;