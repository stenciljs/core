const { getCreateJestTestRunner } = require('./index.js');
const createTestRunner = getCreateJestTestRunner();
module.exports = createTestRunner();
