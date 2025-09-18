/**
 * Accessibility tests using axe-core to ensure WCAG compliance.
 */

describe('Accessibility Tests', () => {
  beforeEach(() => {
    // Inject axe-core into the page
    cy.injectAxe();
  });

  it('should have no accessibility violations on homepage', () => {
    cy.visit('/');
    
    // Check for accessibility violations
    cy.checkA11y();
    
    // Test keyboard navigation
    cy.get('body').tab();
    cy.focused().should('have.attr', 'data-testid', 'start-application-btn');
    
    // Test screen reader announcements
    cy.get('[data-testid="main-heading"]')
      .should('have.attr', 'role', 'heading')
      .and('have.attr', 'aria-level', '1');
  });

  it('should have no accessibility violations on personal info form', () => {
    cy.visit('/personal-info');
    cy.checkA11y();
    
    // Test form accessibility
    cy.get('[data-testid="first-name-input"]')
      .should('have.attr', 'aria-label')
      .and('have.attr', 'aria-required', 'true');
    
    cy.get('[data-testid="first-name-error"]')
      .should('have.attr', 'role', 'alert')
      .and('have.attr', 'aria-live', 'polite');
    
    // Test keyboard navigation through form
    cy.get('[data-testid="first-name-input"]').focus();
    cy.focused().tab();
    cy.focused().should('have.attr', 'data-testid', 'last-name-input');
    
    // Test form validation accessibility
    cy.get('[data-testid="next-step-btn"]').click();
    cy.get('[data-testid="first-name-error"]').should('be.visible');
    cy.checkA11y();
  });

  it('should have no accessibility violations on file upload page', () => {
    // Complete personal info first
    cy.visit('/personal-info');
    cy.fillPersonalInfoForm();
    cy.get('[data-testid="next-step-btn"]').click();
    
    cy.checkA11y();
    
    // Test file upload accessibility
    cy.get('[data-testid="student-id-upload"]')
      .should('have.attr', 'aria-label')
      .and('have.attr', 'accept');
    
    cy.get('[data-testid="file-upload-instructions"]')
      .should('have.attr', 'role', 'region')
      .and('have.attr', 'aria-labelledby');
    
    // Test drag and drop accessibility
    cy.get('[data-testid="drop-zone"]')
      .should('have.attr', 'role', 'button')
      .and('have.attr', 'tabindex', '0')
      .and('have.attr', 'aria-describedby');
  });

  it('should have no accessibility violations on review page', () => {
    cy.completeApplicationWorkflow({ skipEmailExport: true });
    
    // Navigate back to review page
    cy.visit('/review');
    cy.checkA11y();
    
    // Test review section accessibility
    cy.get('[data-testid="review-section"]')
      .should('have.attr', 'role', 'region')
      .and('have.attr', 'aria-labelledby');
    
    cy.get('[data-testid="review-personal-info"]')
      .should('have.attr', 'role', 'group')
      .and('have.attr', 'aria-labelledby');
    
    // Test edit buttons accessibility
    cy.get('[data-testid="edit-personal-info-btn"]')
      .should('have.attr', 'aria-label')
      .and('contain', 'Edit personal information');
  });

  it('should have no accessibility violations with error states', () => {
    cy.visit('/personal-info');
    
    // Trigger validation errors
    cy.get('[data-testid="email-input"]').type('invalid-email');
    cy.get('[data-testid="next-step-btn"]').click();
    
    cy.checkA11y();
    
    // Test error message accessibility
    cy.get('[data-testid="email-error"]')
      .should('have.attr', 'role', 'alert')
      .and('have.attr', 'aria-live', 'assertive');
    
    // Test error association with input
    cy.get('[data-testid="email-input"]')
      .should('have.attr', 'aria-describedby')
      .and('contain', 'email-error');
    
    // Test error styling doesn't rely only on color
    cy.get('[data-testid="email-error"]')
      .should('have.css', 'font-weight')
      .and('not.equal', 'normal');
  });

  it('should support high contrast mode', () => {
    // Enable high contrast mode simulation
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.matchMedia = cy.stub().returns({
          matches: true,
          addListener: () => {},
          removeListener: () => {}
        });
      }
    });
    
    cy.checkA11y();
    
    // Test that interactive elements are visible in high contrast
    cy.get('[data-testid="start-application-btn"]')
      .should('be.visible')
      .and('have.css', 'border-width')
      .and('not.equal', '0px');
  });

  it('should support screen reader navigation', () => {
    cy.visit('/');
    
    // Test landmark navigation
    cy.get('main').should('have.attr', 'role', 'main');
    cy.get('nav').should('have.attr', 'role', 'navigation');
    cy.get('header').should('have.attr', 'role', 'banner');
    cy.get('footer').should('have.attr', 'role', 'contentinfo');
    
    // Test heading hierarchy
    cy.get('h1').should('exist');
    cy.get('h2').each(($h2, index) => {
      // Ensure h2s come after h1
      cy.get('h1').then($h1 => {
        expect($h2.index()).to.be.greaterThan($h1.index());
      });
    });
    
    // Test skip links
    cy.get('[data-testid="skip-to-main"]')
      .should('exist')
      .and('have.attr', 'href', '#main-content');
  });

  it('should handle focus management correctly', () => {
    cy.visit('/');
    
    // Test initial focus
    cy.get('[data-testid="start-application-btn"]').click();
    
    // Focus should move to first form field
    cy.focused().should('have.attr', 'data-testid', 'first-name-input');
    
    // Test modal focus management
    cy.get('[data-testid="help-btn"]').click();
    cy.get('[data-testid="help-modal"]').should('be.visible');
    
    // Focus should be trapped in modal
    cy.focused().should('be.within', '[data-testid="help-modal"]');
    
    // Test focus return after modal close
    cy.get('[data-testid="close-modal-btn"]').click();
    cy.focused().should('have.attr', 'data-testid', 'help-btn');
  });

  it('should support keyboard-only navigation', () => {
    cy.visit('/');
    
    // Navigate entire form using only keyboard
    cy.get('body').tab(); // Focus start button
    cy.focused().type('{enter}'); // Activate start button
    
    // Fill form using keyboard only
    cy.focused().type('John');
    cy.focused().tab().type('Doe');
    cy.focused().tab().type('john.doe@example.com');
    cy.focused().tab().type('+1234567890');
    
    // Continue through all form fields
    cy.focused().tab().type('123 Main St');
    cy.focused().tab().type('Anytown');
    cy.focused().tab().type('CA');
    cy.focused().tab().type('12345');
    cy.focused().tab().select('USA');
    cy.focused().tab().type('1990-01-01');
    cy.focused().tab().select('health');
    
    // Submit using keyboard
    cy.focused().tab().type('{enter}');
    
    // Should navigate to next page
    cy.url().should('include', '/file-upload');
  });

  it('should provide proper ARIA labels and descriptions', () => {
    cy.visit('/personal-info');
    
    // Test form field labels
    cy.get('[data-testid="first-name-input"]')
      .should('have.attr', 'aria-labelledby')
      .then(labelId => {
        cy.get(`#${labelId}`).should('contain', 'First Name');
      });
    
    // Test help text associations
    cy.get('[data-testid="phone-input"]')
      .should('have.attr', 'aria-describedby')
      .then(descId => {
        cy.get(`#${descId}`).should('contain', 'Include country code');
      });
    
    // Test required field indicators
    cy.get('[data-testid="email-input"]')
      .should('have.attr', 'aria-required', 'true');
    
    // Test fieldset and legend for grouped fields
    cy.get('[data-testid="address-fieldset"]')
      .should('have.prop', 'tagName', 'FIELDSET')
      .find('legend')
      .should('contain', 'Address Information');
  });

  it('should handle dynamic content accessibility', () => {
    cy.visit('/file-upload');
    
    // Test live region for upload progress
    cy.get('[data-testid="upload-status"]')
      .should('have.attr', 'aria-live', 'polite')
      .and('have.attr', 'aria-atomic', 'true');
    
    // Upload file and test status updates
    cy.uploadTestFile('student_id');
    
    cy.get('[data-testid="upload-status"]')
      .should('contain', 'Upload completed successfully');
    
    // Test error announcements
    cy.fixture('invalid-file.txt').then(fileContent => {
      cy.get('[data-testid="passport-upload"]').selectFile({
        contents: fileContent,
        fileName: 'invalid.txt',
        mimeType: 'text/plain'
      });
    });
    
    cy.get('[data-testid="upload-error"]')
      .should('have.attr', 'role', 'alert')
      .and('be.visible');
  });

  it('should support reduced motion preferences', () => {
    // Test with reduced motion preference
    cy.visit('/', {
      onBeforeLoad: (win) => {
        Object.defineProperty(win, 'matchMedia', {
          writable: true,
          value: cy.stub().returns({
            matches: true, // prefers-reduced-motion: reduce
            addListener: () => {},
            removeListener: () => {}
          })
        });
      }
    });
    
    // Verify animations are disabled or reduced
    cy.get('[data-testid="progress-indicator"]')
      .should('have.css', 'animation-duration', '0s');
    
    cy.get('[data-testid="loading-spinner"]')
      .should('not.have.class', 'animate-spin');
  });
});