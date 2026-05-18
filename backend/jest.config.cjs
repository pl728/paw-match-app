module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  moduleNameMapper: {
    '^@google-cloud/storage$': '<rootDir>/tests/mocks/google-cloud-storage.js',
  },
};
