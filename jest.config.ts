const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testEnvironment: 'jest-environment-jsdom',
    coverageProvider: 'v8',
    collectCoverage: true,
    verbose: true,
    silent: false,
    collectCoverageFrom: [
        'app/**/*.{js,jsx,ts,tsx}',
        'components/**/*.{js,jsx,ts,tsx}',
        'data/**/*.{js,jsx,ts,tsx}',
        'providers/**/*.{js,jsx,ts,tsx}',
        'hooks/**/*.{js,jsx,ts,tsx}',
        'utils/errors/**/*.{js,jsx,ts,tsx}',
        'utils/db/safeSupabaseQuery.ts',
        'utils/security/**/*.{js,jsx,ts,tsx}',
        '!**/node_modules/**',
        '!**/.next/**',
        '!**/app/globals.css.js',
        '!**/app/layout.tsx',
    ],
    coveragePathIgnorePatterns: ['<rootDir>/app/globals.css'],
    coverageThreshold: {
        global: {
            branches: 99,
            functions: 95,
            lines: 90,
            statements: 90,
        },
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
};

module.exports = createJestConfig(customJestConfig);
