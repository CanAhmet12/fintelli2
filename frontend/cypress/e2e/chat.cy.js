describe('AI Chat', () => {
    beforeEach(() => {
        cy.login('test@example.com', 'password123');
        cy.visit('/dashboard');
    });

    it('should send and receive messages', () => {
        const message = 'Merhaba, nasıl yardımcı olabilirsiniz?';
        
        cy.get('input[name="message"]').type(message);
        cy.get('button[type="submit"]').click();

        // Kullanıcı mesajının görüntülenmesini kontrol et
        cy.contains(message).should('be.visible');
        
        // AI yanıtının gelmesini bekle
        cy.get('[data-testid="typing-indicator"]').should('be.visible');
        cy.get('[data-testid="typing-indicator"]').should('not.exist');
        
        // AI yanıtının görüntülenmesini kontrol et
        cy.get('.MuiListItem-root').should('have.length.at.least', 2);
    });

    it('should handle validation', () => {
        // Boş mesaj
        cy.get('button[type="submit"]').should('be.disabled');

        // Çok kısa mesaj
        cy.get('input[name="message"]').type('a');
        cy.get('input[name="message"]').blur();
        cy.contains('Mesaj çok kısa').should('be.visible');

        // Çok uzun mesaj
        const longMessage = 'a'.repeat(501);
        cy.get('input[name="message"]').clear().type(longMessage);
        cy.contains('Mesaj çok uzun').should('be.visible');
    });

    it('should handle errors gracefully', () => {
        // API hatası simülasyonu
        cy.intercept('POST', '/api/chat/*', {
            statusCode: 500,
            body: { error: 'Internal Server Error' }
        });

        cy.get('input[name="message"]').type('Test message');
        cy.get('button[type="submit"]').click();

        cy.contains('Üzgünüm, bir hata oluştu').should('be.visible');
    });

    it('should persist messages', () => {
        const message = 'Test message for persistence';
        
        cy.get('input[name="message"]').type(message);
        cy.get('button[type="submit"]').click();

        // Sayfayı yenile
        cy.reload();

        // Mesajın hala görünür olduğunu kontrol et
        cy.contains(message).should('be.visible');
    });
}); 