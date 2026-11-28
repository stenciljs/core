import { mockComponentMeta } from '@stencil/core/testing';
import { describe, expect, it } from 'vitest';

import { appendDevServerClientIframe, hasCssOnlyComponent, hasNestedHtmlFile } from '../handlers';
import type { CompilerBuildResults } from '../types';
import type { DevServerContext } from '../types';

const mockSys = (filesByDir: Record<string, string[]>): DevServerContext['sys'] =>
  ({
    readDir: async (p: string) => filesByDir[p] ?? [],
    stat: async (p: string) => ({
      isDirectory: !p.includes('.'),
      isFile: p.includes('.'),
      isSymbolicLink: false,
      size: 0,
      error: null,
    }),
  }) as unknown as DevServerContext['sys'];

describe('hasNestedHtmlFile', () => {
  it('returns false when there are no html files anywhere in the tree', async () => {
    const sys = mockSys({
      '/src/my-cmp': ['/src/my-cmp/my-cmp.tsx', '/src/my-cmp/usage'],
      '/src/my-cmp/usage': ['/src/my-cmp/usage/basic.md'],
    });

    const result = await hasNestedHtmlFile(sys, await sys.readDir('/src/my-cmp'));
    expect(result).toBe(false);
  });

  it('returns true when an html file is at the top level', async () => {
    const sys = mockSys({
      '/src/my-cmp': ['/src/my-cmp/my-cmp.tsx', '/src/my-cmp/index.html'],
    });

    const result = await hasNestedHtmlFile(sys, await sys.readDir('/src/my-cmp'));
    expect(result).toBe(true);
  });

  it('returns true when an html file is nested in a subdirectory', async () => {
    const sys = mockSys({
      '/src/my-cmp': ['/src/my-cmp/my-cmp.tsx', '/src/my-cmp/demos'],
      '/src/my-cmp/demos': ['/src/my-cmp/demos/custom.html'],
    });

    const result = await hasNestedHtmlFile(sys, await sys.readDir('/src/my-cmp'));
    expect(result).toBe(true);
  });

  it('returns true when an html file is nested multiple levels deep', async () => {
    const sys = mockSys({
      '/src/my-cmp': ['/src/my-cmp/my-cmp.tsx', '/src/my-cmp/demos'],
      '/src/my-cmp/demos': ['/src/my-cmp/demos/nested'],
      '/src/my-cmp/demos/nested': ['/src/my-cmp/demos/nested/deep.html'],
    });

    const result = await hasNestedHtmlFile(sys, await sys.readDir('/src/my-cmp'));
    expect(result).toBe(true);
  });
});

describe('hasCssOnlyComponent', () => {
  const mockCtx = (sourceFilePaths: string[]) => {
    let calls = 0;
    const ctx = {
      getBuildResults: async () => {
        calls++;
        return {
          cssOnlyComponents: sourceFilePaths.map((sourceFilePath) =>
            mockComponentMeta({ sourceFilePath }),
          ),
        } as CompilerBuildResults;
      },
    };
    return { ctx, getCalls: () => calls };
  };

  it('returns true when a CSS-only component is defined in the directory', async () => {
    const { ctx } = mockCtx(['/src/css-badge/css-badge.css']);

    expect(await hasCssOnlyComponent(ctx, ['/src/css-badge/css-badge.css'], '/src/css-badge')).toBe(
      true,
    );
  });

  it('returns false for a stylesheet that is not a CSS-only component', async () => {
    const { ctx } = mockCtx(['/src/css-badge/css-badge.css']);

    expect(await hasCssOnlyComponent(ctx, ['/src/global.css'], '/src')).toBe(false);
  });

  it('does not request build results when the directory has no style files', async () => {
    const { ctx, getCalls } = mockCtx([]);

    expect(await hasCssOnlyComponent(ctx, ['/src/utils/helpers.ts'], '/src/utils')).toBe(false);
    expect(getCalls()).toBe(0);
  });
});

describe('appendDevServerClientIframe', () => {
  const iframe = '<iframe title="connector"></iframe>';

  it('inserts before the real closing </body>, not an earlier one embedded as page content', () => {
    // A docs page embedding literal HTML source (e.g. a usage example) as text - the embedded
    // `</body>` must not be mistaken for the page's own.
    const content =
      '<html><body>Example: <code>&lt;/body&gt;</code> is a closing tag</body></html>';
    const result = appendDevServerClientIframe(content, iframe);
    expect(result).toBe(
      '<html><body>Example: <code>&lt;/body&gt;</code> is a closing tag' +
        iframe +
        '</body></html>',
    );
  });

  it('inserts before the real closing </html>, not an earlier one embedded as page content', () => {
    // No `</body>` anywhere, so the `</html>` fallback path is what's under test - and there are
    // two `</html>` substrings: an embedded one (page content) and the page's own, real one.
    const content = '<html>Example: <script>const s = "</html>";</script></html>';
    const result = appendDevServerClientIframe(content, iframe);
    expect(result).toBe(
      '<html>Example: <script>const s = "</html>";</script>' + iframe + '</html>',
    );
  });

  it('prefers </body> over </html> when both are present', () => {
    const content = '<html><body>hi</body></html>';
    const result = appendDevServerClientIframe(content, iframe);
    expect(result).toBe('<html><body>hi' + iframe + '</body></html>');
  });

  it('appends at the end when neither closing tag is present', () => {
    const content = 'plain text, not an html document';
    const result = appendDevServerClientIframe(content, iframe);
    expect(result).toBe(content + iframe);
  });
});
