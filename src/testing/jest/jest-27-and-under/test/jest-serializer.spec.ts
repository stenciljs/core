import { MockDocument } from '@stencil/core/mock-doc';

import { HtmlSerializer } from '../jest-serializer';

describe('serialize node', () => {
  let doc: MockDocument;

  beforeEach(() => {
    doc = new MockDocument();
    const div = doc.createElement('div');
    div.innerText = 'Test';
    doc.body.appendChild(div);
  });

  it('should be valid serializer', () => {
    expect(HtmlSerializer.test(doc)).toBeTruthy();
    expect(HtmlSerializer.test(doc.body)).toBeTruthy();
  });

  it('should generate serialized element', () => {
    const result = HtmlSerializer.print(doc.body);
    expect(result).toContain(`<div>`);
  });

  it('should serialize', () => {
    expect.addSnapshotSerializer(HtmlSerializer);
    expect(doc.body).toMatchSnapshot();
  });
});
