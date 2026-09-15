/**
 * Compiler-backed testing utilities. Split out from `@stencil/core/testing` because these
 * pull in the full Stencil compiler (and, transitively, `typescript`) - unlike `newSpecPage`,
 * which is compiler-free.
 *
 * Internal only - not a published subpath (no `./testing/compiler` entry in package.json
 * `exports`). Import via a relative path from `_test_` files. Component authors writing
 * spec tests want `@stencil/core/testing`.
 */
export { mockBuildCtx, mockCompilerCtx } from './mocks';
export {
  createTestCompiler,
  prepareTestCompiler,
  type PreparedTestCompiler,
} from './create-test-compiler';
