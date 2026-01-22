// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

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