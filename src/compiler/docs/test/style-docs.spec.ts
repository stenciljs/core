import type * as d from '@stencil/core/declarations';
import { DEFAULT_STYLE_MODE } from '@utils';

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
    expect(styleDocs).toEqual([{ name: `--max-width`, docs: `Max width of the alert`, annotation: 'prop' }]);
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

  it.each(['ios', 'md', undefined, '', DEFAULT_STYLE_MODE])("attaches mode metadata for a style mode '%s'", (mode) => {
    const styleText = `
    /*!
     * @prop --max-width: Max width of the alert
     */
    body {
      color: red;
    }
  `;

    parseStyleDocs(styleDocs, styleText, mode);

    expect(styleDocs).toEqual([{ name: `--max-width`, docs: `Max width of the alert`, annotation: 'prop', mode }]);
  });
});
