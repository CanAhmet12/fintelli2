Cypress.Commands.add('login', (email, password) => {
    cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
            email,
            password
        }
    }).then((response) => {
        window.localStorage.setItem('token', response.body.token);
        window.localStorage.setItem('userId', response.body.user.id);
    });
});

Cypress.Commands.add('logout', () => {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('userId');
}); 