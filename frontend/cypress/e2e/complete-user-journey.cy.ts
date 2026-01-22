/**
 * End-to-end tests for complete user journeys through the insurance application process.
 */

describe('Complete User Journey', () => {
  beforeEach(() => {
    // Reset database state before each test
    cy.task('resetDatabase');
    
    // Visit the application homepage
    cy.visit('/');
  });

  it('should complete full application submission workflow', () => {
    // Step 1: Navigate to personal information form
    cy.get('[data-testid="start-application-btn"]').click();
    cy.url().should('include', '/personal-info');

    // Step 2: Fill out personal information form
    cy.get('[data-testid="first-name-input"]').type('John');
    cy.get('[data-testid="last-name-input"]').type('Doe');
    cy.get('[data-testid="email-input"]').type('john.doe@example.com');
    cy.get('[data-testid="phone-input"]').type('+1234567890');
    
    // Fill address fields
    cy.get('[data-testid="address-street-input"]').type('123 Main Street');
    cy.get('[data-testid="address-city-input"]').type('Anytown');
    cy.get('[data-testid="address-state-input"]').type('CA');
    cy.get('[data-testid="address-zip-input"]').type('12345');
    cy.get('[data-testid="address-country-select"]').select('USA');
    
    // Fill other required fields
    cy.get('[data-testid="date-of-birth-input"]').type('1990-01-01');
    cy.get('[data-testid="insurance-type-select"]').select('health');
    
    // Submit personal information
    cy.get('[data-testid="next-step-btn"]').click();
    
    // Step 3: Upload student ID file
    cy.url().should('include', '/file-upload');
    
    // Upload student ID
    cy.fixture('sample-student-id.jpg', 'base64').then(fileContent => {
      cy.get('[data-testid="student-id-upload"]').selectFile({
        contents: Cypress.Buffer.from(fileContent, 'base64'),
        fileName: 'student-id.jpg',
        mimeType: 'image/jpeg'
      });
    });
    
    // Wait for upload to complete
    cy.get('[data-testid="student-id-upload-success"]').should('be.visible');
    
    // Upload passport
    cy.fixture('sample-passport.pdf', 'base64').then(fileContent => {
      cy.get('[data-testid="passport-upload"]').selectFile({
        contents: Cypress.Buffer.from(fileContent, 'base64'),
        fileName: 'passport.pdf',
        mimeType: 'application/pdf'
      });
    });
    
    // Wait for upload to complete
    cy.get('[data-testid="passport-upload-success"]').should('be.visible');
    
    // Proceed to review
    cy.get('[data-testid="next-step-btn"]').click();
    
    // Step 4: Review application
    cy.url().should('include', '/review');
    
    // Verify personal information is displayed correctly
    cy.get('[data-testid="review-name"]').should('contain', 'John Doe');
    cy.get('[data-testid="review-email"]').should('contain', 'john.doe@example.com');
    cy.get('[data-testid="review-insurance-type"]').should('contain', 'Health Insurance');
    
    // Verify files are listed
    cy.get('[data-testid="review-student-id"]').should('contain', 'student-id.jpg');
    cy.get('[data-testid="review-passport"]').should('contain', 'passport.pdf');
    
    // Submit application
    cy.get('[data-testid="submit-application-btn"]').click();
    
    // Step 5: Confirmation page
    cy.url().should('include', '/confirmation');
    
    // Verify confirmation details
    cy.get('[data-testid="confirmation-message"]').should('be.visible');
    cy.get('[data-testid="reference-number"]').should('exist').and('not.be.empty');
    
    // Test email export functionality
    cy.get('[data-testid="export-email-input"]').type('insurance@company.com');
    cy.get('[data-testid="insurance-company-input"]').type('Test Insurance Co');
    cy.get('[data-testid="export-btn"]').click();
    
    // Verify export success
    cy.get('[data-testid="export-success-message"]').should('be.visible');
    
    // Navigate to success page
    cy.get('[data-testid="view-success-btn"]').click();
    cy.url().should('include', '/success');
  });

  it('should handle form validation errors gracefully', () => {
    cy.visit('/personal-info');
    
    // Try to submit empty form
    cy.get('[data-testid="next-step-btn"]').click();
    
    // Verify validation errors are displayed
    cy.get('[data-testid="first-name-error"]').should('be.visible');
    cy.get('[data-testid="last-name-error"]').should('be.visible');
    cy.get('[data-testid="email-error"]').should('be.visible');
    
    // Fill some fields with invalid data
    cy.get('[data-testid="email-input"]').type('invalid-email');
    cy.get('[data-testid="phone-input"]').type('invalid-phone');
    
    // Try to submit again
    cy.get('[data-testid="next-step-btn"]').click();
    
    // Verify specific validation messages
    cy.get('[data-testid="email-error"]').should('contain', 'Please enter a valid email address');
    cy.get('[data-testid="phone-error"]').should('contain', 'Please enter a valid phone number');
    
    // Fix validation errors
    cy.get('[data-testid="first-name-input"]').type('John');
    cy.get('[data-testid="last-name-input"]').type('Doe');
    cy.get('[data-testid="email-input"]').clear().type('john.doe@example.com');
    cy.get('[data-testid="phone-input"]').clear().type('+1234567890');
    
    // Complete required fields
    cy.get('[data-testid="address-street-input"]').type('123 Main St');
    cy.get('[data-testid="address-city-input"]').type('Anytown');
    cy.get('[data-testid="address-state-input"]').type('CA');
    cy.get('[data-testid="address-zip-input"]').type('12345');
    cy.get('[data-testid="address-country-select"]').select('USA');
    cy.get('[data-testid="date-of-birth-input"]').type('1990-01-01');
    cy.get('[data-testid="insurance-type-select"]').select('health');
    
    // Should now be able to proceed
    cy.get('[data-testid="next-step-btn"]').click();
    cy.url().should('include', '/file-upload');
  });

  it('should handle file upload errors', () => {
    // Complete personal info first
    cy.visit('/personal-info');
    fillPersonalInfo();
    cy.get('[data-testid="next-step-btn"]').click();
    
    // Try to upload invalid file type
    cy.fixture('invalid-file.txt').then(fileContent => {
      cy.get('[data-testid="student-id-upload"]').selectFile({
        contents: fileContent,
        fileName: 'invalid-file.txt',
        mimeType: 'text/plain'
      });
    });
    
    // Verify error message
    cy.get('[data-testid="student-id-upload-error"]')
      .should('be.visible')
      .and('contain', 'Please upload a valid image or PDF file');
    
    // Try to upload file that's too large (mock large file)
    cy.fixture('large-file.jpg', 'base64').then(fileContent => {
      // Create a large file by repeating content
      const largeContent = fileContent.repeat(100);
      
      cy.get('[data-testid="passport-upload"]').selectFile({
        contents: Cypress.Buffer.from(largeContent, 'base64'),
        fileName: 'large-file.jpg',
        mimeType: 'image/jpeg'
      });
    });
    
    // Verify size error
    cy.get('[data-testid="passport-upload-error"]')
      .should('be.visible')
      .and('contain', 'File size must be less than 5MB');
    
    // Upload valid files
    cy.fixture('sample-student-id.jpg', 'base64').then(fileContent => {
      cy.get('[data-testid="student-id-upload"]').selectFile({
        contents: Cypress.Buffer.from(fileContent, 'base64'),
        fileName: 'student-id.jpg',
        mimeType: 'image/jpeg'
      });
    });
    
    cy.fixture('sample-passport.pdf', 'base64').then(fileContent => {
      cy.get('[data-testid="passport-upload"]').selectFile({
        contents: Cypress.Buffer.from(fileContent, 'base64'),
        fileName: 'passport.pdf',
        mimeType: 'application/pdf'
      });
    });
    
    // Should be able to proceed
    cy.get('[data-testid="student-id-upload-success"]').should('be.visible');
    cy.get('[data-testid="passport-upload-success"]').should('be.visible');
    cy.get('[data-testid="next-step-btn"]').should('not.be.disabled');
  });

  it('should support language switching throughout the journey', () => {
    // Start in English
    cy.visit('/');
    cy.get('[data-testid="language-selector"]').should('contain', 'English');
    
    // Switch to Chinese
    cy.get('[data-testid="language-selector"]').click();
    cy.get('[data-testid="language-option-zh"]').click();
    
    // Verify UI is in Chinese
    cy.get('[data-testid="start-application-btn"]').should('contain', '开始申请');
    
    // Navigate to form
    cy.get('[data-testid="start-application-btn"]').click();
    
    // Verify form labels are in Chinese
    cy.get('[data-testid="first-name-label"]').should('contain', '名字');
    cy.get('[data-testid="last-name-label"]').should('contain', '姓氏');
    
    // Switch to Spanish mid-journey
    cy.get('[data-testid="language-selector"]').click();
    cy.get('[data-testid="language-option-es"]').click();
    
    // Verify form labels updated to Spanish
    cy.get('[data-testid="first-name-label"]').should('contain', 'Nombre');
    cy.get('[data-testid="last-name-label"]').should('contain', 'Apellido');
    
    // Fill form in Spanish context
    fillPersonalInfo();
    
    // Verify validation messages are in Spanish
    cy.get('[data-testid="email-input"]').clear().type('invalid');
    cy.get('[data-testid="next-step-btn"]').click();
    cy.get('[data-testid="email-error"]').should('contain', 'Por favor ingrese un email válido');
  });

  it('should work properly on mobile devices', () => {
    // Set mobile viewport
    cy.viewport('iphone-x');
    
    cy.visit('/');
    
    // Verify mobile navigation
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
    cy.get('[data-testid="mobile-menu-button"]').click();
    cy.get('[data-testid="mobile-navigation"]').should('be.visible');
    
    // Start application on mobile
    cy.get('[data-testid="start-application-btn"]').click();
    
    // Verify form is mobile-optimized
    cy.get('[data-testid="personal-info-form"]').should('be.visible');
    cy.get('[data-testid="first-name-input"]').should('be.visible');
    
    // Test mobile file upload with camera
    fillPersonalInfo();
    cy.get('[data-testid="next-step-btn"]').click();
    
    // Verify mobile file upload options
    cy.get('[data-testid="student-id-upload-mobile"]').should('be.visible');
    cy.get('[data-testid="camera-capture-btn"]').should('be.visible');
    
    // Test touch-friendly interactions
    cy.get('[data-testid="camera-capture-btn"]').click();
    cy.get('[data-testid="camera-modal"]').should('be.visible');
  });

  it('should handle network errors gracefully', () => {
    // Intercept API calls to simulate network errors
    cy.intercept('POST', '/api/v1/applications', { forceNetworkError: true }).as('networkError');
    
    cy.visit('/personal-info');
    fillPersonalInfo();
    cy.get('[data-testid="next-step-btn"]').click();
    
    // Wait for network error
    cy.wait('@networkError');
    
    // Verify error handling
    cy.get('[data-testid="network-error-message"]').should('be.visible');
    cy.get('[data-testid="retry-btn"]').should('be.visible');
    
    // Test retry functionality
    cy.intercept('POST', '/api/v1/applications', { fixture: 'application-response.json' }).as('retrySuccess');
    cy.get('[data-testid="retry-btn"]').click();
    
    cy.wait('@retrySuccess');
    cy.url().should('include', '/file-upload');
  });

  // Helper function to fill personal information
  function fillPersonalInfo() {
    cy.get('[data-testid="first-name-input"]').type('John');
    cy.get('[data-testid="last-name-input"]').type('Doe');
    cy.get('[data-testid="email-input"]').type('john.doe@example.com');
    cy.get('[data-testid="phone-input"]').type('+1234567890');
    cy.get('[data-testid="address-street-input"]').type('123 Main St');
    cy.get('[data-testid="address-city-input"]').type('Anytown');
    cy.get('[data-testid="address-state-input"]').type('CA');
    cy.get('[data-testid="address-zip-input"]').type('12345');
    cy.get('[data-testid="address-country-select"]').select('USA');
    cy.get('[data-testid="date-of-birth-input"]').type('1990-01-01');
    cy.get('[data-testid="insurance-type-select"]').select('health');
  }
});

