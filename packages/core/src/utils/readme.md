# utils

Shared utility functions used across the compiler and runtime.

## Overview

This directory contains helper functions, constants, and utilities that are used by multiple parts of Stencil. It's imported via the `@utils` alias.

## Key Files

| File | Purpose |
|------|---------|
| `helpers.ts` | General-purpose utilities (type guards, string manipulation) |
| `constants.ts` | Shared constants and magic strings |
| `result.ts` | `Result<T, E>` type for error handling |
| `validation.ts` | Input validation helpers |
| `path.ts` | Cross-platform path utilities |
| `shadow-css.ts` | CSS scoping for Shadow DOM emulation |
| `sourcemaps.ts` | Source map manipulation |

## Categories

### Type Utilities
- Type guards (`isString`, `isFunction`, etc.)
- Type transformations

### String Utilities
- `toDashCase()`, `toCamelCase()` - case conversion
- `createJsVarName()` - safe JS identifier creation

### Path Utilities
- Normalization across platforms
- Relative path computation

### Result Type
Functional error handling without exceptions:

```ts
import { result } from '@utils';

const res = result.ok(value);  // Success
const err = result.err(error); // Failure
```

### Build Helpers
- `format-component-runtime-meta.ts` - Serialize component metadata
- `output-target.ts` - Output target utilities

## Usage

```ts
import { isString, normalizePath } from '@utils';
```

Note: Some utilities are compiler-only, some are runtime-safe. Check imports carefully when using in runtime code.
