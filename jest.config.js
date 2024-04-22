module.exports = {
  moduleNameMapper: {
    '@app-data': '<rootDir>/internal/app-data/index.cjs',
    '@app-globals': '<rootDir>/internal/app-globals/index.cjs',
    '@platform': '<rootDir>/internal/testing/index.js',
    '@runtime': '<rootDir>/internal/testing/index.js',
    '@stencil/core/cli': '<rootDir>/cli/index.cjs',
    '@stencil/core/compiler': '<rootDir>/compiler/stencil.js',
    '@stencil/core/mock-doc': '<rootDir>/mock-doc/index.cjs',
    '@stencil/core/testing': '<rootDir>/testing/index.js',
    '@sys-api-node': '<rootDir>/sys/node/index.js',
    '@utils': '<rootDir>/src/utils',
    '^typescript$': '<rootDir>/scripts/build/typescript-modified-for-jest.js',
    '^@stencil/core/internal/app-data$': '<rootDir>/internal/app-data/index.cjs',
    '^@stencil/core/internal/testing$': '<rootDir>/internal/testing/index.js',
  },
  coverageDirectory: './coverage/',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coveragePathIgnorePatterns: ['^.*\\.stub\\.tsx?$'],
  collectCoverageFrom: [
    '<rootDir>/scripts/**/*.{js,jsx,ts,tsx}',
    '!<rootDir>/scripts/build/**/*.{js,jsx,ts,tsx}',
    '!<rootDir>/scripts/bundles/helpers/compiler-cjs-intro.js',
    '!<rootDir>/scripts/bundles/helpers/compiler-cjs-outro.js',
    '<rootDir>/src/app-data/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/app-globals/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/cli/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/compiler/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/declarations/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/dev-server/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/hydrate/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/internal/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/mock-doc/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/runtime/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/screenshot/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/sys/node/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/testing/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/utils/**/*.{js,jsx,ts,tsx}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'mjs', 'jsx', 'json', 'd.ts'],
  modulePathIgnorePatterns: ['/bin', '/www'],
  setupFilesAfterEnv: ['<rootDir>/testing/jest-setuptestframework.js'],
  testEnvironment: '<rootDir>/testing/jest-environment.js',
  testPathIgnorePatterns: [
    '<rootDir>/.cache/',
    '<rootDir>/.github/',
    '<rootDir>/.stencil/',
    '<rootDir>/.vscode/',
    '<rootDir>/bin/',
    '<rootDir>/build/',
    '<rootDir>/cli/',
    '<rootDir>/compiler/',
    '<rootDir>/dev-server/',
    '<rootDir>/dist/',
    '<rootDir>/internal/',
    '<rootDir>/mock-doc/',
    '<rootDir>/node_modules/',
    '<rootDir>/screenshot/',
    '<rootDir>/sys/',
    '<rootDir>/test/',
    '<rootDir>/testing/',
  ],
  testRegex: '/(src|scripts)/.*\\.spec\\.(ts|tsx|js)$',
  // TODO(STENCIL-307): Move away from Jasmine runner for internal Stencil tests as a part of the (internal) Jest 28+ upgrade
  testRunner: 'jest-jasmine2',
  transform: {
    '^.+\\.(ts|tsx|jsx|css|mjs)$': '<rootDir>/testing/jest-preprocessor.js',
  },
  watchPathIgnorePatterns: ['^.+\\.d\\.ts$'],
};
