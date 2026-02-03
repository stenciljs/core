import { h, setTagTransformer, transformTag } from '@stencil/core';
import { render } from '@wdio/browser-runner/stencil';
import { browser } from '@wdio/globals';

import {
  renderToString,
  setTagTransformer as hydrateSetTagTransformer,
  transformTag as hydrateTagTransformer,
} from '../hydrate/index.mjs';
import { setupIFrameTest } from '../util.js';
import tagTransformer from './tag-transformer.js';

// We need to register the tag transformer here 'cos tests use a different Stencil runtime instance
// than the one used to build the components being tested.
setTagTransformer(tagTransformer);
hydrateSetTagTransformer(tagTransformer);
window.global = globalThis;

const jsxRendering = async (root: HTMLParentTagTransformElement) => {
  expect(root.shadowRoot.querySelector('child-tag-is-transformed')).toBeTruthy();
};
const querySelector = async (root: HTMLParentTagTransformElement) => {
  expect(await root.querySelectorChildTags()).toBeTruthy();
};
const querySelectorAll = async (root: HTMLParentTagTransformElement) => {
  expect((await root.querySelectorAllChildTags()).length).toBe(2);
};
const createElement = async (root: HTMLParentTagTransformElement) => {
  const child: any = await root.createChildTagElement();
  expect(child.tagName).toBe('CHILD-TAG-IS-TRANSFORMED');
};
const closest = async (root: HTMLParentTagTransformElement) => {
  expect(
    await root.querySelector<HTMLChildTagTransformElement>('child-tag-is-transformed').closestParentTag(),
  ).toBeTruthy();
};
const cssSelectors = async (root: HTMLParentTagTransformElement) => {
  expect(getComputedStyle(root.shadowRoot.querySelector('child-tag-is-transformed')).borderColor).toBe(
    'rgba(0, 0, 255, 1)',
  );
  // blue border applied from parent-tag-transform.css using transformed selector
};

describe('Tag Transformer', () => {
  describe('dist build', () => {
    let el: HTMLParentTagTransformElement;

    beforeEach(() => {
      render({
        components: [],
        template: () => (
          <parent-tag-is-transformed>
            <child-tag-is-transformed />
          </parent-tag-is-transformed>
        ),
      });
      el = document.querySelector<HTMLParentTagTransformElement>('parent-tag-is-transformed');
    });

    it('basic', async () => {
      expect(transformTag('child-tag-transform')).toBe('child-tag-is-transformed');
      expect(transformTag('parent-tag-transform')).toBe('parent-tag-is-transformed');
      expect(transformTag('something-else')).toBe('something-else');
      expect(el).toBeTruthy();
    });
    it('transforms tags within jsx', async () => {
      await jsxRendering(el);
    });
    it('transforms tags within querySelector', async () => {
      await querySelector(el);
    });
    it('transforms tags within querySelectorAll', async () => {
      await querySelectorAll(el);
    });
    it('transforms tags within createElement', async () => {
      await createElement(el);
    });
    it('transforms tags within closest', async () => {
      await closest(el);
    });
    it('applies styles using transformed css selectors', async () => {
      await cssSelectors(el);
    });
  });

  describe('dist-custom-elements build', () => {
    let el: HTMLParentTagTransformElement;

    before(async () => {
      await browser.switchToParentFrame();
      const frameContent = await setupIFrameTest('/tag-transform/custom-element.html', 'tag-transform-custom-elements');
      // const frameEle = await browser.$('iframe#tag-transform-custom-elements');
      // await frameEle.waitUntil(async () => !!frameContent.querySelector('parent-tag-is-transformed'), { timeout: 5000 });
      el = frameContent.querySelector<HTMLParentTagTransformElement>('parent-tag-is-transformed');
    });

    it('basic', async () => {
      expect(transformTag('child-tag-transform')).toBe('child-tag-is-transformed');
      expect(transformTag('parent-tag-transform')).toBe('parent-tag-is-transformed');
      expect(transformTag('something-else')).toBe('something-else');
      expect(el).toBeTruthy();
    });
    it('transforms tags within jsx', async () => {
      await jsxRendering(el);
    });
    it('transforms tags within querySelector', async () => {
      await querySelector(el);
    });
    it('transforms tags within querySelectorAll', async () => {
      await querySelectorAll(el);
    });
    it('transforms tags within createElement', async () => {
      await createElement(el);
    });
    it('transforms tags within closest', async () => {
      await closest(el);
    });
    it('applies styles using transformed css selectors', async () => {
      await cssSelectors(el);
    });
  });

  describe('hydrate build', () => {
    hydrateSetTagTransformer(tagTransformer);

    renderToString(
      `
      <html>
        <body>
          <parent-tag-is-transformed>
            <child-tag-is-transformed></child-tag-is-transformed>
          </parent-tag-is-transformed>
        </body>
      </html>
    `,
      {
        runtimeLogging: true,
        afterHydrate: (doc: Document) => {
          const el = doc.querySelector<HTMLParentTagTransformElement>('parent-tag-is-transformed');

          it('basic', async () => {
            expect(hydrateTagTransformer('child-tag-transform')).toBe('child-tag-is-transformed');
            expect(hydrateTagTransformer('parent-tag-transform')).toBe('parent-tag-is-transformed');
            expect(hydrateTagTransformer('something-else')).toBe('something-else');
            expect(el).toBeTruthy();
          });
          it('transforms tags within jsx', async () => {
            await jsxRendering(el);
          });
          it('transforms tags within querySelector', async () => {
            await querySelector(el);
          });
          it('transforms tags within querySelectorAll', async () => {
            await querySelectorAll(el);
          });
          it('transforms tags within createElement', async () => {
            await createElement(el);
          });
          it('transforms tags within closest', async () => {
            await closest(el);
          });
        },
      },
    ).then((result) => {
      it('applies styles using transformed css selectors', async () => {
        expect(result.html).toContain('child-tag-is-transformed:hover {');
        expect(result.html).toContain('child-tag-is-transformed.active {');
        expect(result.html).toContain(
          'child-tag-is-transformed{display:block;padding:10px;margin:5px;border:2px solid blue}',
        );
      });
    });
  });
});
