const path = require('path');
const base = require('../../jest.config.js');

const rootDir = path.resolve(__dirname, '../..');
const modulePathIgnorePatterns = (base.modulePathIgnorePatterns || []).filter((p) => !/\<rootDir\>\/test\//.test(p));

module.exports = {
  rootDir,
  testEnvironment: base.testEnvironment || 'jsdom',
  setupFilesAfterEnv: base.setupFilesAfterEnv || ['<rootDir>/testing/jest-setuptestframework.js'],
  transform: base.transform,
  moduleNameMapper: base.moduleNameMapper,
  moduleFileExtensions: base.moduleFileExtensions,
  testPathIgnorePatterns: base.testPathIgnorePatterns || [],
  modulePathIgnorePatterns,
  testRegex: '/test/bundler/.*\\.spec\\.ts$',
};
