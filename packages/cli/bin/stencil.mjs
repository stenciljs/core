#!/usr/bin/env node

// Set NODE_ENV to production by default (matches legacy webpack bundling behavior)
// This suppresses development-only warnings from dependencies like PostCSS
process.env.NODE_ENV ??= 'production'

import { run } from '@stencil/cli'
import { createNodeLogger, createNodeSys } from '@stencil/core/sys/node'

run({
  args: process.argv.slice(2),
  logger: createNodeLogger(),
  sys: createNodeSys(),
})
