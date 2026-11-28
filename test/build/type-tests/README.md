# Stencil Type Tests

Validates that Stencil's generated JSX type definitions correctly catch prop type errors at compile time.

## How it works

1. `src/components/typed-props.tsx` defines a component with various typed props
2. `stencil build` generates `src/components.d.ts` with JSX type definitions
3. `test.spec.tsx` uses `@ts-expect-error` to verify TypeScript catches invalid prop types
4. `tsc --noEmit` validates the test file - if any `@ts-expect-error` is unused, the test fails

## Usage

```sh
# From this directory
pnpm test

# From repo root
pnpm --filter @tests/type-tests test
```

## Adding tests

1. Add props to `src/components/typed-props.tsx` (or create new components)
2. Add test cases to `test.spec.tsx` with `@ts-expect-error` for invalid usages
3. Run `pnpm test` to verify
