const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    coverageProvider: 'v8',
    collectCoverage: true,
    collectCoverageFrom: [
        "app/**/*.{js,jsx,ts,tsx}",
        "components/**/*.{js,jsx,ts,tsx}",
        "data/**/*.{js,jsx,ts,tsx}",
        "providers/**/*.{js,jsx,ts,tsx}",
        "!**/node_modules/**",
        "!**/.next/**",
        "!**/app/globals.css.js",
    ],
    coveragePathIgnorePatterns: [
        "<rootDir>/app/globals.css",
    ],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
};

module.exports = createJestConfig(customJestConfig);