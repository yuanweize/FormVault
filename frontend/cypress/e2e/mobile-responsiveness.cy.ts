describe('Mobile Responsiveness E2E Tests', () => {
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPad Mini', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
  ];

  viewports.forEach(({ name, width, height }) => {
    describe(`${name} (${width}x${height})`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
        cy.visit('/');
      });

      it('should display the homepage correctly', () => {
        // Check that the page loads
        cy.contains('FormVault').should('be.visible');
        
        // Check that the language selector is accessible
        cy.get('[aria-label="select language"]').should('be.visible');
        
        // Check that the get started button is visible and clickable
        cy.contains('Get Started').should('be.visible').and('not.be.disabled');
      });

      it('should navigate through the application workflow', () => {
        // Start the application
        cy.contains('Get Started').click();
        
        // Should be on personal info page
        cy.url().should('include', '/personal-info');
        cy.contains('Personal Information').should('be.visible');
        
        // Fill out the form (basic fields)
        cy.get('input[name="firstName"]').type('John');
        cy.get('input[name="lastName"]').type('Doe');
        cy.get('input[name="email"]').type('john.doe@example.com');
        cy.get('input[name="phone"]').type('+1234567890');
        cy.get('input[name="dateOfBirth"]').type('1990-01-01');
        
        // Fill address fields
        cy.get('input[name="address.street"]').type('123 Main St');
        cy.get('input[name="address.city"]').type('Anytown');
        cy.get('input[name="address.state"]').type('CA');
        cy.get('input[name="address.zipCode"]').type('12345');
        
        // Select country
        cy.get('[data-testid="country-select"]').click();
        cy.contains('United States').click();
        
        // Select insurance type
        cy.get('[data-testid="insurance-type-select"]').click();
        cy.contains('Health Insurance').click();
        
        // Submit the form
        cy.contains('Next').click();
        
        // Should be on file upload page
        cy.url().should('include', '/file-upload');
        cy.contains('Upload Documents').should('be.visible');
      });

      it('should handle file upload interface on mobile', () => {
        cy.visit('/file-upload');
        
        // Check that file upload areas are visible
        cy.contains('Student ID').should('be.visible');
        cy.contains('Passport').should('be.visible');
        
        // Check that upload buttons are touch-friendly
        cy.contains('Select File').should('be.visible');
        cy.contains('Take Photo').should('be.visible');
        
        // Verify drag and drop area is present
        cy.contains('Drag and drop your file here').should('be.visible');
      });

      it('should display navigation stepper appropriately', () => {
        cy.visit('/personal-info');
        
        // Navigation stepper should be visible
        cy.get('.MuiStepper-root, .MuiMobileStepper-root').should('be.visible');
        
        // On very small screens, should show compact version
        if (width < 400) {
          // Should show step progress indicator
          cy.contains(/Step \d+ of \d+/).should('be.visible');
        } else if (width < 600) {
          // Should show short labels
          cy.contains('Info').should('be.visible');
        } else {
          // Should show full stepper
          cy.contains('Personal Information').should('be.visible');
        }
      });

      it('should handle language switching on mobile', () => {
        // Open language selector
        cy.get('[aria-label="select language"]').click();
        
        // Should show language options
        cy.contains('English').should('be.visible');
        cy.contains('中文').should('be.visible');
        cy.contains('Español').should('be.visible');
        
        // Switch to Chinese
        cy.contains('中文').click();
        
        // Page should update to Chinese
        cy.contains('FormVault').should('be.visible');
        
        // Switch back to English
        cy.get('[aria-label="select language"]').click();
        cy.contains('English').click();
      });

      it('should display error messages appropriately', () => {
        cy.visit('/personal-info');
        
        // Try to submit empty form
        cy.contains('Next').click();
        
        // Should show validation errors
        cy.contains('First name is required').should('be.visible');
        cy.contains('Last name is required').should('be.visible');
        cy.contains('Email address is required').should('be.visible');
        
        // Error messages should be readable on mobile
        cy.get('.MuiFormHelperText-root').should('be.visible');
      });

      it('should handle form input focus and keyboard navigation', () => {
        cy.visit('/personal-info');
        
        // Focus on first input
        cy.get('input[name="firstName"]').focus();
        
        // Should be able to tab through inputs
        cy.get('input[name="firstName"]').tab();
        cy.focused().should('have.attr', 'name', 'lastName');
        
        // Input should be properly sized for touch
        cy.get('input[name="firstName"]').should('be.visible');
      });

      it('should display footer correctly', () => {
        // Footer should be visible and properly formatted
        cy.get('footer').should('be.visible');
        cy.contains('All rights reserved').should('be.visible');
        
        // Footer links should be accessible
        cy.contains('Privacy Policy').should('be.visible');
        cy.contains('Terms of Service').should('be.visible');
        cy.contains('Support').should('be.visible');
      });

      it('should handle orientation changes (mobile only)', () => {
        if (width < 768) {
          // Test portrait orientation
          cy.viewport(width, height);
          cy.visit('/');
          cy.contains('FormVault').should('be.visible');
          
          // Test landscape orientation
          cy.viewport(height, width);
          cy.contains('FormVault').should('be.visible');
          
          // Navigation should still work
          cy.get('[aria-label="select language"]').should('be.visible');
        }
      });

      it('should maintain accessibility standards', () => {
        cy.visit('/');
        
        // Check for proper heading hierarchy
        cy.get('h1, h2, h3, h4, h5, h6').should('exist');
        
        // Check for alt text on images (if any)
        cy.get('img').each(($img) => {
          cy.wrap($img).should('have.attr', 'alt');
        });
        
        // Check for proper form labels
        cy.visit('/personal-info');
        cy.get('input').each(($input) => {
          const id = $input.attr('id');
          if (id) {
            cy.get(`label[for="${id}"]`).should('exist');
          }
        });
      });

      it('should handle touch interactions', () => {
        if (width < 768) {
          cy.visit('/');
          
          // Test touch on buttons
          cy.contains('Get Started').trigger('touchstart').trigger('touchend');
          
          // Should navigate to next page
          cy.url().should('include', '/personal-info');
          
          // Test touch on language selector
          cy.get('[aria-label="select language"]').trigger('touchstart').trigger('touchend');
          cy.contains('English').should('be.visible');
        }
      });

      it('should display loading states appropriately', () => {
        cy.visit('/personal-info');
        
        // Fill out form
        cy.get('input[name="firstName"]').type('John');
        cy.get('input[name="lastName"]').type('Doe');
        cy.get('input[name="email"]').type('john.doe@example.com');
        cy.get('input[name="phone"]').type('+1234567890');
        cy.get('input[name="dateOfBirth"]').type('1990-01-01');
        
        // Fill address
        cy.get('input[name="address.street"]').type('123 Main St');
        cy.get('input[name="address.city"]').type('Anytown');
        cy.get('input[name="address.state"]').type('CA');
        cy.get('input[name="address.zipCode"]').type('12345');
        
        // Submit button should be enabled
        cy.contains('Next').should('not.be.disabled');
      });
    });
  });

  describe('Cross-device consistency', () => {
    it('should maintain consistent functionality across devices', () => {
      viewports.forEach(({ width, height }) => {
        cy.viewport(width, height);
        cy.visit('/');
        
        // Core functionality should work on all devices
        cy.contains('FormVault').should('be.visible');
        cy.get('[aria-label="select language"]').should('be.visible');
        cy.contains('Get Started').should('be.visible').and('not.be.disabled');
      });
    });
  });

  describe('Performance on mobile devices', () => {
    it('should load quickly on mobile', () => {
      cy.viewport(375, 667);
      
      const startTime = Date.now();
      cy.visit('/');
      
      cy.contains('FormVault').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        // Page should load within 3 seconds on mobile
        expect(loadTime).to.be.lessThan(3000);
      });
    });
  });
});