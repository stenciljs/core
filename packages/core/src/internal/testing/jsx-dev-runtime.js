// Export automatic JSX development runtime for testing
// This file allows TypeScript's automatic JSX transform to work in tests
// when using jsxImportSource: "@stencil/core/internal/testing" with jsx: "react-jsxdev"
const testing = require('./index.js');
module.exports = {
  jsxDEV: testing.jsxDEV,
  Fragment: testing.Fragment,
};
