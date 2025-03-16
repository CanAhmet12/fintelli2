describe('Login Flow', () => {
    beforeEach(() => {
        cy.visit('/login');
    });

    it('should show validation errors', () => {
        cy.get('button[type="submit"]').click();
        cy.contains('E-posta adresi gereklidir').should('be.visible');
        cy.contains('Şifre gereklidir').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
        cy.get('input[name="email"]').type('invalid@email.com');
        cy.get('input[name="password"]').type('wrongpass{enter}');
        cy.contains('Giriş başarısız').should('be.visible');
    });

    it('should login successfully', () => {
        cy.get('input[name="email"]').type('test@example.com');
        cy.get('input[name="password"]').type('password123{enter}');
        cy.url().should('include', '/dashboard');
        cy.contains('Portföy Performansı').should('be.visible');
    });

    it('should maintain login state', () => {
        cy.login('test@example.com', 'password123'); // Custom command
        cy.visit('/dashboard');
        cy.url().should('include', '/dashboard');
    });

    it('should logout successfully', () => {
        cy.login('test@example.com', 'password123');
        cy.visit('/dashboard');
        cy.get('[data-testid="logout-button"]').click();
        cy.url().should('include', '/login');
    });
}); 