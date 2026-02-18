/**
 * Type declarations for the optional 'open-in-editor' package.
 */
declare module 'open-in-editor' {
  export interface OpenInEditorOptions {
    editor?: string
  }

  export interface Editor {
    open(path: string): Promise<void>
  }

  export interface EditorDetector {
    detect(): Promise<unknown>
  }

  export function configure(
    options: OpenInEditorOptions,
    callback: (err: unknown) => void
  ): Editor | null

  export const editors: Record<string, EditorDetector>
}
