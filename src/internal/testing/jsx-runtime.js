// Export automatic JSX runtime for testing
// This file allows TypeScript's automatic JSX transform to work in tests
// when using jsxImportSource: "@stencil/core/internal/testing"
const testing = require('./index.js');
module.exports = {
  jsx: testing.jsx,
  jsxs: testing.jsxs,
  Fragment: testing.Fragment,
};
