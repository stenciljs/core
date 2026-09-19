import { describe, expect, it } from 'vitest';

import { parseCssComponentFile, parseCssOnlyComponents } from '../parse-css-component';

describe('parseCssComponentFile', () => {
  it('finds nothing in a file with no @component marker at all', async () => {
    const { defs, diagnostics } = await parseCssComponentFile(
      '/src/my-badge.css',
      `
      my-badge {
        color: red;
      }
      `,
    );
    expect(defs).toEqual([]);
    expect(diagnostics).toEqual([]);
  });

  it('does NOT treat an ordinary JSDoc comment over a hyphenated selector as a component (the light-dom.css false-positive case)', async () => {
    const { defs, diagnostics } = await parseCssComponentFile(
      '/src/my-component.light-dom.css',
      `
      /**
       * style for light dom
       */
      my-component {
        color: red;
      }

      div[slot="name"] table {
        color: blue;
      }
      `,
    );
    expect(defs).toEqual([]);
    expect(diagnostics).toEqual([]);
  });

  it('parses a flat attribute selector (my-badge[variant])', async () => {
    const { defs, diagnostics } = await parseCssComponentFile(
      '/src/my-badge.css',
      `
      /**
       * @component
       * A badge styled entirely with CSS.
       */
      my-badge {
        --badge-padding: 4px;
      }

      my-badge[variant="warning"] {
        --badge-bg-color: orange;
      }
      `,
    );
    expect(diagnostics).toEqual([]);
    expect(defs).toHaveLength(1);
    expect(defs[0].tagName).toBe('my-badge');
    expect(defs[0].docsText).toBe('A badge styled entirely with CSS.');
    const variant = defs[0].attributes.find((a) => a.name === 'variant');
    expect(variant).toBeTruthy();
    expect(variant!.type).toBe('"warning" | (string & {})');
  });

  it('parses a native-nested attribute selector (&[variant="danger"]) via postcss-nesting', async () => {
    const { defs, diagnostics } = await parseCssComponentFile(
      '/src/my-badge.css',
      `
      /**
       * @component
       * A badge.
       */
      my-badge {
        --badge-padding: 4px;

        &[variant="danger"] {
          --badge-bg-color: red;
        }
      }
      `,
    );
    expect(diagnostics).toEqual([]);
    expect(defs).toHaveLength(1);
    const variant = defs[0].attributes.find((a) => a.name === 'variant');
    expect(variant).toBeTruthy();
    expect(variant!.type).toBe('"danger" | (string & {})');
  });

  it('merges multiple auto-detected literal values for the same attribute into one union', async () => {
    const { defs } = await parseCssComponentFile(
      '/src/my-badge.css',
      `
      /** @component */
      my-badge {
        color: red;
      }
      my-badge[variant="danger"] { color: red; }
      my-badge[variant="warning"] { color: orange; }
      `,
    );
    const variant = defs[0].attributes.find((a) => a.name === 'variant');
    expect(variant!.type).toBe('"danger" | "warning" | (string & {})');
  });

  it('recognizes a presence-only attribute selector as boolean (auto-detected)', async () => {
    const { defs } = await parseCssComponentFile(
      '/src/alert-box.css',
      `
      /** @component */
      alert-box {
        display: block;
      }
      alert-box[dismissible] {
        color: red;
      }
      `,
    );
    const dismissible = defs[0].attributes.find((a) => a.name === 'dismissible');
    expect(dismissible!.type).toBe('boolean');
  });

  it('parses an explicit @attr annotation, which wins over auto-detection', async () => {
    const { defs, diagnostics } = await parseCssComponentFile(
      '/src/alert-box.css',
      `
      /**
       * A dismissible alert.
       * @component
       * @attr {boolean} dismissible - Whether the alert can be dismissed.
       */
      alert-box[dismissible] {
        display: block;
      }
      `,
    );
    expect(diagnostics).toEqual([]);
    expect(defs[0].attributes).toEqual([
      {
        name: 'dismissible',
        type: 'boolean',
        docs: 'Whether the alert can be dismissed.',
        source: 'explicit',
      },
    ]);
  });

  it('collects auto-detected --custom-property declarations only when preceded by their own comment', async () => {
    const { defs } = await parseCssComponentFile(
      '/src/my-badge.css',
      `
      /**
       * @component
       */
      my-badge {
        /** Inner spacing. */
        --badge-padding: 4px;

        --badge-undocumented: 1px;
      }
      `,
    );
    expect(defs[0].properties).toEqual([
      { name: '--badge-padding', docs: 'Inner spacing.', source: 'auto' },
    ]);
  });

  it('collects auto-detected --custom-property declarations inside a resolved nested rule', async () => {
    const { defs } = await parseCssComponentFile(
      '/src/my-badge.css',
      `
      /** @component */
      my-badge {
        &[variant="danger"] {
          /** Danger background */
          --badge-bg-color: red;
        }
      }
      `,
    );
    expect(defs[0].properties).toEqual([
      { name: '--badge-bg-color', docs: 'Danger background', source: 'auto' },
    ]);
  });

  it('parses @prop and @cssprop explicit annotations, which win over auto-detection for the same name', async () => {
    const { defs, diagnostics } = await parseCssComponentFile(
      '/src/my-badge.css',
      `
      /**
       * @component
       * @prop --badge-padding: Inner spacing, explicit.
       * @cssprop --badge-bg-color: Background color.
       */
      my-badge {
        /** This should be overridden by the explicit @prop above. */
        --badge-padding: 4px;
      }
      `,
    );
    expect(diagnostics).toEqual([]);
    expect(defs[0].properties).toEqual(
      expect.arrayContaining([
        { name: '--badge-padding', docs: 'Inner spacing, explicit.', source: 'explicit' },
        { name: '--badge-bg-color', docs: 'Background color.', source: 'explicit' },
      ]),
    );
    expect(defs[0].properties).toHaveLength(2);
  });

  it('parses a native @property at-rule and applies it (as non-explicit) to the component in the same file', async () => {
    const { defs, diagnostics } = await parseCssComponentFile(
      '/src/my-badge.css',
      `
      /** @component */
      my-badge {
        color: red;
      }

      /** Corner radius. */
      @property --badge-radius {
        syntax: "<length>";
        initial-value: 4px;
        inherits: false;
      }
      `,
    );
    expect(diagnostics).toEqual([]);
    const radius = defs[0].properties.find((p) => p.name === '--badge-radius');
    expect(radius).toEqual({
      name: '--badge-radius',
      docs: 'Corner radius.',
      source: 'property-rule',
      syntax: '<length>',
      default: '4px',
    });
  });

  it('warns, but does not throw, when @component marks a rule with an invalid tag selector', async () => {
    const { defs, diagnostics } = await parseCssComponentFile(
      '/src/bad.css',
      `
      /** @component */
      .not-a-tag {
        color: red;
      }
      `,
    );
    expect(defs).toEqual([]);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].level).toBe('warn');
  });

  it('errors on duplicate @component definitions for the same tag in one file, keeping the first', async () => {
    const { defs, diagnostics } = await parseCssComponentFile(
      '/src/dup.css',
      `
      /**
       * @component
       * @prop --a: first
       */
      my-badge {
        color: red;
      }

      /**
       * @component
       * @prop --a: second
       */
      my-badge {
        color: blue;
      }
      `,
    );
    expect(defs).toHaveLength(1);
    expect(defs[0].properties[0].docs).toBe('first');
    expect(diagnostics.some((d) => d.level === 'warn')).toBe(true);
  });

  it('ignores an @component comment not immediately followed by a rule', async () => {
    const { defs, diagnostics } = await parseCssComponentFile(
      '/src/orphan.css',
      `
      /** @component */
      /* just a spacer comment */
      my-badge {
        color: red;
      }
      `,
    );
    expect(defs).toEqual([]);
    expect(diagnostics).toEqual([]);
  });

  it('does not treat a descendant-combinator selector as a valid @component defining rule', async () => {
    const { defs, diagnostics } = await parseCssComponentFile(
      '/src/nested.css',
      `
      /** @component */
      my-badge .icon {
        color: red;
      }
      `,
    );
    expect(defs).toEqual([]);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].level).toBe('warn');
  });

  it('does not leak an attribute from a descendant part of a complex selector onto the component', async () => {
    const { defs } = await parseCssComponentFile(
      '/src/my-badge.css',
      `
      /** @component */
      my-badge {
        color: red;
      }
      my-badge [data-unrelated="x"] {
        color: blue;
      }
      `,
    );
    expect(defs[0].attributes).toEqual([]);
  });

  it('supports multiple @component-marked tags in one file', async () => {
    const { defs, diagnostics } = await parseCssComponentFile(
      '/src/card.css',
      `
      /** @component */
      my-card {
        color: red;
      }

      /** @component */
      my-card-header {
        color: blue;
      }
      `,
    );
    expect(diagnostics).toEqual([]);
    expect(defs.map((d) => d.tagName).sort()).toEqual(['my-card', 'my-card-header']);
  });
});

describe('parseCssOnlyComponents (public single-file entry point)', () => {
  it('returns full ComponentCompilerMeta, not just the intermediate def', async () => {
    const { components, diagnostics } = await parseCssOnlyComponents(
      '/src/my-badge.css',
      `
      /**
       * @component
       * A badge.
       * @attr {boolean} dismissible - Whether it can be dismissed.
       */
      my-badge {
        color: red;
      }
      my-badge[variant="danger"] { color: darkred; }
      `,
    );
    expect(diagnostics).toEqual([]);
    expect(components).toHaveLength(1);
    const meta = components[0];
    expect(meta.tagName).toBe('my-badge');
    expect(meta.componentClassName).toBe('');
    expect(meta.encapsulation).toBe('none');
    expect(meta.properties.map((p) => p.attribute).sort()).toEqual(['dismissible', 'variant']);
  });

  it('returns an empty result for a file with no @component marker', async () => {
    const { components, diagnostics } = await parseCssOnlyComponents(
      '/src/plain.css',
      `body { color: red; }`,
    );
    expect(components).toEqual([]);
    expect(diagnostics).toEqual([]);
  });
});
