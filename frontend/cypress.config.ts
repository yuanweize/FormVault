import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    setupNodeEvents(on, config) {
      // Database tasks for testing
      on('task', {
        resetDatabase() {
          // Reset test database to clean state
          // This would connect to test database and clear/reset data
          console.log('Resetting test database...');
          return null;
        },
        
        seedTestData() {
          // Seed database with test data
          console.log('Seeding test database...');
          return null;
        },
        
        log(message) {
          console.log(message);
          return null;
        }
      });
      
      // Environment-specific configuration
      if (config.env.environment === 'ci') {
        config.baseUrl = 'http://localhost:3001';
        config.video = false;
      }
      
      return config;
    },
  },
  
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },
  
  env: {
    // Test environment variables
    apiUrl: 'http://localhost:8000/api/v1',
    testEmail: 'test@example.com',
    adminEmail: 'admin@example.com',
  }
});