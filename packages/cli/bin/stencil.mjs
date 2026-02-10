#!/usr/bin/env node

import { run } from '@stencil/cli'
import { createNodeLogger, createNodeSys } from '@stencil/core/sys/node'

run({
  args: process.argv.slice(2),
  logger: createNodeLogger(),
  sys: createNodeSys(),
})
