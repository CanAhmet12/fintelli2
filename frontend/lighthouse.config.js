module.exports = {
    ci: {
        collect: {
            startServerCommand: 'npm run start',
            url: [
                'http://localhost:3000/',
                'http://localhost:3000/chat'
            ],
            numberOfRuns: 3
        },
        assert: {
            assertions: {
                'categories:performance': ['error', { minScore: 0.9 }],
                'categories:accessibility': ['error', { minScore: 0.9 }],
                'categories:best-practices': ['error', { minScore: 0.9 }],
                'categories:seo': ['error', { minScore: 0.9 }],
                'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
                'interactive': ['error', { maxNumericValue: 3500 }],
                'largest-contentful-paint': ['error', { maxNumericValue: 2500 }]
            }
        },
        upload: {
            target: 'temporary-public-storage'
        }
    }
}; 