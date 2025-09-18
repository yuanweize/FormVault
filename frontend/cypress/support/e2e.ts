// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions that we expect in our application
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});

// Add custom assertions
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-testid attribute.
       * @example cy.getByTestId('submit-button')
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      
      /**
       * Custom command to login as a test user
       * @example cy.loginAsUser('test@example.com', 'password')
       */
      loginAsUser(email: string, password: string): Chainable<void>;
      
      /**
       * Custom command to fill personal information form
       * @example cy.fillPersonalInfo(personalData)
       */
      fillPersonalInfo(data: PersonalInfoData): Chainable<void>;
      
      /**
       * Custom command to upload a test file
       * @example cy.uploadTestFile('student-id', 'image/jpeg')
       */
      uploadTestFile(fileType: string, mimeType: string): Chainable<void>;
    }
  }
}

interface PersonalInfoData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  dateOfBirth: string;
  insuranceType: string;
}