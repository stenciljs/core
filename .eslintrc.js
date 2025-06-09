module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jsdoc', 'jest', 'simple-import-sort', 'wdio'],
  extends: [
    'plugin:jest/recommended',
    // including prettier here ensures that we don't set any rules which will conflict
    // with Prettier's formatting. Keep it last in the list so that nothing else messes
    // with it!
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        // TODO(STENCIL-452): Investigate using eslint-plugin-react to remove the need for varsIgnorePattern
        varsIgnorePattern: '^(h|Fragment)$',
      },
    ],
    /**
     * Configuration for Jest rules can be found here:
     * https://github.com/jest-community/eslint-plugin-jest/tree/main/docs/rules
     */
    'jest/expect-expect': [
      'error',
      {
        // we set this to `expect*` so that any function whose name starts with expect will be counted
        // as an assertion function, allowing us to use functions to DRY up test suites.
        assertFunctionNames: ['expect*'],
      },
    ],
    // we...have a number of things disabled :)
    // TODO(STENCIL-488): Turn this rule back on once there are no violations of it remaining
    'jest/no-disabled-tests': ['off'],
    // we use this in enough places that we don't want to do per-line disables
    'jest/no-conditional-expect': ['off'],
    // this enforces that Jest hooks (e.g. `beforeEach`) are declared in test files in their execution order
    // see here for details: https://github.com/jest-community/eslint-plugin-jest/blob/main/docs/rules/prefer-hooks-in-order.md
    'jest/prefer-hooks-in-order': ['warn'],
    // this enforces that Jest hooks (e.g. `beforeEach`) are declared at the top of `describe` blocks
    'jest/prefer-hooks-on-top': ['warn'],
    /**
     * Configuration for the JSDoc plugin rules can be found at:
     * https://github.com/gajus/eslint-plugin-jsdoc
     */
    // validates that the name immediately following `@param` matches the parameter name in the function signature
    // this works in conjunction with "jsdoc/require-param"
    'jsdoc/check-param-names': [
      'error',
      {
        // if `checkStructured` is `true`, it asks that the JSDoc describe the fields being destructured.
        // turn this off to not leak function internals/discourage describing them
        checkDestructured: false,
      },
    ],
    // require that jsdoc attached to a method/function require one `@param` per parameter
    'jsdoc/require-param': [
      'error',
      {
        // if `checkStructured` is `true`, it asks that the JSDoc describe the fields being destructured.
        // turn this off to not leak function internals/discourage describing them
        checkDestructured: false,
        // always check setters as they should require a parameter (by definition)
        checkSetters: true,
      },
    ],
    'jsdoc/require-param-description': ['error'],
    // rely on TypeScript types to be the source of truth, minimize verbosity in comments
    'jsdoc/require-param-type': ['off'],
    'jsdoc/require-returns': ['error'],
    'jsdoc/require-returns-check': ['error'],
    'jsdoc/require-returns-description': ['error'],
    // rely on TypeScript types to be the source of truth, minimize verbosity in comments
    'jsdoc/require-returns-type': ['off'],
    'no-cond-assign': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'simple-import-sort/exports': 'error',
    'simple-import-sort/imports': 'error',
  },
  overrides: [
    {
      // the stencil entry point still uses `var`, ignore errors related to it
      files: 'bin/**',
      rules: {
        'no-var': 'off',
      },
    },
    {
      // we don't want to use jest-related lint rules in the wdio tests
      files: 'test/wdio/**/*.tsx',
      rules: {
        'jest/expect-expect': 'off',
        'wdio/await-expect': 'error',
      },
    },
  ],
  // inform ESLint about the global variables defined in a Jest context
  // see https://github.com/jest-community/eslint-plugin-jest/#usage
  env: {
    'jest/globals': true,
  },
};
