import { describe, expect, it, beforeEach } from 'vitest';
import type * as d from '@stencil/core';

import { DEFAULT_STYLE_MODE } from '../../../utils';
import { parseStyleDocs } from '../style-docs';

describe('style-docs', () => {
  let styleDocs: d.StyleDoc[];

  beforeEach(() => {
    styleDocs = [];
  });

  it('no docs', () => {
    const styleText = `
      /**
       * @prop --max-width
       */

      body {
        color: red;
      }
    `;
    parseStyleDocs(styleDocs, styleText);
    expect(styleDocs).toEqual([{ name: `--max-width`, docs: ``, annotation: 'prop' }]);
  });

  it('multiline', () => {
    const styleText = `
      /**
       * @prop --color:  This is the docs
       * for color.
       @prop    --background   : This is the docs
                           for background. It is two
                           * sentences and some :: man.
       */
      body {
        color: red;
      }
    `;
    parseStyleDocs(styleDocs, styleText);
    expect(styleDocs).toEqual([
      { name: `--color`, docs: `This is the docs for color.`, annotation: 'prop' },
      {
        name: `--background`,
        docs: `This is the docs for background. It is two sentences and some :: man.`,
        annotation: 'prop',
      },
    ]);
  });

  it('docs', () => {
    const styleText = `
      /**
       * @prop --max-width: Max width of the alert
       * @prop --color: Descript with : in it
       * * @prop --background: background docs
       @prop --font-weight: font-weight docs
       */

      html {
        height: 100%;
      }

      /**
       * @prop --border: border docs
       * @prop --font-size: font-size docs
       */

      /** @prop --padding: padding docs */

      body {
        color: red;
      }
    `;
    parseStyleDocs(styleDocs, styleText);
    expect(styleDocs).toEqual([
      { name: `--max-width`, docs: `Max width of the alert`, annotation: 'prop' },
      { name: `--color`, docs: `Descript with : in it`, annotation: 'prop' },
      { name: `--background`, docs: `background docs`, annotation: 'prop' },
      { name: `--font-weight`, docs: `font-weight docs`, annotation: 'prop' },
      { name: `--border`, docs: `border docs`, annotation: 'prop' },
      { name: `--font-size`, docs: `font-size docs`, annotation: 'prop' },
      { name: `--padding`, docs: `padding docs`, annotation: 'prop' },
    ]);
  });

  it('invalid css prop comment', () => {
    const styleText = `
      /**
       * hello
       * @prop max-width: Max width of the alert
       * --max-width: Max width of the alert
       */
      /*
       * @prop --max-width
       */
      /* hi i'm normal comments */
      body {
        color: red;
      }
    `;
    parseStyleDocs(styleDocs, styleText);
    expect(styleDocs).toEqual([]);
  });

  it('no closing comments', () => {
    const styleText = `
      /**
      body {
        color: red;
      }
    `;
    parseStyleDocs(styleDocs, styleText);
    expect(styleDocs).toEqual([]);
  });

  it('no comments', () => {
    const styleText = `
      body {
        color: red;
      }
    `;
    parseStyleDocs(styleDocs, styleText);
    expect(styleDocs).toEqual([]);
  });

  it('empty styleText', () => {
    const styleText = ``;
    parseStyleDocs(styleDocs, styleText);
    expect(styleDocs).toEqual([]);
  });

  it('null styleText', () => {
    const styleText: null = null;
    parseStyleDocs(styleDocs, styleText);
    expect(styleDocs).toEqual([]);
  });

  it('works with sass loud comments', () => {
    const styleText = `
      /*!
       * @prop --max-width: Max width of the alert
       */
      body {
        color: red;
      }
    `;
    parseStyleDocs(styleDocs, styleText);
    expect(styleDocs).toEqual([
      { name: `--max-width`, docs: `Max width of the alert`, annotation: 'prop' },
    ]);
  });

  it('works with multiple, mixed comment types', () => {
    const styleText = `
      /**
       * @prop --max-width: Max width of the alert
       */
      /*!
       * @prop --max-width-loud: Max width of the alert (loud)
       */
      body {
        color: red;
      }
    `;
    parseStyleDocs(styleDocs, styleText);
    expect(styleDocs).toEqual([
      { name: `--max-width`, docs: `Max width of the alert`, annotation: 'prop' },
      { name: `--max-width-loud`, docs: `Max width of the alert (loud)`, annotation: 'prop' },
    ]);
  });

  it.each(['ios', 'md', undefined, '', DEFAULT_STYLE_MODE])(
    "attaches mode metadata for a style mode '%s'",
    (mode) => {
      const styleText = `
    /*!
     * @prop --max-width: Max width of the alert
     */
    body {
      color: red;
    }
  `;

      parseStyleDocs(styleDocs, styleText, mode);

      expect(styleDocs).toEqual([
        { name: `--max-width`, docs: `Max width of the alert`, annotation: 'prop', mode },
      ]);
    },
  );

  it('recognizes @cssprop as a synonym for @prop', () => {
    const styleText = `
      /**
       * @cssprop --max-width: Max width of the alert
       */
      body {
        color: red;
      }
    `;
    parseStyleDocs(styleDocs, styleText);
    expect(styleDocs).toEqual([
      { name: `--max-width`, docs: `Max width of the alert`, annotation: 'prop' },
    ]);
  });

  it('recognizes @cssproperty as a synonym for @prop', () => {
    const styleText = `
      /**
       * @cssproperty --max-width: Max width of the alert
       */
      body {
        color: red;
      }
    `;
    parseStyleDocs(styleDocs, styleText);
    expect(styleDocs).toEqual([
      { name: `--max-width`, docs: `Max width of the alert`, annotation: 'prop' },
    ]);
  });

  it('recognizes a mix of @prop, @cssprop and @cssproperty in the same comment', () => {
    const styleText = `
      /**
       * @prop --a: docs for a
       * @cssprop --b: docs for b
       * @cssproperty --c: docs for c
       */
      body {
        color: red;
      }
    `;
    parseStyleDocs(styleDocs, styleText);
    expect(styleDocs).toEqual([
      { name: `--a`, docs: `docs for a`, annotation: 'prop' },
      { name: `--b`, docs: `docs for b`, annotation: 'prop' },
      { name: `--c`, docs: `docs for c`, annotation: 'prop' },
    ]);
  });

  describe('auto-detected custom properties (shadow/scoped encapsulation)', () => {
    it.each(['shadow', 'scoped'])(
      "collects a doc-commented custom property declared inside :host ('%s' encapsulation)",
      (encapsulation) => {
        const styleText = `
          :host {
            /** Corner radius. */
            --my-radius: 4px;
          }
        `;
        parseStyleDocs(styleDocs, styleText, undefined, 'my-cmp', encapsulation);
        expect(styleDocs).toEqual([
          { name: `--my-radius`, docs: `Corner radius.`, annotation: 'prop', mode: undefined },
        ]);
      },
    );

    it('does not collect an undocumented custom property inside :host', () => {
      const styleText = `
        :host {
          --my-radius: 4px;
        }
      `;
      parseStyleDocs(styleDocs, styleText, undefined, 'my-cmp', 'shadow');
      expect(styleDocs).toEqual([]);
    });

    it('does not collect a doc-commented custom property declared outside :host', () => {
      const styleText = `
        .inner {
          /** Not part of the public surface. */
          --tmp-offset: 2px;
        }
      `;
      parseStyleDocs(styleDocs, styleText, undefined, 'my-cmp', 'shadow');
      expect(styleDocs).toEqual([]);
    });

    it('an explicit @prop annotation wins over an auto-detected declaration of the same name', () => {
      const styleText = `
        /**
         * @prop --my-radius: The documented radius
         */
        :host {
          /** A different, auto-detected description. */
          --my-radius: 4px;
        }
      `;
      parseStyleDocs(styleDocs, styleText, undefined, 'my-cmp', 'shadow');
      expect(styleDocs).toEqual([
        { name: `--my-radius`, docs: `The documented radius`, annotation: 'prop' },
      ]);
    });
  });

  describe('auto-detected custom properties (none encapsulation)', () => {
    it('collects a doc-commented custom property declared inside the component tag selector', () => {
      const styleText = `
        my-cmp {
          /** Corner radius. */
          --my-radius: 4px;
        }
      `;
      parseStyleDocs(styleDocs, styleText, undefined, 'my-cmp', 'none');
      expect(styleDocs).toEqual([
        { name: `--my-radius`, docs: `Corner radius.`, annotation: 'prop', mode: undefined },
      ]);
    });

    it('does not collect a doc-commented custom property declared inside :host', () => {
      const styleText = `
        :host {
          /** Corner radius. */
          --my-radius: 4px;
        }
      `;
      parseStyleDocs(styleDocs, styleText, undefined, 'my-cmp', 'none');
      expect(styleDocs).toEqual([]);
    });

    it('does nothing when no tag is provided', () => {
      const styleText = `
        my-cmp {
          /** Corner radius. */
          --my-radius: 4px;
        }
      `;
      parseStyleDocs(styleDocs, styleText, undefined, undefined, 'none');
      expect(styleDocs).toEqual([]);
    });

    it('collects explicit properties, even without tag definition', () => {
      const styleText = `
        /** 
         * @prop --my-radius: The documented radius 
         */
        .inner {
          /** Corner radius. */
          --my-radius: 4px;
        }
      `;
      parseStyleDocs(styleDocs, styleText, undefined, 'my-cmp', 'none');
      expect(styleDocs).toEqual([
        { name: `--my-radius`, docs: `The documented radius`, annotation: 'prop' },
      ]);
    });
  });

  describe('native @property at-rules', () => {
    it('collects syntax/default from a documented @property at-rule', () => {
      const styleText = `
        /** Corner radius. */
        @property --my-radius {
          syntax: "<length>";
          initial-value: 4px;
          inherits: false;
        }
      `;
      parseStyleDocs(styleDocs, styleText);
      expect(styleDocs).toEqual([
        {
          name: `--my-radius`,
          docs: `Corner radius.`,
          annotation: 'prop',
          mode: undefined,
          syntax: `<length>`,
          default: `4px`,
        },
      ]);
    });

    it('collects an undocumented @property at-rule with an empty description', () => {
      const styleText = `
        @property --my-radius {
          syntax: "<length>";
          initial-value: 4px;
        }
      `;
      parseStyleDocs(styleDocs, styleText);
      expect(styleDocs).toEqual([
        {
          name: `--my-radius`,
          docs: ``,
          annotation: 'prop',
          mode: undefined,
          syntax: `<length>`,
          default: `4px`,
        },
      ]);
    });

    it('is not scoped to :host - applies regardless of encapsulation', () => {
      const styleText = `
        /** Corner radius. */
        @property --my-radius {
          syntax: "<length>";
          initial-value: 4px;
        }
      `;
      parseStyleDocs(styleDocs, styleText, undefined, 'my-cmp', 'none');
      expect(styleDocs).toEqual([
        {
          name: `--my-radius`,
          docs: `Corner radius.`,
          annotation: 'prop',
          mode: undefined,
          syntax: `<length>`,
          default: `4px`,
        },
      ]);
    });

    it('an explicit @prop annotation wins over a native @property at-rule of the same name', () => {
      const styleText = `
        /**
         * @prop --my-radius: The documented radius
         */
        /** A different, auto-detected description. */
        @property --my-radius {
          syntax: "<length>";
          initial-value: 4px;
        }
      `;
      parseStyleDocs(styleDocs, styleText);
      expect(styleDocs).toEqual([
        { name: `--my-radius`, docs: `The documented radius`, annotation: 'prop' },
      ]);
    });

    it('an auto-detected :host declaration wins over a native @property at-rule of the same name', () => {
      const styleText = `
        :host {
          /** The :host description. */
          --my-radius: 4px;
        }
        /** The @property description. */
        @property --my-radius {
          syntax: "<length>";
          initial-value: 4px;
        }
      `;
      parseStyleDocs(styleDocs, styleText, undefined, 'my-cmp', 'shadow');
      expect(styleDocs).toEqual([
        {
          name: `--my-radius`,
          docs: `The :host description.`,
          annotation: 'prop',
          mode: undefined,
        },
      ]);
    });
  });
});
