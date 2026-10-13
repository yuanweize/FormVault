import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LeadInquiryForm } from '../LeadInquiryForm';
import { applicationService } from '../../../services/applicationService';

// Mock applicationService
jest.mock('../../../services/applicationService', () => {
  const actual = jest.requireActual('../../../services/applicationService');
  return {
    ...actual,
    applicationService: {
      submitInquiry: jest.fn(),
      getPortalConfig: jest.fn().mockResolvedValue({
        success: true,
        document_intake_policy: 'DISABLED',
      }),
      createIntakeSession: jest.fn().mockResolvedValue({
        success: true,
        session_token: 'mock-session-token',
        expires_at: '2026-10-14T00:00:00Z',
      }),
      uploadIntakeDocument: jest.fn().mockResolvedValue({
        id: 'doc-123',
        document_type: 'PASSPORT',
        original_filename: 'passport.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        created_at: '2026-10-13T00:00:00Z',
      }),
      deleteIntakeDocument: jest.fn().mockResolvedValue({ success: true }),
    },
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: any) => {
      if (options?.defaultValue) return options.defaultValue;
      return _key;
    },
    i18n: { language: 'zh' },
  }),
}));

const theme = createTheme();

const renderForm = (onSuccess?: jest.Mock) => {
  return render(
    <ThemeProvider theme={theme}>
      <LeadInquiryForm onSuccess={onSuccess} />
    </ThemeProvider>
  );
};

describe('LeadInquiryForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (applicationService.getPortalConfig as jest.Mock).mockResolvedValue({
      success: true,
      document_intake_policy: 'DISABLED',
    });
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    sessionStorage.clear();
    delete (window as any).location;
    (window as any).location = new URL(
      'https://insure.hktse.eu.org/?utm_source=xiaohongshu&utm_campaign=oct2026&referral_code=wechat-group-a'
    );
  });

  it('renders initial stepper and step 1 fields', () => {
    renderForm();

    expect(screen.getByText('Health Insurance Enquiry for Foreigners in Czechia')).toBeInTheDocument();
    expect(screen.getAllByText('Basic Information').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Stay & Status').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Insurance Timing').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Contact & Documents').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Review & Submit').length).toBeGreaterThan(0);

    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date of Birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nationality/i)).toBeInTheDocument();
  });

  it('calculates derived age and student youth category from DOB', async () => {
    renderForm();

    const dobInput = screen.getByLabelText(/Date of Birth/i);
    fireEvent.change(dobInput, { target: { value: '2003-05-10' } });

    await waitFor(() => {
      expect(screen.getByText(/Student \/ Youth Discount Band \(18–26\)/i)).toBeInTheDocument();
    });
  });

  it('validates required fields before advancing to step 2', () => {
    renderForm();

    const nextButton = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextButton);

    expect(
      screen.getByText(/Please provide both your First Name and Last Name/i)
    ).toBeInTheDocument();
  });

  it('completes the 5-step intake flow with one submission and captured UTM parameters', async () => {
    const mockOnSuccess = jest.fn();
    (applicationService.submitInquiry as jest.Mock).mockResolvedValueOnce({
      success: true,
      reference_number: 'FV-20261013-ABCDEF',
      status: 'INQUIRY_RECEIVED',
      status_label: 'Enquiry Received',
      recipient: 'České pojištění a.s.',
      message: 'Your structured dossier has been registered.',
    });

    renderForm(mockOnSuccess);

    // STEP 0: Basic Information
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'San' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Zhang' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '2003-05-10' } });
    fireEvent.change(screen.getByLabelText(/Nationality/i), { target: { value: 'China' } });

    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    // STEP 1: Stay & Status
    await waitFor(() => {
      expect(screen.getByLabelText(/School \/ University/i)).toBeInTheDocument();
    });

    const schoolInput = screen.getByLabelText(/School \/ University/i);
    fireEvent.change(schoolInput, { target: { value: 'Czech Technical University in Prague (CTU)' } });

    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    // STEP 2: Coverage Timing
    await waitFor(() => {
      expect(screen.getByLabelText(/Requested Start Date/i)).toBeInTheDocument();
    });

    const startDateInput = screen.getByLabelText(/Requested Start Date/i);
    fireEvent.change(startDateInput, { target: { value: '2026-11-01' } });

    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    // STEP 3: Contact & Documents
    await waitFor(() => {
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'zhangsan@student.cvut.cz' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: '+420 777 888 999' },
    });
    fireEvent.change(screen.getByLabelText(/WeChat ID/i), {
      target: { value: 'zhangsan_prague' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Next Step/i }));

    // STEP 4: Review & Submit
    await waitFor(() => {
      expect(screen.getByText(/Review Your Enquiry Details/i)).toBeInTheDocument();
      expect(screen.getByText(/San Zhang/i)).toBeInTheDocument();
      expect(screen.getByText(/zhangsan@student.cvut.cz/i)).toBeInTheDocument();
      expect(screen.getByText(/Czech Technical University in Prague \(CTU\)/i)).toBeInTheDocument();
    });

    // Check single consent checkbox
    const consentCheckbox = screen.getByRole('checkbox', {
      name: /I agree that HKTSE s\.r\.o\. may forward my insurance enquiry/i,
    });
    fireEvent.click(consentCheckbox);

    // Submit
    const submitButton = screen.getByRole('button', { name: /Submit Insurance Request/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(applicationService.submitInquiry).toHaveBeenCalledTimes(1);
    });

    const submittedPayload = (applicationService.submitInquiry as jest.Mock).mock.calls[0][0];
    expect(submittedPayload.first_name).toBe('San');
    expect(submittedPayload.last_name).toBe('Zhang');
    expect(submittedPayload.date_of_birth).toBe('2003-05-10');
    expect(submittedPayload.student_status).toBe(true);
    expect(submittedPayload.school_or_university).toBe('Czech Technical University in Prague (CTU)');
    expect(submittedPayload.email).toBe('zhangsan@student.cvut.cz');
    expect(submittedPayload.phone).toBe('+420 777 888 999');
    expect(submittedPayload.wechat_id).toBe('zhangsan_prague');
    expect(submittedPayload.preferred_language).toBe('zh');
    expect(submittedPayload.utm_source).toBe('xiaohongshu');
    expect(submittedPayload.utm_campaign).toBe('oct2026');
    expect(submittedPayload.referral_code).toBe('wechat-group-a');
    expect(submittedPayload.handoff_consent).toBe(true);

    // Verify Success Screen rendered
    await waitFor(() => {
      expect(screen.getByText(/Enquiry Received Successfully!/i)).toBeInTheDocument();
      expect(screen.getByText('FV-20261013-ABCDEF')).toBeInTheDocument();
      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ reference_number: 'FV-20261013-ABCDEF' })
      );
    });
  });
});
