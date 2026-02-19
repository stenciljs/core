/**
 * @vitest-environment stencil
 */
import { beforeAll, describe, expect, it } from 'vitest'

import { initBuildStatus, updateFavIcon } from '../status.js'

describe('build-status', () => {
  beforeAll(() => {
    window.location.href = 'http://localhost:3000/'
  })
  it('should set error and remember org href', () => {
    const linkElm = document.createElement('link')
    linkElm.href = 'org-icon.ico'
    linkElm.rel = 'shortcut icon'
    linkElm.type = 'org-type'
    document.head.appendChild(linkElm)

    initBuildStatus({ window: window })

    expect(linkElm.dataset.href).toBe('http://localhost:3000/org-icon.ico')
    expect(linkElm.dataset.type).toBe('org-type')

    updateFavIcon(linkElm, 'error')
    expect(linkElm.getAttribute('data-status')).toBe('error')
    expect(linkElm.type).toBe('image/x-icon')

    // Cleanup
    document.head.removeChild(linkElm)
  })

  it('should set pending status', () => {
    const linkElm = document.createElement('link')
    linkElm.rel = 'icon'
    document.head.appendChild(linkElm)

    updateFavIcon(linkElm, 'pending')
    expect(linkElm.getAttribute('data-status')).toBe('pending')
    expect(linkElm.type).toBe('image/x-icon')
    expect(linkElm.href).toContain('data:image/png;base64,')

    // Cleanup
    document.head.removeChild(linkElm)
  })

  it('should set disabled status', () => {
    const linkElm = document.createElement('link')
    linkElm.rel = 'icon'
    document.head.appendChild(linkElm)

    updateFavIcon(linkElm, 'disabled')
    expect(linkElm.getAttribute('data-status')).toBe('disabled')
    expect(linkElm.type).toBe('image/x-icon')

    // Cleanup
    document.head.removeChild(linkElm)
  })

  it('should restore original href on default status', () => {
    const linkElm = document.createElement('link')
    linkElm.rel = 'icon'
    linkElm.dataset.href = 'http://example.com/my-icon.ico'
    linkElm.dataset.type = 'image/png'
    document.head.appendChild(linkElm)

    updateFavIcon(linkElm, 'default')
    expect(linkElm.getAttribute('data-status')).toBeNull()
    expect(linkElm.href).toBe('http://example.com/my-icon.ico')
    expect(linkElm.type).toBe('image/png')

    // Cleanup
    document.head.removeChild(linkElm)
  })
})
