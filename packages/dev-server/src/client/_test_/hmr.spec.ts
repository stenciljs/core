/**
 * @vitest-environment stencil
 */
import { describe, expect, it } from 'vitest'

import { getHmrHref, updateCssUrlValue } from '../hmr/utils'
import { hmrInlineStyles } from '../hmr/style'

describe('updateCssUrlValue', () => {
  const versionId = '1234'

  it('should update url w/ existing qs', () => {
    const fileName = 'img.png'
    const css = `background-image: url('img.png?what=ever&s-hmr=4321')`

    const newCss = updateCssUrlValue(versionId, fileName, css)
    expect(newCss).toBe(`background-image: url('img.png?what=ever&s-hmr=1234')`)
  })

  it('should update url w/ single quotes', () => {
    const fileName = 'img.png'
    const css = `background: url('img.png')`

    const newCss = updateCssUrlValue(versionId, fileName, css)
    expect(newCss).toBe(`background: url('img.png?s-hmr=1234')`)
  })

  it('should update url w/ double quotes', () => {
    const fileName = 'img.png'
    const css = 'background: url("img.png")'

    const newCss = updateCssUrlValue(versionId, fileName, css)
    expect(newCss).toBe('background: url("img.png?s-hmr=1234")')
  })

  it('should update url w/ no quotes', () => {
    const fileName = 'img.png'
    const css = 'background: url(img.png)'

    const newCss = updateCssUrlValue(versionId, fileName, css)
    expect(newCss).toBe('background: url(img.png?s-hmr=1234)')
  })

  it('should not update for different file', () => {
    const fileName = 'img.png'
    const css = 'background: url(hello.png)'

    const newCss = updateCssUrlValue(versionId, fileName, css)
    expect(newCss).toBe('background: url(hello.png)')
  })

  it('should not get url', () => {
    const fileName = 'img.png'
    const css = 'background: red'

    const newCss = updateCssUrlValue(versionId, fileName, css)
    expect(newCss).toBe('background: red')
  })
})

describe('getHmrHref', () => {
  const versionId = '1234'

  it('update existing qs', () => {
    const fileName = 'file-a.css'
    const oldHref = './file-a.css?s-hmr=4321&what=ever'

    const newHref = getHmrHref(versionId, fileName, oldHref)

    expect(newHref).toBe('./file-a.css?s-hmr=1234&what=ever')
  })

  it('add to existing qs', () => {
    const fileName = 'file-a.css'
    const oldHref = './file-a.css?what=ever'

    const newHref = getHmrHref(versionId, fileName, oldHref)

    expect(newHref).toBe('./file-a.css?what=ever&s-hmr=1234')
  })

  it('update no prefix . or / relative href', () => {
    const fileName = 'file-a.css'
    const oldHref = 'file-a.css'

    const newHref = getHmrHref(versionId, fileName, oldHref)

    expect(newHref).toBe('file-a.css?s-hmr=1234')
  })

  it('update exact href', () => {
    const fileName = 'file-a.css'
    const oldHref = '/build/file-a.css'

    const newHref = getHmrHref(versionId, fileName, oldHref)

    expect(newHref).toBe('/build/file-a.css?s-hmr=1234')
  })

  it('not matching file name', () => {
    const fileName = 'file-a.css'
    const oldHref = '/build/file-b.css'

    const newHref = getHmrHref(versionId, fileName, oldHref)

    expect(newHref).toBe('/build/file-b.css')
  })
})

describe('hmrInlineStyles', () => {
  const versionId = '1234'

  it('should update existing style element', () => {
    const styleElm = document.createElement('style')
    styleElm.setAttribute('sty-id', 'sc-test-component')
    styleElm.innerHTML = '.old { color: red; }'
    document.head.appendChild(styleElm)

    hmrInlineStyles(document.documentElement, versionId, [
      { styleId: 'sc-test-component', styleTag: 'test-component', styleText: '.new { color: blue; }' }
    ])

    expect(styleElm.innerHTML).toBe('.new { color: blue; }')
    expect(styleElm.getAttribute('data-hmr')).toBe(versionId)

    styleElm.remove()
  })

  it('should remove style element when styleText is empty', () => {
    const styleElm = document.createElement('style')
    styleElm.setAttribute('sty-id', 'sc-test-component')
    styleElm.innerHTML = '.old { color: red; }'
    document.head.appendChild(styleElm)

    hmrInlineStyles(document.documentElement, versionId, [
      { styleId: 'sc-test-component', styleTag: 'test-component', styleText: '' }
    ])

    expect(document.querySelector('[sty-id="sc-test-component"]')).toBeNull()
  })

  it('should create style element when CSS is added for the first time', () => {
    // Create a component element (scoped, no shadow root)
    const component = document.createElement('test-component')
    document.body.appendChild(component)

    // No existing style element for this component
    expect(document.querySelector('[sty-id="sc-test-component"]')).toBeNull()

    hmrInlineStyles(document.documentElement, versionId, [
      { styleId: 'sc-test-component', styleTag: 'test-component', styleText: '.new { color: blue; }' }
    ])

    // Style element should be created in head
    const styleElm = document.querySelector('[sty-id="sc-test-component"]')
    expect(styleElm).not.toBeNull()
    expect(styleElm!.innerHTML).toBe('.new { color: blue; }')
    expect(styleElm!.getAttribute('data-hmr')).toBe(versionId)

    component.remove()
    styleElm!.remove()
  })

  it('should create style element in shadow root for shadow DOM components', () => {
    // Create a shadow DOM component
    const component = document.createElement('test-shadow-component')
    const shadowRoot = component.attachShadow({ mode: 'open' })
    document.body.appendChild(component)

    hmrInlineStyles(document.documentElement, versionId, [
      { styleId: 'sc-test-shadow-component', styleTag: 'test-shadow-component', styleText: ':host { display: block; }' }
    ])

    // Style element should be created in shadow root
    const styleElm = shadowRoot.querySelector('[sty-id="sc-test-shadow-component"]')
    expect(styleElm).not.toBeNull()
    expect(styleElm!.innerHTML).toBe(':host { display: block; }')

    component.remove()
  })

  it('should update style in shadow root', () => {
    const component = document.createElement('test-shadow-component')
    const shadowRoot = component.attachShadow({ mode: 'open' })
    const styleElm = document.createElement('style')
    styleElm.setAttribute('sty-id', 'sc-test-shadow-component')
    styleElm.innerHTML = '.old { color: red; }'
    shadowRoot.appendChild(styleElm)
    document.body.appendChild(component)

    hmrInlineStyles(document.documentElement, versionId, [
      { styleId: 'sc-test-shadow-component', styleTag: 'test-shadow-component', styleText: ':host { display: block; }' }
    ])

    expect(styleElm.innerHTML).toBe(':host { display: block; }')
    expect(styleElm.getAttribute('data-hmr')).toBe(versionId)

    component.remove()
  })
})
