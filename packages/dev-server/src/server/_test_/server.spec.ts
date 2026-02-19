import * as net from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'

import { findClosestOpenPort } from '../server'

describe('findClosestOpenPort', () => {
  let testServer: net.Server | undefined
  const TEST_HOST = '127.0.0.1'
  const TEST_PORT = 9876

  afterEach(async () => {
    if (testServer) {
      await new Promise<void>((resolve) => {
        testServer!.close(() => resolve())
      })
      testServer = undefined
    }
  })

  it('should return the same port if it is available', async () => {
    const port = await findClosestOpenPort(TEST_HOST, TEST_PORT)
    expect(port).toBe(TEST_PORT)
  })

  it('should find the next available port when strictPort is false', async () => {
    testServer = net.createServer()
    await new Promise<void>((resolve) => {
      testServer!.listen(TEST_PORT, TEST_HOST, () => resolve())
    })

    const port = await findClosestOpenPort(TEST_HOST, TEST_PORT, false)
    expect(port).toBe(TEST_PORT + 1)
  })

  it('should find the next available port when strictPort is not provided (defaults to false)', async () => {
    testServer = net.createServer()
    await new Promise<void>((resolve) => {
      testServer!.listen(TEST_PORT, TEST_HOST, () => resolve())
    })

    const port = await findClosestOpenPort(TEST_HOST, TEST_PORT)
    expect(port).toBe(TEST_PORT + 1)
  })

  it('should throw an error when port is taken and strictPort is true', async () => {
    testServer = net.createServer()
    await new Promise<void>((resolve) => {
      testServer!.listen(TEST_PORT, TEST_HOST, () => resolve())
    })

    await expect(findClosestOpenPort(TEST_HOST, TEST_PORT, true)).rejects.toThrow(
      `Port ${TEST_PORT} is already in use. Please specify a different port or set strictPort to false.`
    )
  })

  it('should return the port when available and strictPort is true', async () => {
    const port = await findClosestOpenPort(TEST_HOST, TEST_PORT, true)
    expect(port).toBe(TEST_PORT)
  })
})
