// Export automatic JSX development runtime (CommonJS)
// Note: This requires the client platform to be built
const client = require('../client/index.js');
module.exports = {
  jsxDEV: client.jsxDEV,
  Fragment: client.Fragment,
};
