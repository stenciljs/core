import { parseCss } from '../parse-css';
import { serializeCss } from '../serialize-css';
import { describe, it, expect } from 'vitest'; 

describe('CSS Nesting', () => {
  it('should parse and serialize basic nested rules', () => {
    const css = `
      .card {
        padding: 10px;
        & .title {
          font-size: 20px;
        }
      }
    `;

    const result = parseCss(css);

    expect(result.diagnostics).toHaveLength(0);

    const serialized = serializeCss(result.stylesheet, {});

    expect(serialized).toContain('.card');
    expect(serialized).toContain('padding:10px');
    expect(serialized).toContain('& .title');
    expect(serialized).toContain('font-size:20px');
  });

  it('should parse nested rules without &', () => {
    const css = `
      .parent {
        color: blue;
        .child {
          color: red;
        }
      }
    `;

    const result = parseCss(css);
    expect(result.diagnostics).toHaveLength(0);

    const serialized = serializeCss(result.stylesheet, {});

    expect(serialized).toContain('.parent');
    expect(serialized).toContain('.child');
  });

  it('should parse multiple nested levels', () => {
    const css = `
      .level1 {
        color: red;
        .level2 {
          color: blue;
          .level3 {
            color: green;
          }
        }
      }
    `;

    const result = parseCss(css);
    expect(result.diagnostics).toHaveLength(0);

    const serialized = serializeCss(result.stylesheet, {});

    expect(serialized).toContain('.level1');
    expect(serialized).toContain('.level2');
    expect(serialized).toContain('.level3');
  });

  // TODO: Nested @media requires additional parsing logic
  it('should parse nested at-rules', () => {
    const css = `
      .component {
        padding: 10px;
        @media (min-width: 768px) {
          padding: 20px;
        }
      }
    `;

    const result = parseCss(css);
    expect(result.diagnostics).toHaveLength(0);

    const serialized = serializeCss(result.stylesheet, {});

    expect(serialized).toContain('.component');
    expect(serialized).toContain('@media');
    expect(serialized).toContain('padding:10px');
    expect(serialized).toContain('padding:20px');
  });

  it('should parse nested @supports', () => {
    const css = `
      .feature {
        display: block;
        @supports (display: grid) {
          display: grid;
        }
      }
    `;

    const result = parseCss(css);
    expect(result.diagnostics).toHaveLength(0);

    const serialized = serializeCss(result.stylesheet, {});

    expect(serialized).toContain('.feature');
    expect(serialized).toContain('@supports');
    expect(serialized).toContain('display:block');
    expect(serialized).toContain('display:grid');
  });

  it('should parse nested @media with multiple declarations', () => {
    const css = `
      .responsive {
        font-size: 14px;
        color: black;
        @media (min-width: 768px) {
          font-size: 16px;
          padding: 20px;
          margin: 10px;
        }
      }
    `;

    const result = parseCss(css);
    expect(result.diagnostics).toHaveLength(0);

    const serialized = serializeCss(result.stylesheet, {});

    expect(serialized).toContain('font-size:14px');
    expect(serialized).toContain('font-size:16px');
    expect(serialized).toContain('padding:20px');
  });

  it('should parse pseudo-class nesting', () => {
    const css = `
      .button {
        background: blue;
        &:hover {
          background: darkblue;
        }
      }
    `;

    const result = parseCss(css);
    expect(result.diagnostics).toHaveLength(0);

    const serialized = serializeCss(result.stylesheet, {});

    expect(serialized).toContain('.button');
    expect(serialized).toContain('&:hover');
  });

  it('should handle mixed declarations and nested rules', () => {
    const css = `
      .card {
        padding: 10px;
        margin: 5px;
        .header {
          font-size: 24px;
        }
        color: blue;
        .footer {
          font-size: 12px;
        }
      }
    `;

    const result = parseCss(css);
    expect(result.diagnostics).toHaveLength(0);

    const serialized = serializeCss(result.stylesheet, {});

    expect(serialized).toContain('.card');
    expect(serialized).toContain('padding:10px');
    expect(serialized).toContain('.header');
    expect(serialized).toContain('.footer');
  });

  it('should handle empty nested rules', () => {
    const css = `
      .parent {
        color: red;
      }
    `;

    const result = parseCss(css);
    expect(result.diagnostics).toHaveLength(0);

    const rule = result.stylesheet.rules?.[0];
    expect(rule?.rules).toBeNull();

    const serialized = serializeCss(result.stylesheet, {});
    expect(serialized).toBe('.parent{color:red}');
  });

  it('should parse @media with deeply nested rules', () => {
    const css = `@media (min-width: 640px) {
  article {
    section:first-of-type {
      flex: 1;
    }
  }
}`;

    const result = parseCss(css);
    expect(result.diagnostics).toHaveLength(0);

    // Should have one @media rule
    expect(result.stylesheet.rules).toHaveLength(1);
    const mediaRule = result.stylesheet.rules?.[0];
    expect(mediaRule?.type).toBe(10); // CssNodeType.Media
    expect(mediaRule?.media).toBe('(min-width: 640px)');

    // @media should contain one rule (article)
    expect(mediaRule?.rules).toHaveLength(1);
    const articleRule = mediaRule?.rules?.[0];
    expect(articleRule?.selectors).toEqual(['article']);
    expect(articleRule?.declarations).toHaveLength(0);

    // article should contain one nested rule (section:first-of-type)
    expect(articleRule?.rules).toHaveLength(1);
    const sectionRule = articleRule?.rules?.[0];
    expect(sectionRule?.selectors).toEqual(['section:first-of-type']);
    expect(sectionRule?.declarations).toHaveLength(1);
    expect(sectionRule?.declarations?.[0].property).toBe('flex');
    expect(sectionRule?.declarations?.[0].value).toBe('1');

    // Verify serialization
    const serialized = serializeCss(result.stylesheet, {});
    expect(serialized).toContain('@media (min-width: 640px)');
    expect(serialized).toContain('article');
    expect(serialized).toContain('section:first-of-type');
    expect(serialized).toContain('flex:1');
  });
});
