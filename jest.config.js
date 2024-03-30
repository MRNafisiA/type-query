/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': ['ts-jest']
    },
    coveragePathIgnorePatterns: ['./tests/__init__.ts'],
    setupFilesAfterEnv: ['<rootDir>/tests/__init__.ts']
};
