// Export automatic JSX runtime (CommonJS)
// Note: This requires the client platform to be built
const client = require('../client/index.js');
module.exports = {
  jsx: client.jsx,
  jsxs: client.jsxs,
  Fragment: client.Fragment,
};
