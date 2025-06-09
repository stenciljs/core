const { getCreateJestPuppeteerEnvironment } = require('./index.js');
const createJestPuppeteerEnvironment = getCreateJestPuppeteerEnvironment();
module.exports = createJestPuppeteerEnvironment();
