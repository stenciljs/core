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

  it('parses @cssproperty as a synonym for @prop/@cssprop', async () => {
    const { defs } = await parseCssComponentFile(
      '/src/my-badge.css',
      `
      /**
       * @component
       * @cssproperty --badge-color: The badge's text color.
       */
      my-badge {
        color: red;
      }
      `,
    );
    expect(defs[0].properties).toEqual([
      { name: '--badge-color', docs: "The badge's text color.", source: 'explicit' },
    ]);
  });

  describe('slots', () => {
    it('still finds the @component definition when the defining rule has only nested content and no declarations of its own', async () => {
      const { defs, diagnostics } = await parseCssComponentFile(
        '/src/my-badge.css',
        `
        /** @component */
        my-badge {
          [slot="icon-end"] {
            order: 3;
          }
        }
        `,
      );
      expect(diagnostics).toEqual([]);
      expect(defs).toHaveLength(1);
      expect(defs[0].tagName).toBe('my-badge');
      expect(defs[0].slots).toEqual([{ name: 'icon-end', docs: '', source: 'auto' }]);
    });

    it('parses explicit @slot annotations, including the "default" keyword for the unnamed slot', async () => {
      const { defs, diagnostics } = await parseCssComponentFile(
        '/src/my-badge.css',
        `
        /**
         * @component
         * @slot icon-start - The leading icon.
         * @slot default - The default slot.
         */
        my-badge {
          color: red;
        }
        `,
      );
      expect(diagnostics).toEqual([]);
      expect(defs[0].slots).toEqual([
        { name: 'icon-start', docs: 'The leading icon.', source: 'explicit' },
        { name: '', docs: 'The default slot.', source: 'explicit' },
      ]);
    });

    it('parses a bare "@slot - description" (no name) for the default slot, same as a real component\'s @slot tag', async () => {
      const { defs, diagnostics } = await parseCssComponentFile(
        '/src/my-badge.css',
        `
        /**
         * @component
         * @slot - The badge's label.
         */
        my-badge {
          color: red;
        }
        `,
      );
      expect(diagnostics).toEqual([]);
      expect(defs[0].slots).toEqual([{ name: '', docs: "The badge's label.", source: 'explicit' }]);
    });

    it('auto-detects a [slot="x"] selector nested within the component rule, with its leading comment as docs', async () => {
      const { defs } = await parseCssComponentFile(
        '/src/my-badge.css',
        `
        /** @component */
        my-badge {
          display: flex;

          /** Rendered after the label. */
          [slot="icon-end"] {
            order: 3;
          }

          [slot="something-else"] {
          }
        }
        `,
      );
      expect(defs[0].slots).toEqual(
        expect.arrayContaining([
          { name: 'icon-end', docs: 'Rendered after the label.', source: 'auto' },
          { name: 'something-else', docs: '', source: 'auto' },
        ]),
      );
    });

    it('does NOT auto-detect a [slot="x"] selector belonging to a nested custom element, only the component\'s own direct nesting', async () => {
      const { defs } = await parseCssComponentFile(
        '/src/my-card.css',
        `
        /** @component */
        my-card {
          display: block;

          my-icon-widget {
            [slot="icon"] {
              order: 1;
            }
          }

          [slot="header"] {
          }
        }
        `,
      );
      expect(defs[0].slots).toEqual([{ name: 'header', docs: '', source: 'auto' }]);
    });

    it('lets an explicit @slot win over an auto-detected [slot="x"] selector for the same name', async () => {
      const { defs } = await parseCssComponentFile(
        '/src/my-badge.css',
        `
        /**
         * @component
         * @slot icon-start - Explicit wins.
         */
        my-badge {
          display: flex;

          /** Should be ignored - the explicit @slot above wins. */
          [slot="icon-start"] {
            order: 1;
          }
        }
        `,
      );
      expect(defs[0].slots).toEqual([
        { name: 'icon-start', docs: 'Explicit wins.', source: 'explicit' },
      ]);
    });
  });

  describe(':where()/:is() as the defining rule itself', () => {
    it('accepts a bare :is(tag, .fallback-class) as the defining rule, resolving the tag from inside it', async () => {
      const { defs, diagnostics } = await parseCssComponentFile(
        '/src/my-badge.css',
        `
        /** @component */
        :is(my-badge, .my-badge) {
          [slot="icon-start"] {
            order: 1;
          }
        }
        `,
      );
      expect(diagnostics).toEqual([]);
      expect(defs).toHaveLength(1);
      expect(defs[0].tagName).toBe('my-badge');
      expect(defs[0].slots).toEqual([{ name: 'icon-start', docs: '', source: 'auto' }]);
    });

    it('accepts a bare :where(tag, .fallback-class) as the defining rule the same way', async () => {
      const { defs, diagnostics } = await parseCssComponentFile(
        '/src/my-badge.css',
        `
        /** @component */
        :where(my-badge, .my-badge) {
          color: red;
        }
        `,
      );
      expect(diagnostics).toEqual([]);
      expect(defs[0].tagName).toBe('my-badge');
    });

    it('warns, but does not throw, when :is(...) wraps more than one candidate tag - ambiguous', async () => {
      const { defs, diagnostics } = await parseCssComponentFile(
        '/src/my-badge.css',
        `
        /** @component */
        :is(my-badge, my-other-badge) {
          color: red;
        }
        `,
      );
      expect(defs).toEqual([]);
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].level).toBe('warn');
    });

    it('does NOT auto-detect an attribute directly on a :is(tag)[attr] defining rule - only the tag itself is resolved from :is()/:where(), use an explicit @attr instead', async () => {
      const { defs, diagnostics } = await parseCssComponentFile(
        '/src/my-badge.css',
        `
        /** @component */
        :is(my-badge, .my-badge)[dismissible] {
          color: red;
        }
        `,
      );
      expect(diagnostics).toEqual([]);
      expect(defs[0].tagName).toBe('my-badge');
      expect(defs[0].attributes).toEqual([]);
    });
  });

  describe('@scope (tag) as the defining rule itself', () => {
    it('establishes the def from the scope root and auto-detects its own direct custom properties and nested slots', async () => {
      const { defs, diagnostics } = await parseCssComponentFile(
        '/src/my-card.css',
        `
        /** @component */
        @scope (my-card) to ([slot]) {
          /** Card padding. */
          --card-padding: 8px;

          [slot="header"] {
          }
        }
        `,
      );
      expect(diagnostics).toEqual([]);
      expect(defs).toHaveLength(1);
      expect(defs[0].tagName).toBe('my-card');
      expect(defs[0].properties).toEqual([
        { name: '--card-padding', docs: 'Card padding.', source: 'auto' },
      ]);
      expect(defs[0].slots).toEqual([{ name: 'header', docs: '', source: 'auto' }]);
    });

    it('works without a "to (...)" limit clause too', async () => {
      const { defs, diagnostics } = await parseCssComponentFile(
        '/src/my-card.css',
        `
        /** @component */
        @scope (my-card) {
          color: red;
        }
        `,
      );
      expect(diagnostics).toEqual([]);
      expect(defs[0].tagName).toBe('my-card');
    });

    it('resolves the tag from a :where()/:is()-wrapped scope root the same way a rule selector does', async () => {
      const { defs, diagnostics } = await parseCssComponentFile(
        '/src/my-card.css',
        `
        /** @component */
        @scope (:is(my-card, .my-card)) to ([slot]) {
          color: red;
        }
        `,
      );
      expect(diagnostics).toEqual([]);
      expect(defs[0].tagName).toBe('my-card');
    });

    it('warns, but does not throw, when the scope root has no tag or an ambiguous one', async () => {
      const { defs, diagnostics } = await parseCssComponentFile(
        '/src/my-card.css',
        `
        /** @component */
        @scope (.not-a-tag) to ([slot]) {
          color: red;
        }
        `,
      );
      expect(defs).toEqual([]);
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].level).toBe('warn');
    });
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
