import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { FileUploadForm } from '../FileUploadForm';
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

      expect(screen.getByText('Upload Documents')).toBeInTheDocument();
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

    it('remains disabled when only student ID is uploaded', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileUploadForm />);

      const file = new File(['test content'], 'student-id.jpg', {
        type: 'image/jpeg'
      });
      Object.defineProperty(file, 'size', { value: 1024 });

      // Find the first file input (student ID)
      const studentIdInput = screen.getByTestId('student_id-upload-input');

      fireEvent.change(studentIdInput, { target: { files: [file] } });

      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue/i });
        expect(continueButton).toBeDisabled();
      });
    });

    it('remains disabled when only passport is uploaded', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileUploadForm />);

      const file = new File(['test content'], 'passport.jpg', {
        type: 'image/jpeg'
      });
      Object.defineProperty(file, 'size', { value: 1024 });

      // Find the second file input (passport)
      const passportInput = screen.getByTestId('passport-upload-input');

      fireEvent.change(passportInput, { target: { files: [file] } });

      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue/i });
        expect(continueButton).toBeDisabled();
      });
    });

    it('enables continue button when both files are uploaded', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileUploadForm />);

      const studentIdFile = new File(['test content'], 'student-id.jpg', {
        type: 'image/jpeg'
      });
      Object.defineProperty(studentIdFile, 'size', { value: 1024 });

      const passportFile = new File(['test content'], 'passport.jpg', {
        type: 'image/jpeg'
      });
      Object.defineProperty(passportFile, 'size', { value: 1024 });

      const studentIdInput = screen.getByTestId('student_id-upload-input');
      const passportInput = screen.getByTestId('passport-upload-input');

      fireEvent.change(studentIdInput, { target: { files: [studentIdFile] } });
      fireEvent.change(passportInput, { target: { files: [passportFile] } });

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
          initialFiles={{ studentId: studentIdFile, passport: passportFile }}
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
        <FileUploadForm initialFiles={{ studentId: studentIdFile, passport: passportFile }} />
      );

      const continueButton = screen.getByRole('button', { name: /continue/i });
      await user.click(continueButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/review');
      });
    });

    it('handles submission errors gracefully', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Submission failed';

      renderWithProviders(
        <FileUploadForm
          onSubmit={async () => {
            throw new Error(errorMessage);
          }}
          initialFiles={{ studentId: studentIdFile, passport: passportFile }}
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

      const studentIdInput = screen.getByTestId('student_id-upload-input');

      fireEvent.change(studentIdInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/upload errors/i)).toBeInTheDocument();
        const errors = screen.getAllByText(/invalid file format/i);
        expect(errors.length).toBeGreaterThan(0);
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
      expect(heading).toHaveTextContent('Upload Documents');
    });

    it('provides clear instructions', () => {
      renderWithProviders(<FileUploadForm />);

      expect(screen.getByText(/please upload your required documents/i)).toBeInTheDocument();
      const supportedFormats = screen.getAllByText(/supported formats: jpeg, png, pdf/i);
      expect(supportedFormats.length).toBeGreaterThan(0);
    });

    it('announces errors to screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileUploadForm />);

      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain'
      });

      const studentIdInput = screen.getByTestId('student_id-upload-input');

      fireEvent.change(studentIdInput, { target: { files: [file] } });

      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
      });
    });
  });
});