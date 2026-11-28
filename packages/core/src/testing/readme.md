# testing

`newSpecPage` and the mock platform it runs on - used for Stencil's own internal unit tests, and historically exposed to consumers as `@stencil/core/testing`.

## Status (v5)

Integrated testing is being removed. Consumers should use `@stencil/vitest` / `@stencil/playwright` instead of the old Jest-based `@stencil/core/testing` runner. This directory is what's left after that removal: the `newSpecPage` mock platform, still used internally (`packages/core/src/**/*.spec.ts`) and can be used combined with `@stencil/unplugin`'s `spec-page` integration, combined with vitest for easier Jest > vitest migration.

## Key Files

| File                            | Purpose                                                       |
| -------------------------------- | ---------------------------------------------------------------- |
| `spec-page.ts`                  | `newSpecPage` - renders a component against a mock DOM for unit tests |
| `mocks.ts`                      | `mockConfig`, `mockWindow`, `mockDocument`, etc.                |
| `create-test-compiler.ts`       | In-memory compiler instance for testing compiler behavior       |
| `testing-sys.ts`                | `createTestingSystem` - in-memory `CompilerSystem`               |
| `vitest-stencil-plugin.ts`      | Vitest integration entry point                                   |
| `reset-build-conditionals.ts`   | Resets `BUILD.*` flags between tests                             |
| `app-data.ts`                   | Testing-specific `BUILD` defaults (`lazyLoad`/`isTesting`/`isDev: true`) |
| `testing-logger.ts`             | `TestingLogger` - no-op/silent `Logger` implementation for tests |
| `testing-utils.ts`              | `shuffleArray`, `setupConsoleMocker`, and other spec-test helpers |
| `compiler.ts`                   | `mockBuildCtx`/`mockCompilerCtx` - internal only (not a published subpath); pulls in the full compiler, unlike `newSpecPage` which is compiler-free |
| `platform/`                     | Mock runtime platform (mirrors `client/`/`server/`) so components can render without a real DOM/browser |

## Relationship to mock-doc

`newSpecPage` renders using `@stencil/mock-doc` under the hood via `platform/testing-window.ts`, the same mock DOM used for SSR.
