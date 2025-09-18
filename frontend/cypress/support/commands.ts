/**
 * Custom Cypress commands for FormVault testing.
 */

// Add custom command type definitions
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Reset the test database to a clean state
       */
      resetDatabase(): Chainable<void>;
      
      /**
       * Seed the database with test data
       */
      seedTestData(): Chainable<void>;
      
      /**
       * Login as admin user
       */
      loginAsAdmin(): Chainable<void>;
      
      /**
       * Fill personal information form with valid data
       */
      fillPersonalInfoForm(data?: Partial<PersonalInfo>): Chainable<void>;
      
      /**
       * Upload a test file
       */
      uploadTestFile(fileType: 'student_id' | 'passport', fileName?: string): Chainable<void>;
      
      /**
       * Complete full application workflow
       */
      completeApplicationWorkflow(options?: ApplicationWorkflowOptions): Chainable<void>;
    }
  }
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  dateOfBirth: string;
  insuranceType: string;
}

interface ApplicationWorkflowOptions {
  personalInfo?: Partial<PersonalInfo>;
  skipFileUpload?: boolean;
  skipEmailExport?: boolean;
}

// Reset database command
Cypress.Commands.add('resetDatabase', () => {
  cy.task('resetDatabase');
});

// Seed test data command
Cypress.Commands.add('seedTestData', () => {
  cy.task('seedTestData');
});

// Login as admin command
Cypress.Commands.add('loginAsAdmin', () => {
  // For now, just visit admin page directly
  // In a real app, this would handle authentication
  cy.visit('/admin');
});

// Fill personal information form command
Cypress.Commands.add('fillPersonalInfoForm', (data: Partial<PersonalInfo> = {}) => {
  const defaultData: PersonalInfo = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    street: '123 Main Street',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    country: 'USA',
    dateOfBirth: '1990-01-01',
    insuranceType: 'health',
    ...data
  };

  cy.get('[data-testid="first-name-input"]').clear().type(defaultData.firstName);
  cy.get('[data-testid="last-name-input"]').clear().type(defaultData.lastName);
  cy.get('[data-testid="email-input"]').clear().type(defaultData.email);
  cy.get('[data-testid="phone-input"]').clear().type(defaultData.phone);
  cy.get('[data-testid="address-street-input"]').clear().type(defaultData.street);
  cy.get('[data-testid="address-city-input"]').clear().type(defaultData.city);
  cy.get('[data-testid="address-state-input"]').clear().type(defaultData.state);
  cy.get('[data-testid="address-zip-input"]').clear().type(defaultData.zipCode);
  cy.get('[data-testid="address-country-select"]').select(defaultData.country);
  cy.get('[data-testid="date-of-birth-input"]').clear().type(defaultData.dateOfBirth);
  cy.get('[data-testid="insurance-type-select"]').select(defaultData.insuranceType);
});

// Upload test file command
Cypress.Commands.add('uploadTestFile', (fileType: 'student_id' | 'passport', fileName?: string) => {
  const defaultFileName = fileType === 'student_id' ? 'sample-student-id.jpg' : 'sample-passport.pdf';
  const actualFileName = fileName || defaultFileName;
  const mimeType = actualFileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
  
  cy.fixture(actualFileName, 'base64').then(fileContent => {
    cy.get(`[data-testid="${fileType}-upload"]`).selectFile({
      contents: Cypress.Buffer.from(fileContent, 'base64'),
      fileName: actualFileName,
      mimeType: mimeType
    });
  });
  
  // Wait for upload success
  cy.get(`[data-testid="${fileType}-upload-success"]`).should('be.visible');
});

// Complete application workflow command
Cypress.Commands.add('completeApplicationWorkflow', (options: ApplicationWorkflowOptions = {}) => {
  // Step 1: Navigate to personal info form
  cy.visit('/');
  cy.get('[data-testid="start-application-btn"]').click();
  
  // Step 2: Fill personal information
  cy.fillPersonalInfoForm(options.personalInfo);
  cy.get('[data-testid="next-step-btn"]').click();
  
  // Step 3: Upload files (unless skipped)
  if (!options.skipFileUpload) {
    cy.uploadTestFile('student_id');
    cy.uploadTestFile('passport');
    cy.get('[data-testid="next-step-btn"]').click();
  }
  
  // Step 4: Review and submit
  cy.url().should('include', '/review');
  cy.get('[data-testid="submit-application-btn"]').click();
  
  // Step 5: Confirmation and email export (unless skipped)
  cy.url().should('include', '/confirmation');
  
  if (!options.skipEmailExport) {
    cy.get('[data-testid="export-email-input"]').type('insurance@company.com');
    cy.get('[data-testid="insurance-company-input"]').type('Test Insurance Co');
    cy.get('[data-testid="export-btn"]').click();
    cy.get('[data-testid="export-success-message"]').should('be.visible');
  }
});

// Prevent TypeScript errors
export {};