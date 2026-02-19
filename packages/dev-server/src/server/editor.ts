/**
 * Editor integration using launch-editor.
 * Consolidated from open-in-browser.ts, open-in-editor.ts, and open-in-editor-api.ts.
 */

import type { ServerResponse } from 'node:http'

import type { DevServerContext, DevServerEditor, HttpRequest, OpenInEditorData } from './types'
import { responseHeaders } from './utils'

// =============================================================================
// Open in Browser
// =============================================================================

export async function openInBrowser(opts: { url: string }): Promise<void> {
  // Dynamically import 'open' package
  const { default: open } = await import('open')
  await open(opts.url)
}

// =============================================================================
// Launch Editor Integration
// =============================================================================

let launchEditorLoaded = false
let launchEditor: ((file: string, specifiedEditor?: string, onErrorCallback?: (fileName: string, errorMessage: string | null) => void) => void) | null = null

async function loadLaunchEditor(): Promise<void> {
  if (launchEditorLoaded) return

  try {
    const mod = await import('launch-editor')
    launchEditor = mod.default || mod
  } catch (e) {
    console.warn('launch-editor package is not available. Open in editor functionality will be disabled.')
    // Package not available
    launchEditor = null
  }

  launchEditorLoaded = true
}

// =============================================================================
// Open in Editor Handler
// =============================================================================

export async function serveOpenInEditor(
  serverCtx: DevServerContext,
  req: HttpRequest,
  res: ServerResponse
): Promise<void> {
  let status = 200
  const data: OpenInEditorData = {}

  try {
    await parseEditorData(serverCtx.sys, req, data)
    await openDataInEditor(data)
  } catch (e) {
    data.error = String(e)
    status = 500
  }

  serverCtx.logRequest(req, status)

  res.writeHead(
    status,
    responseHeaders({
      'content-type': 'application/json; charset=utf-8',
    })
  )

  res.write(JSON.stringify(data, null, 2))
  res.end()
}

async function parseEditorData(
  sys: DevServerContext['sys'],
  req: HttpRequest,
  data: OpenInEditorData
): Promise<void> {
  const qs = req.searchParams!

  if (!qs.has('file')) {
    data.error = 'missing file'
    return
  }

  data.file = qs.get('file')!

  if (qs.has('line') && !isNaN(Number(qs.get('line')))) {
    data.line = parseInt(qs.get('line')!, 10)
  }
  if (typeof data.line !== 'number' || data.line < 1) {
    data.line = 1
  }

  if (qs.has('column') && !isNaN(Number(qs.get('column')))) {
    data.column = parseInt(qs.get('column')!, 10)
  }
  if (typeof data.column !== 'number' || data.column < 1) {
    data.column = 1
  }

  if (qs.has('editor')) {
    data.editor = qs.get('editor')!
  }

  const stat = await sys.stat(data.file)
  data.exists = stat.isFile
}

async function openDataInEditor(data: OpenInEditorData): Promise<void> {
  if (!data.exists || data.error) {
    return
  }

  await loadLaunchEditor()

  if (!launchEditor) {
    data.error = 'launch-editor not available'
    return
  }

  try {
    // Format: file:line:column
    const fileSpec = `${data.file}:${data.line}:${data.column}`
    
    await new Promise<void>((resolve, reject) => {
      let errorCalled = false
      
      launchEditor!(
        fileSpec,
        data.editor || process.env.EDITOR, // Try editor param, then env var, then auto-detect
        (_fileName: string, errorMessage: string | null) => {
          errorCalled = true
          const errMsg = errorMessage || 'Unknown error'
          // Log to dev server console so user sees it
          console.error('Editor launch failed.')
          console.error('The "code" executable was not found in your PATH.')
          console.error('This usually means your editor\'s command-line tool isn\'t installed.')
          console.error('Try running:')
          console.error('  code --version')
          console.error('If that fails, install your editor\'s CLI command and ensure it\'s in your PATH.\n')
          data.error = errMsg
          reject(new Error(errMsg))
        }
      )
      
      // launch-editor doesn't have a success callback
      // Give it a moment to call the error callback if there's an issue
      setTimeout(() => {
        if (!errorCalled) {
          data.open = fileSpec
          resolve()
        }
      }, 100)
    })
  } catch (e) {
    if (!data.error) {
      data.error = String(e)
    }
  }
}

// =============================================================================
// Editor Detection (Simplified - launch-editor handles this internally)
// =============================================================================

export function getEditors(): Promise<DevServerEditor[]> {
  // launch-editor automatically detects editors, so we just return common ones
  // The actual detection happens when opening a file
  return Promise.resolve([
    { id: 'code', name: 'Visual Studio Code' },
    { id: 'cursor', name: 'Cursor' },
    { id: 'code-insiders', name: 'VS Code Insiders' },
    { id: 'webstorm', name: 'WebStorm' },
    { id: 'idea', name: 'IntelliJ IDEA' },
    { id: 'sublime', name: 'Sublime Text' },
    { id: 'atom', name: 'Atom' },
    { id: 'vim', name: 'Vim' },
    { id: 'emacs', name: 'Emacs' },
  ])
}
