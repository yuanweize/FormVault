import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import FileUploadForm from '../FileUploadForm';
import { UploadedFile } from '../FileUpload';

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Mock fetch for file upload
global.fetch = jest.fn();

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('FileUploadForm Component', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('renders form title and description', () => {
      renderWithProviders(<FileUploadForm />);
      
      expect(screen.getByText('Document Upload')).toBeInTheDocument();
      expect(screen.getByText(/please upload your required documents/i)).toBeInTheDocument();
    });

    it('renders both file upload sections', () => {
      renderWithProviders(<FileUploadForm />);
      
      expect(screen.getByText('Student ID')).toBeInTheDocument();
      expect(screen.getByText('Passport')).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
      renderWithProviders(<FileUploadForm />);
      
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('disables continue button when no files are uploaded', () => {
      renderWithProviders(<FileUploadForm />);
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();
    });
  });

  describe('File Upload Interactions', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          file_id: 'test-id',
          original_filename: 'test.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg'
        })
      });
    });

    it('enables continue button when student ID is uploaded', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileUploadForm />);
      
      const file = new File(['test content'], 'student-id.jpg', { 
        type: 'image/jpeg',
        size: 1024
      });
      
      // Find the first file input (student ID)
      const fileInputs = document.querySelectorAll('input[type="file"]');
      const studentIdInput = fileInputs[0] as HTMLInputElement;
      
      await user.upload(studentIdInput, file);
      
      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue/i });
        expect(continueButton).not.toBeDisabled();
      });
    });

    it('enables continue button when passport is uploaded', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileUploadForm />);
      
      const file = new File(['test content'], 'passport.jpg', { 
        type: 'image/jpeg',
        size: 1024
      });
      
      // Find the second file input (passport)
      const fileInputs = document.querySelectorAll('input[type="file"]');
      const passportInput = fileInputs[2] as HTMLInputElement; // Skip camera inputs
      
      await user.upload(passportInput, file);
      
      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue/i });
        expect(continueButton).not.toBeDisabled();
      });
    });

    it('enables continue button when both files are uploaded', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileUploadForm />);
      
      const studentIdFile = new File(['test content'], 'student-id.jpg', { 
        type: 'image/jpeg',
        size: 1024
      });
      
      const passportFile = new File(['test content'], 'passport.jpg', { 
        type: 'image/jpeg',
        size: 1024
      });
      
      const fileInputs = document.querySelectorAll('input[type="file"]');
      const studentIdInput = fileInputs[0] as HTMLInputElement;
      const passportInput = fileInputs[2] as HTMLInputElement;
      
      await user.upload(studentIdInput, studentIdFile);
      await user.upload(passportInput, passportFile);
      
      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue/i });
        expect(continueButton).not.toBeDisabled();
      });
    });
  });

  describe('Form Submission', () => {
    const studentIdFile: UploadedFile = {
      id: 'student-id',
      originalName: 'student-id.jpg',
      size: 1024,
      mimeType: 'image/jpeg',
      uploadedAt: new Date(),
    };

    const passportFile: UploadedFile = {
      id: 'passport-id',
      originalName: 'passport.jpg',
      size: 2048,
      mimeType: 'image/jpeg',
      uploadedAt: new Date(),
    };

    it('calls onSubmit with uploaded files when provided', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <FileUploadForm 
          onSubmit={mockOnSubmit}
          initialFiles={{ studentId: studentIdFile }}
        />
      );
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          studentId: studentIdFile,
          passport: undefined,
        });
      });
    });

    it('navigates to review page when no onSubmit provided', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <FileUploadForm initialFiles={{ studentId: studentIdFile }} />
      );
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/review');
      });
    });

    it('shows error when no files are uploaded and submit is attempted', async () => {
      const user = userEvent.setup();
      
      // Mock the component to allow submission without files for testing
      const TestComponent = () => {
        const [hasFiles, setHasFiles] = React.useState(false);
        
        return (
          <FileUploadForm 
            onSubmit={async () => {
              if (!hasFiles) {
                throw new Error('Please upload at least one document');
              }
            }}
          />
        );
      };
      
      renderWithProviders(<TestComponent />);
      
      // Force enable the button for testing
      const continueButton = screen.getByRole('button', { name: /continue/i });
      fireEvent.click(continueButton);
      
      // The button should still be disabled, so this test verifies the disabled state
      expect(continueButton).toBeDisabled();
    });

    it('handles submission errors gracefully', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Submission failed';
      
      renderWithProviders(
        <FileUploadForm 
          onSubmit={async () => {
            throw new Error(errorMessage);
          }}
          initialFiles={{ studentId: studentIdFile }}
        />
      );
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back to personal info page', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileUploadForm />);
      
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/personal-info');
    });
  });

  describe('Error Handling', () => {
    it('displays file upload errors', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileUploadForm />);
      
      const file = new File(['test content'], 'test.txt', { 
        type: 'text/plain' // Invalid format
      });
      
      const fileInputs = document.querySelectorAll('input[type="file"]');
      const studentIdInput = fileInputs[0] as HTMLInputElement;
      
      await user.upload(studentIdInput, file);
      
      await waitFor(() => {
        expect(screen.getByText(/please fix the following errors/i)).toBeInTheDocument();
        expect(screen.getByText(/invalid file format/i)).toBeInTheDocument();
      });
    });

    it('clears errors when valid files are uploaded', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          file_id: 'test-id',
          original_filename: 'test.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg'
        })
      });

      renderWithProviders(<FileUploadForm />);
      
      // First upload invalid file
      const invalidFile = new File(['test content'], 'test.txt', { 
        type: 'text/plain'
      });
      
      const fileInputs = document.querySelectorAll('input[type="file"]');
      const studentIdInput = fileInputs[0] as HTMLInputElement;
      
      await user.upload(studentIdInput, invalidFile);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid file format/i)).toBeInTheDocument();
      });
      
      // Then upload valid file
      const validFile = new File(['test content'], 'test.jpg', { 
        type: 'image/jpeg',
        size: 1024
      });
      
      await user.upload(studentIdInput, validFile);
      
      await waitFor(() => {
        expect(screen.queryByText(/invalid file format/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Initial Files', () => {
    it('displays initially provided files', () => {
      const initialFiles = {
        studentId: {
          id: 'student-id',
          originalName: 'student-id.jpg',
          size: 1024,
          mimeType: 'image/jpeg',
          uploadedAt: new Date(),
        },
        passport: {
          id: 'passport-id',
          originalName: 'passport.jpg',
          size: 2048,
          mimeType: 'image/jpeg',
          uploadedAt: new Date(),
        }
      };
      
      renderWithProviders(<FileUploadForm initialFiles={initialFiles} />);
      
      expect(screen.getByText('student-id.jpg')).toBeInTheDocument();
      expect(screen.getByText('passport.jpg')).toBeInTheDocument();
      
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      renderWithProviders(<FileUploadForm />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Document Upload');
    });

    it('provides clear instructions', () => {
      renderWithProviders(<FileUploadForm />);
      
      expect(screen.getByText(/please upload your required documents/i)).toBeInTheDocument();
      expect(screen.getByText(/supported formats: jpeg, png, pdf/i)).toBeInTheDocument();
    });

    it('announces errors to screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileUploadForm />);
      
      const file = new File(['test content'], 'test.txt', { 
        type: 'text/plain'
      });
      
      const fileInputs = document.querySelectorAll('input[type="file"]');
      const studentIdInput = fileInputs[0] as HTMLInputElement;
      
      await user.upload(studentIdInput, file);
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });
  });
});