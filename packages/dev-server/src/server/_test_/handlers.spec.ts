import { describe, expect, it } from 'vitest';

import { appendDevServerClientIframe, hasNestedHtmlFile } from '../handlers';
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
