describe('Visual Regression Tests', () => {
  const devices = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1200, height: 800 },
  ];

  devices.forEach(({ name, width, height }) => {
    describe(`${name} viewport`, () => {
      beforeEach(() => {
        cy.viewport(width, height);
      });

      it('should match homepage layout', () => {
        cy.visit('/');
        cy.contains('FormVault').should('be.visible');
        
        // Wait for any animations to complete
        cy.wait(500);
        
        // Take screenshot for visual comparison
        cy.screenshot(`homepage-${name}`, {
          capture: 'viewport',
          clip: { x: 0, y: 0, width, height }
        });
      });

      it('should match personal info form layout', () => {
        cy.visit('/personal-info');
        cy.contains('Personal Information').should('be.visible');
        
        // Wait for form to fully render
        cy.wait(500);
        
        cy.screenshot(`personal-info-${name}`, {
          capture: 'viewport',
          clip: { x: 0, y: 0, width, height }
        });
      });

      it('should match file upload layout', () => {
        cy.visit('/file-upload');
        cy.contains('Upload Documents').should('be.visible');
        
        // Wait for upload interface to render
        cy.wait(500);
        
        cy.screenshot(`file-upload-${name}`, {
          capture: 'viewport',
          clip: { x: 0, y: 0, width, height }
        });
      });

      it('should match form validation error states', () => {
        cy.visit('/personal-info');
        
        // Trigger validation errors
        cy.contains('Next').click();
        
        // Wait for errors to appear
        cy.contains('First name is required').should('be.visible');
        cy.wait(300);
        
        cy.screenshot(`form-errors-${name}`, {
          capture: 'viewport',
          clip: { x: 0, y: 0, width, height }
        });
      });

      it('should match language selector dropdown', () => {
        cy.visit('/');
        
        // Open language selector
        cy.get('[aria-label="select language"]').click();
        cy.contains('English').should('be.visible');
        
        cy.screenshot(`language-selector-${name}`, {
          capture: 'viewport',
          clip: { x: 0, y: 0, width, height }
        });
      });

      it('should match navigation stepper states', () => {
        cy.visit('/personal-info');
        
        // Wait for stepper to render
        cy.wait(500);
        
        cy.screenshot(`navigation-stepper-${name}`, {
          capture: 'viewport',
          clip: { x: 0, y: 0, width, height }
        });
      });

      it('should match error boundary display', () => {
        // This would require a way to trigger an error
        // For now, we'll test the 404 page as an error state
        cy.visit('/non-existent-page');
        cy.contains('404').should('be.visible');
        
        cy.wait(500);
        
        cy.screenshot(`error-page-${name}`, {
          capture: 'viewport',
          clip: { x: 0, y: 0, width, height }
        });
      });

      if (name === 'mobile') {
        it('should match mobile-specific layouts', () => {
          cy.visit('/personal-info');
          
          // Test mobile form layout
          cy.get('input[name="firstName"]').should('be.visible');
          
          // Scroll to see more of the form
          cy.scrollTo('bottom');
          cy.wait(300);
          
          cy.screenshot(`mobile-form-bottom-${name}`, {
            capture: 'viewport',
            clip: { x: 0, y: 0, width, height }
          });
        });

        it('should match mobile navigation header', () => {
          cy.visit('/');
          
          // Focus on header area
          cy.get('header').should('be.visible');
          
          cy.screenshot(`mobile-header-${name}`, {
            capture: 'viewport',
            clip: { x: 0, y: 0, width, 200 }
          });
        });
      }

      if (name === 'tablet') {
        it('should match tablet-specific layouts', () => {
          cy.visit('/personal-info');
          
          // Test tablet form layout
          cy.contains('Personal Information').should('be.visible');
          
          cy.screenshot(`tablet-form-layout-${name}`, {
            capture: 'viewport',
            clip: { x: 0, y: 0, width, height }
          });
        });
      }

      if (name === 'desktop') {
        it('should match desktop full layout', () => {
          cy.visit('/');
          
          // Test full desktop layout
          cy.contains('FormVault').should('be.visible');
          
          cy.screenshot(`desktop-full-layout-${name}`, {
            capture: 'viewport',
            clip: { x: 0, y: 0, width, height }
          });
        });
      }
    });
  });

  describe('Component-specific visual tests', () => {
    it('should test file upload component across devices', () => {
      devices.forEach(({ name, width, height }) => {
        cy.viewport(width, height);
        cy.visit('/file-upload');
        
        // Focus on file upload component
        cy.contains('Student ID').should('be.visible');
        cy.contains('Passport').should('be.visible');
        
        cy.wait(500);
        
        cy.screenshot(`file-upload-component-${name}`, {
          capture: 'viewport'
        });
      });
    });

    it('should test form field layouts across devices', () => {
      devices.forEach(({ name, width, height }) => {
        cy.viewport(width, height);
        cy.visit('/personal-info');
        
        // Fill some fields to show different states
        cy.get('input[name="firstName"]').type('John');
        cy.get('input[name="lastName"]').type('Doe');
        
        // Trigger an error on email field
        cy.get('input[name="email"]').type('invalid-email');
        cy.get('input[name="firstName"]').click(); // Blur email field
        
        cy.wait(300);
        
        cy.screenshot(`form-fields-states-${name}`, {
          capture: 'viewport'
        });
      });
    });

    it('should test button layouts and states', () => {
      devices.forEach(({ name, width, height }) => {
        cy.viewport(width, height);
        cy.visit('/personal-info');
        
        // Scroll to buttons
        cy.scrollTo('bottom');
        
        // Focus on button area
        cy.contains('Next').should('be.visible');
        
        cy.wait(300);
        
        cy.screenshot(`button-layout-${name}`, {
          capture: 'viewport',
          clip: { x: 0, y: height - 200, width, 200 }
        });
      });
    });
  });

  describe('Responsive breakpoint tests', () => {
    const breakpoints = [
      { name: 'xs-sm', width: 599 },
      { name: 'sm-md', width: 600 },
      { name: 'md-lg', width: 900 },
      { name: 'lg-xl', width: 1200 },
    ];

    breakpoints.forEach(({ name, width }) => {
      it(`should test layout at ${name} breakpoint (${width}px)`, () => {
        cy.viewport(width, 800);
        cy.visit('/personal-info');
        
        cy.contains('Personal Information').should('be.visible');
        cy.wait(500);
        
        cy.screenshot(`breakpoint-${name}-${width}px`, {
          capture: 'viewport'
        });
      });
    });
  });

  describe('Dark mode visual tests (if implemented)', () => {
    // This would test dark mode if it was implemented
    // For now, we'll skip this section
    it.skip('should test dark mode layouts', () => {
      // Implementation would go here
    });
  });

  describe('Animation and transition tests', () => {
    it('should capture loading states', () => {
      cy.visit('/personal-info');
      
      // Fill form quickly to potentially catch loading state
      cy.get('input[name="firstName"]').type('John');
      cy.get('input[name="lastName"]').type('Doe');
      cy.get('input[name="email"]').type('john@example.com');
      
      // Try to capture any loading/transition states
      cy.screenshot('form-interaction-state', {
        capture: 'viewport'
      });
    });

    it('should test hover states on desktop', () => {
      cy.viewport(1200, 800);
      cy.visit('/');
      
      // Hover over get started button
      cy.contains('Get Started').trigger('mouseover');
      cy.wait(200);
      
      cy.screenshot('button-hover-state-desktop', {
        capture: 'viewport'
      });
    });
  });
});