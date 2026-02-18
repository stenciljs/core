/**
 * Editor integration.
 * Consolidated from open-in-browser.ts, open-in-editor.ts, and open-in-editor-api.ts.
 */

import type { ServerResponse } from 'node:http'

import type { DevServerContext, DevServerEditor, HttpRequest, OpenInEditorData } from './types.js'
import { responseHeaders } from './utils.js'

// =============================================================================
// Open in Browser
// =============================================================================

export async function openInBrowser(opts: { url: string }): Promise<void> {
  // Dynamically import 'open' package
  const { default: open } = await import('open')
  await open(opts.url)
}

// =============================================================================
// Open in Editor API (configurable mock for testing)
// =============================================================================

export interface OpenInEditorOptions {
  editor: string
}

export type OpenInEditorCallback = (err: unknown) => void

export interface OpenInEditorDetections {
  [key: string]: {
    detect(): Promise<unknown>
  }
}

interface OpenInEditorApi {
  configure(
    opts: OpenInEditorOptions,
    cb: OpenInEditorCallback
  ): { open(openId: string): Promise<unknown> } | null
  editors: OpenInEditorDetections
}

const openInEditorApi: OpenInEditorApi = {
  configure(_opts: OpenInEditorOptions, _cb: OpenInEditorCallback) {
    return null
  },
  editors: {},
}

// Try to load the actual open-in-editor package if available
let openInEditorLoaded = false

async function loadOpenInEditor(): Promise<void> {
  if (openInEditorLoaded) return

  try {
    const openInEditor = await import('open-in-editor')
    openInEditorApi.configure = openInEditor.configure || openInEditorApi.configure
    openInEditorApi.editors = openInEditor.editors || openInEditorApi.editors
  } catch {
    // Package not available, use mock
  }

  openInEditorLoaded = true
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
    const editors = await getEditors()
    if (editors.length > 0) {
      await parseEditorData(editors, serverCtx.sys, req, data)
      await openDataInEditor(data)
    } else {
      data.error = 'no editors available'
    }
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
  editors: DevServerEditor[],
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

  let editor = qs.get('editor')
  if (typeof editor === 'string') {
    editor = editor.trim().toLowerCase()
    if (editors.some((e) => e.id === editor)) {
      data.editor = editor
    } else {
      data.error = `invalid editor: ${editor}`
      return
    }
  } else {
    data.editor = editors[0].id
  }

  const stat = await sys.stat(data.file)
  data.exists = stat.isFile
}

async function openDataInEditor(data: OpenInEditorData): Promise<void> {
  if (!data.exists || data.error) {
    return
  }

  await loadOpenInEditor()

  try {
    const opts = {
      editor: data.editor!,
    }

    const editor = openInEditorApi.configure(opts, (err) => {
      data.error = String(err)
    })

    if (data.error || !editor) {
      return
    }

    data.open = `${data.file}:${data.line}:${data.column}`
    await editor.open(data.open)
  } catch (e) {
    data.error = String(e)
  }
}

// =============================================================================
// Editor Detection
// =============================================================================

let editorsPromise: Promise<DevServerEditor[]> | null = null

export function getEditors(): Promise<DevServerEditor[]> {
  if (!editorsPromise) {
    editorsPromise = detectEditors()
  }
  return editorsPromise
}

async function detectEditors(): Promise<DevServerEditor[]> {
  await loadOpenInEditor()

  const editors: Array<DevServerEditor & { supported?: boolean; priority?: number }> = []

  try {
    await Promise.all(
      Object.keys(openInEditorApi.editors).map(async (editorId) => {
        const isSupported = await isEditorSupported(editorId)

        editors.push({
          id: editorId,
          priority: EDITOR_PRIORITY[editorId] ?? 100,
          supported: isSupported,
        })
      })
    )
  } catch {
    // Ignore errors during detection
  }

  return editors
    .filter((e) => e.supported)
    .sort((a, b) => {
      if (a.priority! < b.priority!) return -1
      if (a.priority! > b.priority!) return 1
      return 0
    })
    .map((e) => ({
      id: e.id,
      name: EDITORS[e.id],
    }))
}

async function isEditorSupported(editorId: string): Promise<boolean> {
  try {
    await openInEditorApi.editors[editorId].detect()
    return true
  } catch {
    return false
  }
}

const EDITORS: Record<string, string> = {
  atom: 'Atom',
  code: 'Code',
  emacs: 'Emacs',
  idea14ce: 'IDEA 14 Community Edition',
  phpstorm: 'PhpStorm',
  sublime: 'Sublime',
  webstorm: 'WebStorm',
  vim: 'Vim',
  visualstudio: 'Visual Studio',
}

const EDITOR_PRIORITY: Record<string, number> = {
  code: 1,
  atom: 2,
  sublime: 3,
  visualstudio: 4,
  idea14ce: 5,
  webstorm: 6,
  phpstorm: 7,
  vim: 8,
  emacs: 9,
}
