import { describe, expect, it } from 'vitest';

import { transpile, transpileSync } from '../transpile';

describe('transpile() - CSS style docs', () => {
  it('does not collect styleDocs by default', async () => {
    const results = await transpile(
      `
        :host {
          /** Corner radius. */
          --my-radius: 4px;
        }
      `,
      { file: 'my-cmp.css?tag=my-cmp&encapsulation=shadow' },
    );

    expect(results.styleDocs).toBeUndefined();
  });

  it('collects an explicit @prop annotation when docs is requested', async () => {
    const results = await transpile(
      `
        /**
         * @prop --my-color: The text color
         */
        :host {
          color: var(--my-color);
        }
      `,
      { file: 'my-cmp.css?tag=my-cmp&encapsulation=shadow', docs: true },
    );

    expect(results.styleDocs).toEqual([
      { name: '--my-color', docs: 'The text color', annotation: 'prop', mode: '$' },
    ]);
  });

  it('auto-detects a doc-commented :host declaration when docs is requested', async () => {
    const results = await transpile(
      `
        :host {
          /** Corner radius. */
          --my-radius: 4px;
        }
      `,
      { file: 'my-cmp.css?tag=my-cmp&encapsulation=shadow', docs: true },
    );

    expect(results.styleDocs).toEqual([
      { name: '--my-radius', docs: 'Corner radius.', annotation: 'prop', mode: '$' },
    ]);
  });

  it('collects syntax/default from a native @property at-rule when docs is requested', async () => {
    const results = await transpile(
      `
        /** Corner radius. */
        @property --my-radius {
          syntax: "<length>";
          initial-value: 4px;
        }
      `,
      { file: 'my-cmp.css?tag=my-cmp&encapsulation=shadow', docs: true },
    );

    expect(results.styleDocs).toEqual([
      {
        name: '--my-radius',
        docs: 'Corner radius.',
        annotation: 'prop',
        mode: '$',
        syntax: '<length>',
        default: '4px',
      },
    ]);
  });

  it('is scoped to the tag selector for none encapsulation', async () => {
    const results = await transpile(
      `
        my-cmp {
          /** Corner radius. */
          --my-radius: 4px;
        }
      `,
      { file: 'my-cmp.css?tag=my-cmp&encapsulation=none', docs: true },
    );

    expect(results.styleDocs).toEqual([
      { name: '--my-radius', docs: 'Corner radius.', annotation: 'prop', mode: '$' },
    ]);
  });

  it('works the same way synchronously via transpileSync', () => {
    const results = transpileSync(
      `
        :host {
          /** Corner radius. */
          --my-radius: 4px;
        }
      `,
      { file: 'my-cmp.css?tag=my-cmp&encapsulation=shadow', docs: true },
    );

    expect(results.styleDocs).toEqual([
      { name: '--my-radius', docs: 'Corner radius.', annotation: 'prop', mode: '$' },
    ]);
  });
});
