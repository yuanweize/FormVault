// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock canvas APIs used by components/tests to avoid JSDOM errors
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: [] })),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  })),
});

// Mock URL APIs used for file previews
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'blob:mock-preview'),
});
Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// Mock matchMedia for MUI useMediaQuery
const createMatchMedia = (matches = false) =>
  jest.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));

const ensureMatchMedia = () => {
  const matcher = createMatchMedia(false);
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matcher,
  });
  Object.defineProperty(global, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matcher,
  });
};

ensureMatchMedia();

beforeEach(() => {
  ensureMatchMedia();
});

afterEach(() => {
  ensureMatchMedia();
});

// Mock axios to avoid ES module issues
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    defaults: {
      baseURL: 'http://localhost:8000/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    },
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
  })),
  default: {
    create: jest.fn(() => ({
      defaults: {
        baseURL: 'http://localhost:8000/api/v1',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      },
      interceptors: {
        request: {
          use: jest.fn(),
        },
        response: {
          use: jest.fn(),
        },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
    })),
  },
}));

// Mock axios-mock-adapter
jest.mock('axios-mock-adapter', () => {
  return jest.fn().mockImplementation(() => ({
    onGet: jest.fn().mockReturnThis(),
    onPost: jest.fn().mockReturnThis(),
    onPut: jest.fn().mockReturnThis(),
    onDelete: jest.fn().mockReturnThis(),
    reply: jest.fn().mockReturnThis(),
    replyOnce: jest.fn().mockReturnThis(),
    networkError: jest.fn().mockReturnThis(),
    timeout: jest.fn().mockReturnThis(),
    reset: jest.fn(),
    restore: jest.fn(),
    history: {
      get: [],
      post: [],
      put: [],
      delete: [],
    },
  }));
});

// Mock environment variables
process.env.REACT_APP_API_BASE_URL = 'http://localhost:8000';

// Mock react-i18next globally
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, any>) => {
      // Return key as fallback
      if (!options) return key;

      // Handle interpolation
      return Object.entries(options).reduce((result, [k, v]) =>
        result.replace(`{{${k}}}`, v),
        key
      );
    },
    i18n: {
      changeLanguage: () => new Promise(() => { }),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));