describe('Admin Dashboard Journey', () => {
  beforeEach(() => {
    cy.task('resetDatabase');
    cy.task('seedTestData');
  });

  it('should allow admin to view application statistics', () => {
    cy.visit('/admin');
    
    // Verify admin dashboard loads
    cy.get('[data-testid="admin-dashboard"]').should('be.visible');
    
    // Check statistics cards
    cy.get('[data-testid="total-applications"]').should('contain', '10');
    cy.get('[data-testid="pending-exports"]').should('contain', '3');
    cy.get('[data-testid="success-rate"]').should('contain', '95%');
    
    // Test application list
    cy.get('[data-testid="applications-table"]').should('be.visible');
    cy.get('[data-testid="application-row"]').should('have.length.at.least', 1);
    
    // Test filtering
    cy.get('[data-testid="status-filter"]').select('exported');
    cy.get('[data-testid="application-row"]').each($row => {
      cy.wrap($row).find('[data-testid="status-cell"]').should('contain', 'Exported');
    });
    
    // Test search
    cy.get('[data-testid="search-input"]').type('john.doe@example.com');
    cy.get('[data-testid="application-row"]').should('have.length', 1);
    cy.get('[data-testid="application-row"]').should('contain', 'john.doe@example.com');
  });

  it('should display audit logs correctly', () => {
    cy.visit('/admin/audit-logs');
    
    // Verify audit logs page
    cy.get('[data-testid="audit-logs-table"]').should('be.visible');
    cy.get('[data-testid="audit-log-row"]').should('have.length.at.least', 1);
    
    // Test log filtering by action
    cy.get('[data-testid="action-filter"]').select('application_created');
    cy.get('[data-testid="audit-log-row"]').each($row => {
      cy.wrap($row).find('[data-testid="action-cell"]').should('contain', 'application_created');
    });
    
    // Test date range filtering
    cy.get('[data-testid="date-from-input"]').type('2024-01-01');
    cy.get('[data-testid="date-to-input"]').type('2024-12-31');
    cy.get('[data-testid="apply-filter-btn"]').click();
    
    // Verify filtered results
    cy.get('[data-testid="audit-log-row"]').should('exist');
  });
});