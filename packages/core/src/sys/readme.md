# sys

System abstraction layer for Node.js APIs.

## Overview

This directory provides abstractions over Node.js file system, path, and other system APIs. It allows the compiler to work with different underlying implementations.

## Historical Context

In earlier versions of Stencil, this abstraction supported:
- Node.js (primary)
- In-browser compilation (deprecated in v5)
- Different file system backends

## Current Status (v5)

With v5 targeting Node.js 18+ only and removing in-browser compilation, much of this abstraction layer is being simplified. The goal is to use Node.js APIs directly where possible.

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `node/` | Node.js-specific implementations |

## Key Interfaces

- `CompilerSystem` - File system, path utilities, and platform detection
- `CompilerFileSystem` - File read/write operations
- `Logger` - Logging abstraction

## Migration Notes

As part of v5 modernization, code should prefer:
- Direct `node:fs` imports over `sys.readFile()`
- Direct `node:path` imports over `sys.path`
- Standard Node.js patterns over abstractions

The abstraction remains for cases where the interface is genuinely useful, but unnecessary indirection is being removed.
