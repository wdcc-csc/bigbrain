describe('Admin Complete Flow Test', () => {
    beforeEach(() => {
      cy.visit('/login');
    });
  
    it('Complete admin workflow', () => {
      cy.contains('No account? Register now').click();
      cy.get('#email').type('test@example.com');
      cy.get('#name').type('Test User');
      cy.get('#password').type('password123');
      cy.get('#confirmPassword').type('password123');
      cy.contains('button', 'Register').click();
  
      cy.url().should('include', '/dashboard');
      cy.contains('My Games').should('be.visible');
  
      cy.contains('Create New Game').click();
      cy.get('#name').type('Test Game');
      cy.contains('button', 'Create').click();
  
      cy.contains('Test Game').should('be.visible');
  
      cy.contains('Test Game').click();
      cy.url().should('include', '/game/');
  
      cy.contains('Add Question').click();
      cy.url().should('include', '/question/');
  
      cy.get('input[value="New Question"]').clear().type('First Question');
      cy.get('#question-type').click();
      cy.contains('li', 'Single Choice').click();
      cy.get('input[type="number"]').first().clear().type('30');
      cy.get('input[type="number"]').eq(1).clear().type('10');
  
      cy.contains('Answer 1').parent().find('input[type="text"]').clear().type('Correct Answer');
      cy.contains('Answer 2').parent().find('input[type="text"]').clear().type('Wrong Answer');
  
      cy.contains('Save Question').click();
  
      cy.contains('Back to Game Edit').click();
      cy.url().should('include', '/game/');
      cy.contains('First Question').should('be.visible');
  
      cy.contains('Back to Dashboard').click();
      cy.url().should('include', '/dashboard');
  
      cy.contains('Test Game').parent().parent().contains('Start Game').click();
      cy.contains('Game session started').should('be.visible');
      cy.contains('Copy Link').click();
      cy.contains('Close').click();
  
      cy.contains('Test Game').parent().parent().contains('End Session').click();
      
      cy.contains('Test Game').parent().parent().contains('Delete Game').click();
      cy.contains('Test Game').should('not.exist');
  
      cy.get('[aria-label="account of current user"]').click();
      cy.contains('Logout').click();
  
      cy.url().should('include', '/login');
  
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('password123');
      cy.contains('button', 'Login').click();
  
      cy.url().should('include', '/dashboard');
    });
  }); 