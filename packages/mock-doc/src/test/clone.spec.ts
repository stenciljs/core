import { createDocument, MockDocument } from '../document';
import { cloneDocument } from '../window';

describe('cloneNode', () => {
  let doc: MockDocument;
  beforeEach(() => {
    doc = new MockDocument();
  });

  it('style', () => {
    const elm = doc.createElement('div');
    elm.setAttribute('style', 'color: red;');

    const cloned = elm.cloneNode(true);
    expect(cloned.getAttribute('style')).toEqual(`color: red;`);
  });

  it('id', () => {
    const elm = doc.createElement('div');
    elm.setAttribute('id', 'value');

    const cloned = elm.cloneNode(true);
    expect(cloned.getAttribute('id')).toEqual(`value`);
  });

  it('div', () => {
    const doc = createDocument(`
      <div>
        content
      </div>
    `);

    const cloned = cloneDocument(doc);
    const clonedDiv = cloned.querySelector('div');

    expect(clonedDiv.innerHTML.trim()).toEqual(`content`);
  });

  it('template', () => {
    const doc = createDocument(`
      <template>
        content
      </template>
    `);

    const cloned = cloneDocument(doc);
    const clonedTemplate = cloned.querySelector('template');

    expect(clonedTemplate.innerHTML.trim()).toEqual(`content`);
    expect(clonedTemplate.content.firstChild.textContent.trim()).toEqual(`content`);
  });
});
