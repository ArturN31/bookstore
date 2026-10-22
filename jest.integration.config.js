const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

module.exports = createJestConfig({
    testEnvironment: 'node',
    setupFilesAfterEnv: [],
    collectCoverage: false,
    testMatch: ['<rootDir>/__tests__/integration/**/*.test.ts'],
});
