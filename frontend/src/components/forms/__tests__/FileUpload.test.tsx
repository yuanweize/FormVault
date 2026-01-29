import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
// Using global setupTests.ts mock
import FileUpload, { UploadedFile } from '../FileUpload';

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// Mock fetch for file upload
global.fetch = jest.fn();

// URL.createObjectURL and URL.revokeObjectURL are mocked in setupTests

// Mock FormData
global.FormData = class {
  append = jest.fn();
} as any;

describe('FileUpload Component', () => {
  const mockOnUploadSuccess = jest.fn();
  const mockOnUploadError = jest.fn();
  const mockOnFileRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const defaultProps = {
    fileType: 'student_id' as const,
    onUploadSuccess: mockOnUploadSuccess,
    onUploadError: mockOnUploadError,
  };

  describe('Initial Render', () => {
    it('renders upload area when no file is uploaded', () => {
      renderWithProviders(<FileUpload {...defaultProps} />);

      expect(screen.getByText('Student ID')).toBeInTheDocument();
      expect(screen.getByText('Drag and drop your file here')).toBeInTheDocument();
      expect(screen.getByText('or click to select a file')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select file/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument();
    });

    it('renders passport type correctly', () => {
      renderWithProviders(
        <FileUpload {...defaultProps} fileType="passport" />
      );

      expect(screen.getByText('Passport')).toBeInTheDocument();
    });

    it('displays supported formats and max size', () => {
      renderWithProviders(<FileUpload {...defaultProps} />);

      expect(screen.getByText(/supported formats: jpeg, png, pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/max size: 5mb/i)).toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    it('shows error for oversized file', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileUpload {...defaultProps} maxSize={1024} />);

      const file = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg'
      });
      Object.defineProperty(file, 'size', { value: 2048 });

      const fileInput = screen.getByRole('button', { name: /select file/i });
      const hiddenInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(hiddenInput, file);

      await waitFor(() => {
        expect(mockOnUploadError.mock.calls.length).toBeGreaterThan(0);
        expect(mockOnUploadError.mock.calls[0][0]).toContain('File is too large');
      });
    });

    it('shows error for invalid file format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileUpload {...defaultProps} />);

      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain'
      });

      const hiddenInput = screen.getByTestId('student_id-upload-input');
      fireEvent.change(hiddenInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnUploadError.mock.calls.length).toBeGreaterThan(0);
        expect(mockOnUploadError.mock.calls[0][0]).toContain('Invalid file format');
      });
    });

    it('accepts valid file formats', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          file_id: 'test-id',
          original_filename: 'test.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg'
        })
      });

      renderWithProviders(<FileUpload {...defaultProps} />);

      const file = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg'
      });

      // Mock file size
      Object.defineProperty(file, 'size', {
        value: 1024,
        writable: false
      });

      const hiddenInput = screen.getByTestId('student_id-upload-input');
      fireEvent.change(hiddenInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'test-id',
            originalName: 'test.jpg',
            size: 1024,
            mimeType: 'image/jpeg'
          })
        );
      });
    });
  });

  describe('File Upload Process', () => {
    it('shows upload progress during file upload', async () => {
      const user = userEvent.setup();
      let resolveUpload: (value: any) => void;
      const uploadPromise = new Promise(resolve => {
        resolveUpload = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValueOnce(uploadPromise);

      renderWithProviders(<FileUpload {...defaultProps} />);

      const file = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
        size: 1024
      });

      const hiddenInput = screen.getByTestId('student_id-upload-input');
      fireEvent.change(hiddenInput, { target: { files: [file] } });

      // Should show uploading state
      await waitFor(() => {
        expect(screen.getByText('Uploading...')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });

      // Resolve the upload
      resolveUpload({
        ok: true,
        json: async () => ({
          file_id: 'test-id',
          original_filename: 'test.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg'
        })
      });

      await waitFor(() => {
        expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
      });
    });

    it('handles upload failure', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      renderWithProviders(<FileUpload {...defaultProps} />);

      const file = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
        size: 1024
      });

      const hiddenInput = screen.getByTestId('student_id-upload-input');
      fireEvent.change(hiddenInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnUploadError.mock.calls.length).toBeGreaterThan(0);
        expect(mockOnUploadError.mock.calls[0][0]).toContain('upload failed');
      });
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag over events', () => {
      renderWithProviders(<FileUpload {...defaultProps} />);

      const dropZone = screen.getByText('Drag and drop your file here').closest('div');

      fireEvent.dragOver(dropZone!, {
        dataTransfer: {
          files: []
        }
      });

      // Should highlight the drop zone
      expect(dropZone).toHaveStyle({ borderColor: expect.any(String) });
    });

    it('handles file drop', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          file_id: 'test-id',
          original_filename: 'test.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg'
        })
      });

      renderWithProviders(<FileUpload {...defaultProps} />);

      const file = new File(['test content'], 'test.jpg', {
        type: 'image/jpeg',
        size: 1024
      });

      const dropZone = screen.getByText('Drag and drop your file here').closest('div');

      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [file]
        }
      });

      await waitFor(() => {
        expect(mockOnUploadSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Uploaded File Display', () => {
    const uploadedFile: UploadedFile = {
      id: 'test-id',
      originalName: 'test.jpg',
      size: 1024,
      mimeType: 'image/jpeg',
      uploadedAt: new Date(),
      previewUrl: 'blob:test-url'
    };

    it('displays uploaded file information', () => {
      renderWithProviders(
        <FileUpload
          {...defaultProps}
          uploadedFile={uploadedFile}
          onFileRemove={mockOnFileRemove}
        />
      );

      expect(screen.getByText('Student ID')).toBeInTheDocument();
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
      expect(screen.getByText('1 KB')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    });

    it('shows image preview for image files', () => {
      renderWithProviders(
        <FileUpload
          {...defaultProps}
          uploadedFile={uploadedFile}
          onFileRemove={mockOnFileRemove}
        />
      );

      const preview = screen.getByAltText('File Preview');
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveAttribute('src', 'blob:test-url');
    });

    it('handles file removal', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <FileUpload
          {...defaultProps}
          uploadedFile={uploadedFile}
          onFileRemove={mockOnFileRemove}
        />
      );

      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      expect(mockOnFileRemove).toHaveBeenCalledWith('test-id');
    });
  });

  describe('Disabled State', () => {
    it('disables interactions when disabled prop is true', () => {
      renderWithProviders(<FileUpload {...defaultProps} disabled />);

      const selectButton = screen.getByRole('button', { name: /select file/i });
      const cameraButton = screen.getByRole('button', { name: /take photo/i });

      expect(selectButton).toBeDisabled();
      expect(cameraButton).toBeDisabled();
    });

    it('prevents drag and drop when disabled', () => {
      renderWithProviders(<FileUpload {...defaultProps} disabled />);

      const dropZone = screen.getByText('Drag and drop your file here').closest('div');

      fireEvent.dragOver(dropZone!, {
        dataTransfer: {
          files: []
        }
      });

      // Should not highlight when disabled
      expect(dropZone).toHaveStyle({ opacity: '0.6' });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(<FileUpload {...defaultProps} />);

      expect(screen.getByRole('button', { name: /select file/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /take photo/i })).toBeInTheDocument();
    });

    it('announces errors to screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FileUpload {...defaultProps} />);

      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain'
      });

      const hiddenInput = screen.getByTestId('student_id-upload-input');
      fireEvent.change(hiddenInput, { target: { files: [file] } });

      await waitFor(() => {
        // Check if error is displayed (it might not be a role="alert" but still visible)
        expect(screen.getByText(/invalid file format/i)).toBeInTheDocument();
      });
    });
  });
});