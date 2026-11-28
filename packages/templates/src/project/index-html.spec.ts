import { describe, it, expect } from 'vitest';

import { generateIndexHtml } from './index-html.js';

describe('generateIndexHtml', () => {
  it('includes the project name as the title', () => {
    const result = generateIndexHtml({
      projectName: 'my-app',
      namespace: 'MyApp',
      globalStyle: false,
    });
    expect(result).toContain(`<title>my-app</title>`);
  });

  it('points the entry script at the lowercased namespace bundle', () => {
    const result = generateIndexHtml({
      projectName: 'my-app',
      namespace: 'MyApp',
      globalStyle: false,
    });
    expect(result).toContain(`<script type="module" src="/build/myapp.js"></script>`);
  });

  it('omits the stylesheet link when globalStyle is false', () => {
    const result = generateIndexHtml({
      projectName: 'my-app',
      namespace: 'MyApp',
      globalStyle: false,
    });
    expect(result).not.toContain('<link');
  });

  it('includes a stylesheet link to the global CSS bundle when globalStyle is true', () => {
    const result = generateIndexHtml({
      projectName: 'my-app',
      namespace: 'MyApp',
      globalStyle: true,
    });
    expect(result).toContain(`<link rel="stylesheet" href="/build/myapp.css" />`);
  });

  it('includes an example usage of my-component', () => {
    const result = generateIndexHtml({
      projectName: 'my-app',
      namespace: 'MyApp',
      globalStyle: false,
    });
    expect(result).toContain('<my-component');
  });
});
