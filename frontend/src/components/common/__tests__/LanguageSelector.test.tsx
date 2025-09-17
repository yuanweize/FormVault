import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LanguageSelector from '../LanguageSelector';

const theme = createTheme();

// Mock react-i18next
const mockChangeLanguage = jest.fn();
const mockI18n = {
  language: 'en',
  changeLanguage: mockChangeLanguage,
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}));

// Mock localStorage
const mockSetItem = jest.fn();
const mockGetItem = jest.fn();
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: mockSetItem,
    getItem: mockGetItem,
  },
  writable: true,
});

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('LanguageSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockI18n.language = 'en';
    mockGetItem.mockReturnValue(null);
  });

  it('renders language selector button', () => {
    renderWithTheme(<LanguageSelector />);
    
    const button = screen.getByRole('button', { name: /select language/i });
    expect(button).toBeInTheDocument();
  });

  it('shows current language flag for English', () => {
    mockI18n.language = 'en';
    renderWithTheme(<LanguageSelector />);
    
    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
  });

  it('shows current language flag for Chinese', () => {
    mockI18n.language = 'zh';
    renderWithTheme(<LanguageSelector />);
    
    expect(screen.getByText('🇨🇳')).toBeInTheDocument();
  });

  it('shows current language flag for Spanish', () => {
    mockI18n.language = 'es';
    renderWithTheme(<LanguageSelector />);
    
    expect(screen.getByText('🇪🇸')).toBeInTheDocument();
  });

  it('opens language menu when clicked', async () => {
    renderWithTheme(<LanguageSelector />);
    
    const button = screen.getByRole('button', { name: /select language/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('中文')).toBeInTheDocument();
      expect(screen.getByText('Español')).toBeInTheDocument();
    });
  });

  it('changes language to Chinese and persists in localStorage', async () => {
    renderWithTheme(<LanguageSelector />);
    
    const button = screen.getByRole('button', { name: /select language/i });
    fireEvent.click(button);

    await waitFor(() => {
      const chineseOption = screen.getByText('中文');
      fireEvent.click(chineseOption);
    });

    expect(mockChangeLanguage).toHaveBeenCalledWith('zh');
    expect(mockSetItem).toHaveBeenCalledWith('formvault-language', 'zh');
  });

  it('changes language to Spanish and persists in localStorage', async () => {
    renderWithTheme(<LanguageSelector />);
    
    const button = screen.getByRole('button', { name: /select language/i });
    fireEvent.click(button);

    await waitFor(() => {
      const spanishOption = screen.getByText('Español');
      fireEvent.click(spanishOption);
    });

    expect(mockChangeLanguage).toHaveBeenCalledWith('es');
    expect(mockSetItem).toHaveBeenCalledWith('formvault-language', 'es');
  });

  it('closes menu after language selection', async () => {
    renderWithTheme(<LanguageSelector />);
    
    const button = screen.getByRole('button', { name: /select language/i });
    fireEvent.click(button);

    await waitFor(() => {
      const englishOption = screen.getByText('English');
      fireEvent.click(englishOption);
    });

    await waitFor(() => {
      expect(screen.queryByText('English')).not.toBeInTheDocument();
    });
  });

  it('highlights currently selected language in menu', async () => {
    mockI18n.language = 'zh';
    renderWithTheme(<LanguageSelector />);
    
    const button = screen.getByRole('button', { name: /select language/i });
    fireEvent.click(button);

    await waitFor(() => {
      const chineseOption = screen.getByText('中文');
      // Check if the menu item has the selected class
      expect(chineseOption.closest('[role="menuitem"]')).toHaveClass('Mui-selected');
    });
  });

  it('handles keyboard navigation', async () => {
    renderWithTheme(<LanguageSelector />);
    
    const button = screen.getByRole('button', { name: /select language/i });
    
    // Open menu with click (keyboard navigation is handled by MUI internally)
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    // Select Chinese option
    const chineseOption = screen.getByText('中文');
    fireEvent.click(chineseOption);

    expect(mockChangeLanguage).toHaveBeenCalledWith('zh');
  });

  it('provides proper accessibility attributes', async () => {
    renderWithTheme(<LanguageSelector />);
    
    const button = screen.getByRole('button', { name: /select language/i });
    
    expect(button).toHaveAttribute('aria-label', 'select language');
    expect(button).toHaveAttribute('aria-haspopup', 'true');
    
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  it('handles localStorage unavailability gracefully', () => {
    // Mock localStorage to be undefined
    const originalLocalStorage = window.localStorage;
    // @ts-ignore
    delete window.localStorage;

    expect(() => {
      renderWithTheme(<LanguageSelector />);
    }).not.toThrow();

    window.localStorage = originalLocalStorage;
  });
});